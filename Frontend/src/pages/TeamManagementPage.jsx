import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Check, X, Clock, Shield, Search, Edit2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { SearchSelect } from '../components/SearchSelect';
import { registrationAPI, eventAPI } from '../services/api';
import { useToastStore } from '../store/toastStore';
import { useParams } from 'react-router-dom';

export function TeamManagementPage() {
    const { user } = useAuthStore();
    const { slug } = useParams();
    const { showToast } = useToastStore();
    const [isLoading, setIsLoading] = useState(true);
    const [teamData, setTeamData] = useState(null);

    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    const [showAddMember, setShowAddMember] = useState(false);
    const [newMember, setNewMember] = useState(null);
    const [eligibleMembers, setEligibleMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    // Load event and team data on mount
    useEffect(() => {
        const loadTeamData = async () => {
            if (!slug || !user) return;
            setIsLoading(true);
            try {
                // Fetch event by slug
                const { data: eventData } = await eventAPI.getBySlug(slug);

                // Fetch user's registrations
                const { data: registrations } = await registrationAPI.getMy();
                const userReg = registrations?.find(r => r.event?.slug === slug);

                if (!userReg || !userReg.teamDetails) {
                    showToast('Team data not found', 'error');
                    return;
                }

                // Format team data from registration
                const formattedTeamData = {
                    eventName: eventData.name,
                    eventId: eventData.id,
                    teamName: userReg.teamDetails.name || 'Unnamed Team',
                    requiredSize: eventData.maxTeamSize || 4,
                    members: userReg.teamDetails.members || []
                };

                setTeamData(formattedTeamData);
                setTempName(formattedTeamData.teamName);
            } catch (error) {
                console.error('Failed to load team data:', error);
                showToast(error.response?.data?.message || 'Failed to load team data', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadTeamData();
    }, [slug, user]);

    // Load eligible members when opening add member modal
    useEffect(() => {
        if (showAddMember && teamData?.eventId) {
            loadEligibleMembers();
        }
    }, [showAddMember]);

    const loadEligibleMembers = async () => {
        setIsLoadingMembers(true);
        try {
            const { data } = await registrationAPI.getEligibleMembers(teamData.eventId);
            setEligibleMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load eligible members:', error);
            setEligibleMembers([]);
            showToast('Failed to load eligible members', 'error');
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handleRemoveMember = (email) => {
        if (!teamData) return;
        setTeamData({
            ...teamData,
            members: teamData.members.filter(m => m.email !== email)
        });
        showToast('Member removed from team', 'info');
    };

    const handleAddMember = () => {
        if (!newMember || !teamData) return;
        if (teamData.members.some(m => m.email === newMember.value)) {
            showToast('User already in team!', 'warning');
            return;
        }

        // Check team size limit
        if (teamData.members.length >= teamData.requiredSize - 1) {
            showToast(`Team is full (${teamData.requiredSize} members max)`, 'warning');
            return;
        }

        setTeamData({
            ...teamData,
            members: [
                ...teamData.members,
                {
                    email: newMember.value,
                    name: newMember.label.split(' (')[0], // Extract name from "Name (email)" format
                    status: 'pending'
                }
            ]
        });
        showToast(`Invitation sent to ${newMember.label}`, 'success');
        setShowAddMember(false);
        setNewMember(null);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'accepted': return <Check size={14} className="text-green-500" />;
            case 'rejected': return <X size={14} className="text-red-500" />;
            default: return <Clock size={14} className="text-yellow-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sangamam-gold mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading team data...</p>
                </div>
            </div>
        );
    }

    // No team data found
    if (!teamData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto text-sangamam-gold mb-4" />
                    <p className="text-gray-400 mb-4">No team data found for this event</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-sangamam-gold mb-2">
                        <Users size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Team Management</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="sangamam-input text-3xl font-black bg-transparent border-b border-sangamam-gold outline-none py-0"
                                    autoFocus
                                />
                                <button
                                    onClick={() => { setTeamData({ ...teamData, teamName: tempName }); setIsEditingName(false); }}
                                    className="p-2 text-green-500 hover:bg-green-500/10 rounded-full"
                                >
                                    <Check size={20} />
                                </button>
                                <button
                                    onClick={() => { setTempName(teamData.teamName); setIsEditingName(false); }}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-4xl font-black text-white leading-tight">
                                    {teamData.teamName}
                                </h1>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="p-2 text-gray-500 hover:text-sangamam-gold transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </>
                        )}
                    </div>
                    <p className="text-gray-400 mt-2">Managing team for <span className="text-sangamam-gold font-bold">{teamData.eventName}</span></p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-white/5 border border-sangamam-border rounded-xl">
                        <span className="text-xs text-gray-500 block">Current Size</span>
                        <span className="text-lg font-bold text-white">
                            {teamData.members.length + 1} / {teamData.requiredSize}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAddMember(true)}
                        className="sangamam-button flex items-center gap-2 py-3 px-6 font-bold rounded-xl"
                    >
                        <UserPlus size={18} /> Add Member
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team Lead Card */}
                <div className="lg:col-span-1">
                    <div className="sangamam-card p-6 border-sangamam-gold/30 bg-gradient-to-br from-sangamam-gold/5 to-transparent">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-full bg-sangamam-gold flex items-center justify-center text-[#2a130d]">
                                <Shield size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{user?.name || 'Team Leader'}</h3>
                                <p className="text-xs text-sangamam-gold font-bold uppercase tracking-widest">Team Lead</p>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-sangamam-border">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">College</span>
                                <span className="text-white font-medium">{user?.college || 'My College'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Email</span>
                                <span className="text-white font-medium">{user?.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members List */}
                <div className="lg:col-span-2">
                    <div className="sangamam-card p-0 overflow-hidden border-sangamam-border">
                        <div className="p-6 border-b border-sangamam-border bg-white/2">
                            <h3 className="font-bold text-white">Team Members</h3>
                        </div>
                        <div className="divide-y divide-sangamam-border">
                            {teamData.members.map((member) => (
                                <div key={member.email} className="p-4 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-white/5 border border-sangamam-border flex items-center justify-center text-gray-400 font-bold">
                                            {member.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{member.name}</p>
                                            <p className="text-xs text-gray-500">{member.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase flex items-center gap-1.5 ${getStatusColor(member.status)}`}>
                                            {getStatusIcon(member.status)}
                                            {member.status}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveMember(member.email)}
                                            className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove Member"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {teamData.members.length === 0 && (
                                <div className="p-12 text-center">
                                    <Users size={40} className="mx-auto text-gray-600 mb-4 opacity-20" />
                                    <p className="text-gray-500">No members added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="sangamam-card max-w-md w-full p-8 shadow-2xl border border-sangamam-border animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-12 w-12 rounded-xl bg-sangamam-gold/20 flex items-center justify-center text-sangamam-gold">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Add Team Member</h2>
                                <p className="text-sm text-gray-400">Search from {user?.college || 'your college'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-sangamam-gold">Member Search</label>
                                <SearchSelect
                                    options={eligibleMembers.filter(u => !teamData.members.some(m => m.email === u.value))}
                                    multiple={false}
                                    onChange={setNewMember}
                                    placeholder={isLoadingMembers ? 'Loading members...' : 'Add member...'}
                                />
                                <p className="mt-2 text-[11px] text-gray-500 italic">
                                    * Team invitations will be sent to the selected student.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button
                                className="px-6 py-3 rounded-xl border border-sangamam-border text-white font-bold hover:bg-white/5 transition-colors"
                                onClick={() => { setShowAddMember(false); setNewMember(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="sangamam-button py-3 font-bold shadow-[0_0_20px_rgba(216,162,69,0.3)]"
                                onClick={handleAddMember}
                            >
                                Send Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
