const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const TeamInvitation = require('../models/TeamInvitation');
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');
const buildMailShell = require('../utils/emailTemplate');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim().toLowerCase();

const isStaffRole = (role) => ['admin', 'incharge', 'volunteer'].includes(role);

const assertActiveAccount = (user) => {
    if (!user || user.status === 'active') {
        return null;
    }

    if (user.status === 'freezed') {
        return 'Your account has been freezed. Contact the admin to regain access.';
    }

    if (user.status === 'disqualified') {
        return 'Your account has been disqualified and cannot register for events.';
    }

    return 'Your account is not allowed to register for events.';
};

const countRegistrationsForSlot = (registrations, event) => registrations.filter((registration) => {
    const registrationEvent = registration.event;
    return normalizeText(registrationEvent?.date) === normalizeText(event?.date)
        && normalizeText(registrationEvent?.time) === normalizeText(event?.time);
}).length;

const collectTakenEmailsForEvent = async (eventId) => {
    const regs = await Registration.findAll({
        where: { eventId },
        include: [{ model: User, as: 'user', attributes: ['email'] }]
    });

    const taken = new Set();

    for (const reg of regs) {
        if (reg.user?.email) {
            taken.add(normalizeEmail(reg.user.email));
        }

        if (reg.teamDetails?.leader) {
            taken.add(normalizeEmail(reg.teamDetails.leader));
        }

        if (Array.isArray(reg.teamDetails?.members)) {
            for (const member of reg.teamDetails.members) {
                if (member?.email) {
                    taken.add(normalizeEmail(member.email));
                }
            }
        }
    }

    return taken;
};

const buildTeamInviteMail = ({ appBase, inviterName, teamName, eventName }) => {
    return buildMailShell({
        appBase,
        title: 'Team Invitation',
        subtitle: `You were added to ${teamName}`,
        content: `
            <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px 0;">Hello,</p>
            <p style="font-size: 15px; color: #f5e1b3; line-height:1.6; margin:0 0 16px 0;">
                <strong>${inviterName}</strong> has added you to the team <strong>${teamName}</strong> for <strong>${eventName}</strong>.
            </p>
            <p style="font-size: 13px; color:#d6c7a3; margin:0;">
                Open your Sangamam dashboard to view the registration details.
            </p>
        `
    });
};

const buildInvitationAcceptedMail = ({ appBase, teamName, eventName }) => {
    return buildMailShell({
        appBase,
        title: 'Invitation Accepted',
        subtitle: `You joined ${teamName}`,
        content: `
            <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px 0;">Hello,</p>
            <p style="font-size: 15px; color: #f5e1b3; line-height:1.6; margin:0;">
                Your invitation for <strong>${teamName}</strong> in <strong>${eventName}</strong> has been accepted.
            </p>
        `
    });
};

const buildInvitationRejectedMail = ({ appBase, teamName, eventName }) => {
    return buildMailShell({
        appBase,
        title: 'Invitation Declined',
        subtitle: `Invite updated for ${teamName}`,
        content: `
            <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px 0;">Hello,</p>
            <p style="font-size: 15px; color: #f5e1b3; line-height:1.6; margin:0;">
                The team invitation for <strong>${teamName}</strong> in <strong>${eventName}</strong> was declined.
            </p>
        `
    });
};

const buildTeamRegistrationPayload = async ({ user, event, teamDetails }) => {
    const qrData = JSON.stringify({
        id: user.uuid,
        name: user.name,
        eventId: event.id,
        uuid: Math.random().toString(36).substring(2, 15)
    });

    return {
        userId: user.id,
        eventId: event.id,
        type: 'team',
        teamDetails,
        qrCode: await QRCode.toDataURL(qrData)
    };
};

exports.registerEvent = async (req, res) => {
    try {
        const { eventId, type, teamDetails } = req.body;
        const userId = req.user.id;

        const blockedMessage = assertActiveAccount(req.user);
        if (blockedMessage) {
            return res.status(403).json({ message: blockedMessage });
        }

        if (isStaffRole(req.user.role)) {
            return res.status(403).json({ message: 'Staff accounts cannot register for events' });
        }

        const existing = await Registration.findOne({ where: { userId, eventId } });
        if (existing) return res.status(400).json({ message: 'Already registered' });

        const event = await Event.findByPk(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const existingRegistrations = await Registration.findAll({
            where: { userId },
            include: [{ model: Event, as: 'event', attributes: ['id', 'date', 'time'] }]
        });
        const registrationsAtSameSlot = countRegistrationsForSlot(existingRegistrations, event);
        if (registrationsAtSameSlot >= 2) {
            return res.status(400).json({
                message: `You can register for only 2 events at ${event.time} on ${event.date}`
            });
        }

        let teamDetailsToSave = teamDetails;

        if (type === 'team') {
            const members = Array.isArray(teamDetails?.members) ? teamDetails.members : [];
            const memberEmails = members.map((m) => normalizeEmail(m?.email)).filter(Boolean);

            if (memberEmails.length === 0) {
                return res.status(400).json({ message: 'Select at least one team member' });
            }

            if (new Set(memberEmails).size !== memberEmails.length) {
                return res.status(400).json({ message: 'Duplicate members are not allowed in a team' });
            }

            const minMembersToSelect = Math.max((event.minTeamSize || 2) - 1, 1);
            const maxMembersToSelect = Math.max((event.maxTeamSize || 4) - 1, minMembersToSelect);

            if (memberEmails.length < minMembersToSelect || memberEmails.length > maxMembersToSelect) {
                return res.status(400).json({ message: `Team must include ${minMembersToSelect} to ${maxMembersToSelect} members besides leader` });
            }

            if (!req.user.college) {
                return res.status(400).json({ message: 'Your college information is required for team events' });
            }

            const memberUsers = await User.findAll({
                where: { email: memberEmails },
                attributes: ['id', 'name', 'email', 'college', 'role']
            });

            if (memberUsers.length !== memberEmails.length) {
                return res.status(400).json({ message: 'Some selected members are not registered in the portal' });
            }

            const invalidByRole = memberUsers.find((u) => u.role !== 'participant');
            if (invalidByRole) {
                return res.status(400).json({ message: 'Only participant accounts can be added to team' });
            }

            const invalidByCollege = memberUsers.find((u) => normalizeEmail(u.college) !== normalizeEmail(req.user.college));
            if (invalidByCollege) {
                return res.status(400).json({ message: 'All team members must belong to your college' });
            }

            const takenEmails = await collectTakenEmailsForEvent(eventId);
            const alreadyTaken = memberEmails.find((email) => takenEmails.has(email));
            if (alreadyTaken) {
                return res.status(400).json({ message: `${alreadyTaken} is already participating in this event` });
            }

            teamDetailsToSave = {
                ...(teamDetails || {}),
                name: teamDetails?.name || `${req.user.name || 'Team Lead'} Team`,
                leader: req.user.email,
                leaderName: req.user.name,
                leaderCollege: req.user.college,
                members
            };
        }

        const qrData = JSON.stringify({
            id: req.user.uuid,
            name: req.user.name,
            eventId: eventId,
            uuid: Math.random().toString(36).substring(2, 15)
        });
        const qrCode = await QRCode.toDataURL(qrData);

        const registration = await Registration.create({
            userId,
            eventId,
            type,
            teamDetails: teamDetailsToSave,
            qrCode
        });

        // Fetch back with populated event
        const result = await Registration.findByPk(registration.id, { include: [{ model: Event, as: 'event' }] });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addTeamMember = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const { email } = req.body;

        const blockedMessage = assertActiveAccount(req.user);
        if (blockedMessage) {
            return res.status(403).json({ message: blockedMessage });
        }

        if (!eventId) {
            return res.status(400).json({ message: 'Invalid event id' });
        }

        const memberEmail = normalizeEmail(email);
        if (!memberEmail) {
            return res.status(400).json({ message: 'Member email is required' });
        }

        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const leaderRegistration = await Registration.findOne({
            where: { userId: req.user.id, eventId },
            include: [{ model: User, as: 'user', attributes: ['name', 'email', 'college'] }, { model: Event, as: 'event', attributes: ['id', 'name', 'maxTeamSize', 'minTeamSize'] }]
        });

        if (!leaderRegistration || leaderRegistration.type !== 'team') {
            return res.status(400).json({ message: 'Team registration not found for this event' });
        }

        const memberUser = await User.findOne({
            where: { email: memberEmail },
            attributes: ['id', 'name', 'email', 'college', 'role', 'status']
        });

        if (!memberUser) {
            return res.status(404).json({ message: 'Selected member is not registered in the portal' });
        }

        if (memberUser.role !== 'participant') {
            return res.status(400).json({ message: 'Only participant accounts can be added to a team' });
        }

        if (normalizeEmail(memberUser.college) !== normalizeEmail(req.user.college)) {
            return res.status(400).json({ message: 'Team members must belong to your college' });
        }

        if (memberEmail === normalizeEmail(req.user.email)) {
            return res.status(400).json({ message: 'You cannot add yourself to the team' });
        }

        const currentTeamDetails = leaderRegistration.teamDetails || {};
        const currentMembers = Array.isArray(currentTeamDetails.members) ? currentTeamDetails.members : [];

        const conflictingInvitation = await TeamInvitation.findOne({
            where: {
                eventId,
                inviteeEmail: memberEmail,
                status: 'pending'
            }
        });

        if (conflictingInvitation && normalizeEmail(conflictingInvitation.inviterEmail) !== normalizeEmail(req.user.email)) {
            return res.status(400).json({ message: 'User already has a pending invitation for this event' });
        }

        const existingInvitation = await TeamInvitation.findOne({
            where: {
                eventId,
                inviteeEmail: memberEmail,
                inviterEmail: normalizeEmail(req.user.email)
            }
        });

        if (existingInvitation?.status === 'accepted') {
            return res.status(400).json({ message: 'User already accepted this invitation' });
        }

        if (currentMembers.some((member) => normalizeEmail(member?.email) === memberEmail)) {
            return res.status(400).json({ message: 'User already added to this team' });
        }

        const maxMembersToSelect = Math.max((event.maxTeamSize || 4) - 1, 1);
        if (currentMembers.length >= maxMembersToSelect) {
            return res.status(400).json({ message: `Team is already full (${maxMembersToSelect} members besides leader)` });
        }

        const takenEmails = await collectTakenEmailsForEvent(eventId);
        if (takenEmails.has(memberEmail)) {
            return res.status(400).json({ message: `${memberEmail} is already participating in this event` });
        }

        const updatedTeamName = currentTeamDetails.name || `${req.user.name || 'Team Lead'} Team`;
        const updatedTeamDetails = {
            ...currentTeamDetails,
            name: updatedTeamName,
            leader: req.user.email,
            leaderName: req.user.name,
            leaderCollege: req.user.college,
            members: [
                ...currentMembers,
                {
                    email: memberUser.email,
                    name: memberUser.name,
                    status: 'pending'
                }
            ]
        };

        leaderRegistration.teamDetails = updatedTeamDetails;
        await leaderRegistration.save();

        if (existingInvitation) {
            await existingInvitation.update({
                leaderRegistrationId: leaderRegistration.id,
                inviterId: req.user.id,
                inviterName: req.user.name,
                inviterEmail: req.user.email,
                inviteeId: memberUser.id,
                inviteeName: memberUser.name,
                inviteeEmail: memberUser.email,
                teamName: updatedTeamName,
                eventName: event.name,
                status: 'pending',
                respondedAt: null
            });
        } else {
            await TeamInvitation.create({
                eventId,
                leaderRegistrationId: leaderRegistration.id,
                inviterId: req.user.id,
                inviterName: req.user.name,
                inviterEmail: req.user.email,
                inviteeId: memberUser.id,
                inviteeName: memberUser.name,
                inviteeEmail: memberUser.email,
                teamName: updatedTeamName,
                eventName: event.name
            });
        }

        const appBase = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        await sendEmail({
            email: memberUser.email,
            subject: `Team Invitation - ${event.name}`,
            html: buildTeamInviteMail({
                appBase,
                inviterName: req.user.name,
                teamName: updatedTeamName,
                eventName: event.name
            })
        });

        return res.json({
            message: 'Invitation sent successfully',
            teamDetails: updatedTeamDetails
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getMyTeamInvitations = async (req, res) => {
    try {
        const invitations = await TeamInvitation.findAll({
            where: {
                inviteeEmail: normalizeEmail(req.user.email),
                status: 'pending'
            },
            order: [['createdAt', 'DESC']]
        });

        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.respondToTeamInvitation = async (req, res) => {
    try {
        const invitationId = Number(req.params.id);
        const { decision } = req.body;

        if (!invitationId) {
            return res.status(400).json({ message: 'Invalid invitation id' });
        }

        if (!['accept', 'reject'].includes(decision)) {
            return res.status(400).json({ message: 'Invalid invitation decision' });
        }

        const invitation = await TeamInvitation.findByPk(invitationId);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (normalizeEmail(invitation.inviteeEmail) !== normalizeEmail(req.user.email)) {
            return res.status(403).json({ message: 'This invitation does not belong to you' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: 'Invitation already processed' });
        }

        const leaderRegistration = await Registration.findByPk(invitation.leaderRegistrationId, {
            include: [{ model: User, as: 'user', attributes: ['name', 'email', 'college'] }, { model: Event, as: 'event' }]
        });

        if (!leaderRegistration || leaderRegistration.type !== 'team') {
            return res.status(404).json({ message: 'Team registration not found' });
        }

        const currentTeamDetails = leaderRegistration.teamDetails || {};
        const currentMembers = Array.isArray(currentTeamDetails.members) ? currentTeamDetails.members : [];
        const teamMemberIndex = currentMembers.findIndex((member) => normalizeEmail(member?.email) === normalizeEmail(req.user.email));
        const inviteTeamName = invitation.teamName || currentTeamDetails.name || `${leaderRegistration.user?.name || 'Team Lead'} Team`;
        const inviteEventName = invitation.eventName || leaderRegistration.event?.name || 'the event';
        const appBase = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

        if (decision === 'reject') {
            invitation.status = 'rejected';
            invitation.respondedAt = new Date();
            await invitation.save();

            if (teamMemberIndex !== -1) {
                currentMembers.splice(teamMemberIndex, 1);
                leaderRegistration.teamDetails = {
                    ...currentTeamDetails,
                    members: currentMembers
                };
                await leaderRegistration.save();
            }

            await sendEmail({
                email: invitation.inviteeEmail,
                subject: `Team Invitation Declined - ${inviteEventName}`,
                html: buildInvitationRejectedMail({ appBase, teamName: inviteTeamName, eventName: inviteEventName })
            });

            return res.json({ message: 'Invitation rejected' });
        }

        const acceptedMember = {
            email: req.user.email,
            name: req.user.name,
            status: 'accepted'
        };

        if (teamMemberIndex === -1) {
            currentMembers.push(acceptedMember);
        } else {
            currentMembers[teamMemberIndex] = acceptedMember;
        }

        leaderRegistration.teamDetails = {
            ...currentTeamDetails,
            leader: invitation.inviterEmail || leaderRegistration.teamDetails?.leader || leaderRegistration.user?.email,
            leaderName: invitation.inviterName || leaderRegistration.teamDetails?.leaderName || leaderRegistration.user?.name,
            leaderCollege: leaderRegistration.user?.college || leaderRegistration.teamDetails?.leaderCollege,
            name: inviteTeamName,
            members: currentMembers
        };
        await leaderRegistration.save();

        const existingRegistration = await Registration.findOne({
            where: { userId: req.user.id, eventId: invitation.eventId }
        });

        if (existingRegistration) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        } else {
            const registrationPayload = await buildTeamRegistrationPayload({
                user: req.user,
                event: leaderRegistration.event,
                teamDetails: leaderRegistration.teamDetails
            });

            await Registration.create(registrationPayload);
        }

        invitation.status = 'accepted';
        invitation.respondedAt = new Date();
        await invitation.save();

        await sendEmail({
            email: invitation.inviteeEmail,
            subject: `Invitation Accepted - ${inviteEventName}`,
            html: buildInvitationAcceptedMail({ appBase, teamName: inviteTeamName, eventName: inviteEventName })
        });

        return res.json({ message: 'Invitation accepted' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.removeTeamMember = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const { email } = req.body;

        const blockedMessage = assertActiveAccount(req.user);
        if (blockedMessage) {
            return res.status(403).json({ message: blockedMessage });
        }

        if (!eventId) {
            return res.status(400).json({ message: 'Invalid event id' });
        }

        const memberEmail = normalizeEmail(email);
        if (!memberEmail) {
            return res.status(400).json({ message: 'Member email is required' });
        }

        const leaderRegistration = await Registration.findOne({
            where: { userId: req.user.id, eventId },
            include: [{ model: User, as: 'user', attributes: ['name', 'email', 'college'] }, { model: Event, as: 'event', attributes: ['id', 'name', 'maxTeamSize', 'minTeamSize'] }]
        });

        if (!leaderRegistration || leaderRegistration.type !== 'team') {
            return res.status(400).json({ message: 'Team registration not found for this event' });
        }

        const currentTeamDetails = leaderRegistration.teamDetails || {};
        const currentMembers = Array.isArray(currentTeamDetails.members) ? currentTeamDetails.members : [];
        const nextMembers = currentMembers.filter((member) => normalizeEmail(member?.email) !== memberEmail);

        if (nextMembers.length === currentMembers.length) {
            return res.status(404).json({ message: 'Member not found in team' });
        }

        const updatedTeamDetails = {
            ...currentTeamDetails,
            leader: req.user.email,
            leaderName: req.user.name,
            leaderCollege: req.user.college,
            members: nextMembers
        };

        leaderRegistration.teamDetails = updatedTeamDetails;
        await leaderRegistration.save();

        const invitation = await TeamInvitation.findOne({
            where: {
                eventId,
                inviteeEmail: memberEmail,
                inviterEmail: normalizeEmail(req.user.email)
            }
        });

        if (invitation) {
            if (invitation.status === 'accepted') {
                const memberUser = await User.findOne({ where: { email: memberEmail } });
                if (memberUser) {
                    const inviteeRegistration = await Registration.findOne({
                        where: { userId: memberUser.id, eventId }
                    });

                    if (inviteeRegistration) {
                        await inviteeRegistration.destroy();
                    }
                }
            }

            await invitation.destroy();
        }

        return res.json({
            message: 'Member removed successfully',
            teamDetails: updatedTeamDetails
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getEligibleTeamMembers = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        if (!eventId) return res.status(400).json({ message: 'Invalid event id' });

        const event = await Event.findByPk(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (!req.user.college) {
            return res.json([]);
        }

        const takenEmails = await collectTakenEmailsForEvent(eventId);
        const users = await User.findAll({
            where: {
                role: 'participant',
                college: req.user.college
            },
            attributes: ['name', 'email'],
            order: [['name', 'ASC']]
        });

        const selfEmail = normalizeEmail(req.user.email);
        const options = users
            .filter((u) => normalizeEmail(u.email) !== selfEmail)
            .filter((u) => !takenEmails.has(normalizeEmail(u.email)))
            .map((u) => ({
                value: u.email,
                label: `${u.name} (${u.email})`
            }));

        res.json(options);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.findAll({
            where: { userId: req.user.id },
            include: [{ model: Event, as: 'event', required: true }, { model: User, as: 'user' }]
        });

        const ownedTeamEvents = registrations
            .filter((registration) => registration.type === 'team')
            .map((registration) => registration.eventId);

        const teamInvitations = ownedTeamEvents.length > 0
            ? await TeamInvitation.findAll({
                where: {
                    eventId: ownedTeamEvents,
                    inviterEmail: normalizeEmail(req.user.email)
                }
            })
            : [];

        const inviteStatusByEventAndEmail = new Map(
            teamInvitations.map((invitation) => [
                `${invitation.eventId}:${normalizeEmail(invitation.inviteeEmail)}`,
                invitation.status
            ])
        );

        const leaderEmails = registrations
            .map((registration) => normalizeEmail(registration.teamDetails?.leader))
            .filter(Boolean);

        const leaderUsers = leaderEmails.length > 0
            ? await User.findAll({
                where: { email: leaderEmails },
                attributes: ['name', 'email', 'college']
            })
            : [];

        const leaderByEmail = new Map(leaderUsers.map((leader) => [normalizeEmail(leader.email), leader]));

        res.json(registrations.map((registration) => {
            const teamDetails = registration.teamDetails ? { ...registration.teamDetails } : registration.teamDetails;
            const leader = teamDetails?.leader ? leaderByEmail.get(normalizeEmail(teamDetails.leader)) : null;

            if (teamDetails && leader) {
                teamDetails.leaderName = teamDetails.leaderName || leader.name;
                teamDetails.leaderCollege = teamDetails.leaderCollege || leader.college;
            }

            if (teamDetails && Array.isArray(teamDetails.members)) {
                teamDetails.members = teamDetails.members.map((member) => {
                    const inviteStatus = inviteStatusByEventAndEmail.get(`${registration.eventId}:${normalizeEmail(member?.email)}`);
                    if (!inviteStatus) {
                        return member;
                    }

                    return {
                        ...member,
                        status: inviteStatus === 'accepted' ? 'accepted' : inviteStatus === 'rejected' ? 'rejected' : 'pending'
                    };
                });
            }

            return {
                ...registration.toJSON(),
                teamDetails
            };
        }));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAttendance = async (req, res) => {
    try {
        const { status } = req.body;
        const registration = await Registration.findByPk(req.params.id);

        if (registration) {
            registration.status = status;
            await registration.save();
            res.json({ message: 'Attendance marked', status: registration.status });
        } else {
            res.status(404).json({ message: 'Registration not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEventRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.findAll({
            where: { eventId: req.params.eventId },
            include: [{ model: User, as: 'user' }]
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAssignedRegistrations = async (req, res) => {
    try {
        const assignedEventIds = (() => {
            const val = req.user?.assignedEventIds;
            if (Array.isArray(val)) return val.map((v) => Number(v)).filter(Number.isInteger);
            if (typeof val === 'number') return [Number(val)];
            if (typeof val === 'string') {
                try { const p = JSON.parse(val); return Array.isArray(p) ? p.map((v) => Number(v)).filter(Number.isInteger) : []; } catch (e) { return []; }
            }
            return [];
        })();

        if (assignedEventIds.length === 0) return res.json([]);

        const registrations = await Registration.findAll({
            where: { eventId: assignedEventIds },
            include: [{ model: User, as: 'user' }, { model: Event, as: 'event' }]
        });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.findAll({
            include: [{ model: User, as: 'user' }, { model: Event, as: 'event' }],
            order: [[{ model: User, as: 'user' }, 'name', 'ASC']]
        });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserRegistrations = async (req, res) => {
    try {
        const user = await User.findOne({ where: { uuid: req.params.uuid } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const registrations = await Registration.findAll({
            where: { userId: user.id },
            include: [{ model: Event, as: 'event' }, { model: User, as: 'user' }]
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
