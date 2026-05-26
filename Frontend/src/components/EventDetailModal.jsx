import React, { useState, useEffect } from 'react';
import { X, Clock, Users, User, Phone, Mail, Snowflake } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { SearchSelect } from './SearchSelect';
import { registrationAPI } from '../services/api';
import { canManageEvent } from '../utils/eventAccess';

export function EventDetailModal({ event, onClose, onRegister, myEvents = [] }) {
    const { role, user } = useAuthStore();
    const navigate = useNavigate();
    const [isRegisteringTeam, setIsRegisteringTeam] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [regType, setRegType] = useState(null); // 'solo' or 'team'
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [eligibleMembers, setEligibleMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const participationMode = event?.participationType || event?.registrationType || 'solo';

    const coordinators = [
        ...(Array.isArray(event?.incharges) ? event.incharges : []),
        ...(Array.isArray(event?.coordinators) ? event.coordinators : []),
        ...(event?.incharge ? [event.incharge] : [])
    ].filter(Boolean);

    const normalizeText = (value) => String(value || '').trim().toLowerCase();

    const sameSlotEvents = myEvents.filter((registeredEvent) => (
        normalizeText(registeredEvent.date) === normalizeText(event.date)
        && normalizeText(registeredEvent.time) === normalizeText(event.time)
    ));

    const sameSlotCount = sameSlotEvents.length;
    const isSlotFull = sameSlotCount >= 2;

    useEffect(() => {
        const loadEligibleMembers = async () => {
            if ((participationMode === 'team' || isRegisteringTeam) && event?.id) {
                setIsLoadingMembers(true);
                try {
                    const { data } = await registrationAPI.getEligibleMembers(event.id);
                    setEligibleMembers(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error('Failed to load eligible members:', error);
                    setEligibleMembers([]);
                } finally {
                    setIsLoadingMembers(false);
                }
            }
        };
        loadEligibleMembers();
    }, [participationMode, isRegisteringTeam, event?.id]);

    const handleRegisterClick = () => {
        if (isSlotFull) {
            return;
        }
        setShowConfirmModal(true);
    };

    const hasClash = sameSlotCount > 0;

    const confirmRegistration = () => {
        setShowConfirmModal(false);
        onRegister(event, isRegisteringTeam);
    };

    const handleAddTeamMember = () => {
        setTeamMembers([...teamMembers, '']);
    };

    const handleTeamMemberChange = (index, value) => {
        const updated = [...teamMembers];
        updated[index] = value;
        setTeamMembers(updated);
    };

    // Find event status if in myEvents
    const myEvent = myEvents.find(e => e.id === event.id);
    const status = myEvent?.status;

    const canManageThisEvent = canManageEvent(user, event);
    const isStaffRole = role === 'admin' || role === 'incharge' || role === 'volunteer';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120705]/80 p-4 backdrop-blur-sm">
            <div className="sangamam-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between border-b border-sangamam-border p-6 bg-[rgba(42,19,13,0.94)]">
                    <h2 className="text-2xl font-bold text-white">Event Details</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full border border-sangamam-border bg-white/5 px-3 py-1 text-gray-400 hover:text-sangamam-gold"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    {/* Left and Right Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Left: Event Poster */}
                        <div>
                            <div className="bg-[rgba(255,255,255,0.04)] h-auto rounded-2xl flex items-center justify-center border border-sangamam-border">
                                {event.image ? (
                                    <img
                                        src={event.image}
                                        alt={event.name}
                                        className="h-full w-full rounded-2xl object-cover"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <span className="text-6xl">{event.icon || '📅'}</span>
                                        <p className="text-gray-400 mt-4">Event Poster</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Event Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-xl font-bold text-white">{event.name}</h1>
                            </div>

                            <p className="text-gray-600 italic">{event.tagline}</p>

                            <div className="space-y-3 text-gray-700">
                                <div className="flex items-center gap-3">
                                    <Clock size={20} className="text-sangamam-gold" />
                                    <span>{event.date} • {event.time}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users size={20} className="text-sangamam-gold" />
                                    <span>{event.participants} participants registered</span>
                                </div>
                            </div>

                            {/* Horizontal Line */}
                            <div className="border-t border-sangamam-border pt-6 mb-6">
                                <h4 className="text-sm font-bold text-white uppercase mb-4">Event Coordinators</h4>
                                {coordinators.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {coordinators.map((inc, idx) => (
                                            <div key={idx} className="bg-[rgba(255,255,255,0.04)] p-3 rounded-xl border border-sangamam-border">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-sangamam-gold rounded-full flex shrink-0 items-center justify-center text-white font-bold shadow-sm">
                                                        {(inc?.name || '?').charAt(0)}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-semibold text-sm text-white truncate">{inc?.name || 'Coordinator'}</p>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                                                            <Phone size={12} className="shrink-0" />
                                                            <span className="truncate">{inc?.phone || 'TBA'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                                                            <Mail size={12} className="shrink-0" />
                                                            <span className="truncate">{inc?.email || 'TBA'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Coordinator details will be announced soon.</p>
                                )}
                            </div>

                            {/* Registered Team Status View */}
                            {myEvent?.team && (
                                <div className="mb-8 p-6 bg-sangamam-gold/5 rounded-3xl border border-sangamam-gold/20">
                                    <h4 className="text-xs font-bold text-sangamam-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Users size={16} /> Team Status: {myEvent.team.name}
                                    </h4>
                                    <div className="space-y-4">
                                        {myEvent.team.members.map((member, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-black/20 p-3 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-sangamam-gold/20 flex items-center justify-center text-xs font-bold text-sangamam-gold">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{member.name}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">{member.role}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-sm ${member.status === 'Accepted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Admin Tools: Freeze Toggle */}
                            {role === 'admin' && (
                                <div className="mb-8 p-6 bg-red-500/5 rounded-3xl border border-red-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <h4 className="text-xs font-bold text-red-400 flex items-center gap-2 uppercase tracking-widest">
                                            <Snowflake size={14} /> Admin: Freeze Event
                                        </h4>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Frozen events are hidden from students</p>
                                    </div>
                                    <button
                                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${event.isFrozen
                                            ? 'bg-red-500 text-white shadow-lg'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {event.isFrozen ? 'Unfreeze' : 'Freeze'}
                                    </button>
                                </div>
                            )}

                            {/* Actions */}
                            {canManageThisEvent ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate(`/event/${event.slug}/manage`)}
                                        className="w-full py-3 rounded-xl border-2 border-sangamam-gold bg-sangamam-gold/10 text-sangamam-gold font-bold hover:bg-sangamam-gold hover:text-[#2a130d] transition-colors shadow-sm"
                                    >
                                        Manage Members
                                    </button>
                                    <button
                                        onClick={() => navigate(`/event/${event.slug}/edit`)}
                                        className="w-full py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
                                    >
                                        Edit Event Details
                                    </button>
                                    <div className="pt-2 text-center">
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic">
                                            Admin / Staff cannot register for events
                                        </p>
                                    </div>
                                </div>
                            ) : isStaffRole ? (
                                <div className="space-y-3">

                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                                        Staff accounts cannot register for events.
                                    </div>
                                </div>
                            ) : (
                                <>

                                    {status === 'registered' && (
                                        <button className="bg-green-600 w-full py-3 font-bold text-white rounded cursor-default" disabled>
                                            Registered
                                        </button>
                                    )}
                                    {status === 'participating' && (
                                        <button className="bg-blue-600 w-full py-3 font-bold text-white rounded cursor-default" disabled>
                                            Participating
                                        </button>
                                    )}
                                    {status === 'completed' && (
                                        <button className="bg-purple-600 w-full py-3 font-bold text-white rounded cursor-default" disabled>
                                            Completed
                                        </button>
                                    )}
                                    {status === 'absent' && (
                                        <button className="bg-red-600 w-full py-3 font-bold text-white rounded cursor-default" disabled>
                                            Absent
                                        </button>
                                    )}
                                    {!status && (
                                        <div className="space-y-4">
                                            {/* Participation Type Selection if 'Both' */}
                                            {participationMode === 'both' && !regType && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => setRegType('solo')}
                                                        className="py-3 rounded-xl border border-sangamam-gold text-sangamam-gold font-bold hover:bg-sangamam-gold/10 transition-all"
                                                    >
                                                        Solo Participation
                                                    </button>
                                                    <button
                                                        onClick={() => { setRegType('team'); setIsRegisteringTeam(true); }}
                                                        className="py-3 rounded-xl border border-sangamam-gold text-sangamam-gold font-bold hover:bg-sangamam-gold/10 transition-all"
                                                    >
                                                        Team Participation
                                                    </button>
                                                </div>
                                            )}

                                            {(participationMode !== 'both' || regType) && (
                                                <>
                                                    {/* Team Registration Form */}                                                 {(participationMode === 'team' || regType === 'team') && (
                                                        <div className="space-y-4 animate-in fade-in duration-300">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-sangamam-gold uppercase">Team Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={teamName}
                                                                    onChange={(e) => setTeamName(e.target.value)}
                                                                    placeholder="Enter your team name"
                                                                    className="sangamam-input w-full px-4 py-3 text-sm"
                                                                />
                                                            </div>

                                                            {/* Team Lead Info */}
                                                            <div className="p-3 bg-white/5 border border-sangamam-border rounded-lg">
                                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Team Lead</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-full bg-sangamam-gold/20 flex items-center justify-center text-sangamam-gold text-xs font-bold">
                                                                        {user?.name?.charAt(0) || 'U'}
                                                                    </div>
                                                                    <div className="overflow-hidden">
                                                                        <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                                                                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <label className="text-xs font-bold text-sangamam-gold uppercase">Select Team Members</label>
                                                                </div>
                                                                <SearchSelect
                                                                    options={eligibleMembers}
                                                                    multiple={true}
                                                                    maxItems={(event.maxTeamSize || 4) - 1}
                                                                    onChange={setSelectedMembers}
                                                                    placeholder={isLoadingMembers ? 'Loading eligible members...' : 'Search by name or email...'}
                                                                />
                                                                <p className="text-[10px] text-gray-500 italic">
                                                                    * You need to select {(event.minTeamSize || 2) - 1} to {(event.maxTeamSize || 4) - 1} more members.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-3">
                                                        {regType && (
                                                            <button
                                                                onClick={() => { setRegType(null); setIsRegisteringTeam(false); }}
                                                                className="px-4 rounded-xl border border-white/10 text-white"
                                                            >
                                                                Back
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={handleRegisterClick}
                                                            disabled={isSlotFull}
                                                            className={`flex-1 py-3 font-bold rounded-xl transition-all ${isSlotFull
                                                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                                                : 'sangamam-button'
                                                                }`}
                                                        >
                                                            {isSlotFull ? `Max Events Reached (${sameSlotCount}/2 at this time)` : (regType === 'team' || participationMode === 'team' ? 'Register Team' : 'Register Now')}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="border-t border-sangamam-border pt-8">
                        <h4 className="text-xl font-bold text-white mb-6">Event Instructions</h4>
                        <ol className="space-y-3 text-gray-700">
                            {event.instructions.map((instruction, index) => (
                                <li key={index} className="flex gap-4">
                                    <span className="font-bold text-sangamam-gold min-w-fit">{index + 1}.</span>
                                    <span>{instruction}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Registration Type Selection removed for new logic */}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#2a130d] border border-sangamam-border w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                        <div className="mx-auto w-16 h-16 bg-sangamam-gold/10 rounded-full flex items-center justify-center mb-4">
                            <Clock className="text-sangamam-gold" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {isSlotFull ? 'Schedule Limit Reached!' : hasClash ? 'Shared Time Slot' : 'Confirm Registration'}
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            {isSlotFull ? (
                                <>
                                    You already have <span className="text-sangamam-gold font-bold">2 events</span> scheduled at <span className="text-sangamam-gold font-bold">{event.time}</span> on <span className="text-sangamam-gold font-bold">{event.date}</span>.
                                    <span className="block mt-2 text-white font-semibold italic">You can register for at most 2 events in the same time slot.</span>
                                </>
                            ) : hasClash ? (
                                <>
                                    You already have <span className="text-sangamam-gold font-bold">{sameSlotCount} event{sameSlotCount > 1 ? 's' : ''}</span> scheduled at <span className="text-sangamam-gold font-bold">{event.time}</span> on <span className="text-sangamam-gold font-bold">{event.date}</span>.
                                    <span className="block mt-2 text-white font-semibold italic">You can still register for one more event at this same time.</span>
                                </>
                            ) : (
                                <>
                                    Are you sure you want to register for <span className="text-sangamam-gold font-bold">{event.name}</span>?
                                    This action will be shared with the event coordinators.
                                </>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={isSlotFull ? () => setShowConfirmModal(false) : confirmRegistration}
                                className="flex-1 py-3 rounded-xl bg-sangamam-gold text-white font-bold hover:bg-sangamam-maroon transition-all shadow-lg"
                            >
                                {isSlotFull ? 'Close' : hasClash ? 'Register Anyway' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
