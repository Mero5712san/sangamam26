import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { eventAPI } from '../services/api';
import { canManageEvent } from '../utils/eventAccess';

export function EditEventPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToastStore();
    const { user } = useAuthStore();
    const isCreate = slug === 'new';
    const [isAllowed, setIsAllowed] = useState(isCreate ? true : null);

    const [eventData, setEventData] = useState({
        name: '',
        subtitle: '',
        tagline: '',
        description: '',
        date: '',
        time: '',
        audienceType: 'external',
        registrationType: 'individual',
        participationType: 'solo',
        minTeamSize: 2,
        maxTeamSize: 4,
        maxSoloRegistrations: 100,
        maxTeamRegistrations: 20,
        incharges: [
            { name: '', phone: '', email: '' }
        ],
        instructions: [
            '',
        ]
    });

    useEffect(() => {
        if (!isCreate) {
            const fetchEvent = async () => {
                try {
                    const { data } = await eventAPI.getBySlug(slug);
                    setIsAllowed(user?.role === 'admin' || canManageEvent(user, data));
                    setEventData({
                        ...data,
                        audienceType: data.audienceType || 'external',
                        participationType: data.participationType || data.registrationType || 'solo',
                        incharges: data.incharges || data.coordinators || [{ name: '', phone: '', email: '' }],
                        instructions: data.instructions || ['']
                    });
                } catch (error) {
                    showToast('Failed to load event details', 'error');
                }
            };
            fetchEvent();
        }
    }, [isCreate, slug, user]);

    if (isAllowed === false) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-white"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Events</span>
                </button>
                <div className="sangamam-card p-8 text-center">
                    <h1 className="text-2xl font-bold text-white">You do not have access to edit this event.</h1>
                    <p className="mt-2 text-gray-500">Only the mapped incharge or an admin can edit it.</p>
                </div>
            </div>
        );
    }

    const handleInstructionChange = (index, value) => {
        const newInst = [...eventData.instructions];
        newInst[index] = value;
        setEventData({ ...eventData, instructions: newInst });
    };

    const addInstruction = () => {
        setEventData({ ...eventData, instructions: [...eventData.instructions, ''] });
    };

    const removeInstruction = (index) => {
        const newInst = eventData.instructions.filter((_, i) => i !== index);
        setEventData({ ...eventData, instructions: newInst });
    };

    const handleInchargeChange = (index, field, value) => {
        const newIncharges = [...eventData.incharges];
        newIncharges[index][field] = value;
        setEventData({ ...eventData, incharges: newIncharges });
    };

    const addIncharge = () => {
        setEventData({ ...eventData, incharges: [...eventData.incharges, { name: '', phone: '', email: '' }] });
    };

    const removeIncharge = (index) => {
        const newIncharges = eventData.incharges.filter((_, i) => i !== index);
        setEventData({ ...eventData, incharges: newIncharges });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const finalData = {
                ...eventData,
                registrationType: eventData.participationType,
                coordinators: eventData.incharges,
                slug: eventData.slug || eventData.name.toLowerCase().replace(/ /g, '-')
            };

            if (isCreate) {
                await eventAPI.create(finalData);
                showToast('Event created successfully!', 'success');
            } else {
                await eventAPI.update(slug, finalData);
                showToast('Event details updated successfully!', 'success');
            }
            navigate('/events');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save event', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-white"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Events</span>
                </button>
            </div>

            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sangamam-gold">In-Charge Tools</p>
                <h1 className="mt-2 text-4xl font-bold text-white">{isCreate ? 'Create New Event' : 'Edit Event Details'}</h1>
            </div>

            <div className="sangamam-card p-8 max-w-4xl">
                <form className="space-y-8">
                    {/* Basic Details */}
                    <div>
                        <h3 className="text-xl font-bold text-white border-b border-sangamam-border pb-2 mb-4">Basic Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm text-gray-600 font-bold mb-2">Event Name</label>
                                <input
                                    type="text"
                                    value={eventData.name}
                                    onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 font-bold mb-2">Subtitle</label>
                                <input
                                    type="text"
                                    value={eventData.subtitle}
                                    onChange={(e) => setEventData({ ...eventData, subtitle: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-600 font-bold mb-2">Tagline</label>
                            <input
                                type="text"
                                value={eventData.tagline}
                                onChange={(e) => setEventData({ ...eventData, tagline: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 font-bold mb-2">Description</label>
                            <textarea
                                value={eventData.description}
                                rows={3}
                                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* Schedule & Registration */}
                    <div>
                        <h3 className="text-xl font-bold text-white border-b border-sangamam-border pb-2 mb-4">Schedule & Registration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm text-gray-600 font-bold mb-2">Date</label>
                                <input
                                    type="date"
                                    value={eventData.date}
                                    onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 font-bold mb-2">Time</label>
                                <input
                                    type="time"
                                    value={eventData.time}
                                    onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 font-bold mb-2">Audience</label>
                                <select
                                    value={eventData.audienceType}
                                    onChange={(e) => setEventData({ ...eventData, audienceType: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                >
                                    <option value="external">External Participants</option>
                                    <option value="internal">Internal Participants</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 font-bold mb-2">Participation Mode</label>
                                <select
                                    value={eventData.participationType}
                                    onChange={(e) => setEventData({ ...eventData, participationType: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                >
                                    <option value="solo">Solo Only</option>
                                    <option value="team">Team Only</option>
                                    <option value="both">Both (Solo & Team)</option>
                                </select>
                            </div>
                        </div>

                        {(eventData.participationType === 'team' || eventData.participationType === 'both') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-sm text-gray-600 font-bold mb-2">Min Team Size</label>
                                    <input
                                        type="number"
                                        value={eventData.minTeamSize}
                                        onChange={(e) => setEventData({ ...eventData, minTeamSize: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 font-bold mb-2">Max Team Size</label>
                                    <input
                                        type="number"
                                        value={eventData.maxTeamSize}
                                        onChange={(e) => setEventData({ ...eventData, maxTeamSize: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                    />
                                </div>
                            </div>
                        )}

                        {(eventData.participationType === 'solo' || eventData.participationType === 'both') && (
                            <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm text-gray-600 font-bold mb-2">Individual Registration Limit (Solo)</label>
                                <input
                                    type="number"
                                    value={eventData.maxSoloRegistrations}
                                    onChange={(e) => setEventData({ ...eventData, maxSoloRegistrations: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 italic">Maximum number of individual participants allowed.</p>
                            </div>
                        )}

                        {(eventData.participationType === 'team' || eventData.participationType === 'both') && (
                            <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm text-gray-600 font-bold mb-2">Team Registration Limit (Number of Teams)</label>
                                <input
                                    type="number"
                                    value={eventData.maxTeamRegistrations}
                                    onChange={(e) => setEventData({ ...eventData, maxTeamRegistrations: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 italic">Maximum number of teams allowed to participate.</p>
                            </div>
                        )}
                    </div>

                    {/* Event Coordinators */}
                    <div>
                        <div className="flex justify-between items-center border-b border-sangamam-border pb-2 mb-4">
                            <h3 className="text-xl font-bold text-white">Event Coordinators</h3>
                            <button type="button" onClick={addIncharge} className="text-sangamam-gold hover:text-white flex items-center gap-1 text-sm font-bold">
                                <Plus size={16} /> Add Coordinator
                            </button>
                        </div>
                        <div className="space-y-4">
                            {eventData.incharges.map((inc, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs text-gray-500 font-bold mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={inc.name}
                                            onChange={(e) => handleInchargeChange(index, 'name', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded focus:outline-none focus:border-sangamam-gold"
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs text-gray-500 font-bold mb-1">Phone</label>
                                        <input
                                            type="text"
                                            value={inc.phone}
                                            onChange={(e) => handleInchargeChange(index, 'phone', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded focus:outline-none focus:border-sangamam-gold"
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs text-gray-500 font-bold mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={inc.email}
                                            onChange={(e) => handleInchargeChange(index, 'email', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded focus:outline-none focus:border-sangamam-gold"
                                        />
                                    </div>
                                    {eventData.incharges.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeIncharge(index)}
                                            className="absolute top-2 right-2 md:static md:mt-5 p-1.5 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full md:rounded transition-colors"
                                            title="Remove Coordinator"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div>
                        <div className="flex justify-between items-center border-b border-sangamam-border pb-2 mb-4">
                            <h3 className="text-xl font-bold text-white">Instructions</h3>
                            <button type="button" onClick={addInstruction} className="text-sangamam-gold hover:text-white flex items-center gap-1 text-sm font-bold">
                                <Plus size={16} /> Add Instruction
                            </button>
                        </div>
                        <div className="space-y-3">
                            {eventData.instructions.map((inst, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="flex items-center justify-center bg-gray-100 text-gray-400 font-bold w-8 rounded text-sm">
                                        {index + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={inst}
                                        onChange={(e) => handleInstructionChange(index, e.target.value)}
                                        className="flex-1 px-4 py-2 bg-gray-50 border border-sangamam-border rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-sangamam-gold"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeInstruction(index)}
                                        className="p-2 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-sangamam-border">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-8 py-3 bg-white text-[#2a130d] font-bold rounded-xl shadow hover:bg-gray-100 transition-colors"
                        >
                            {isCreate ? 'Create Event' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 border border-sangamam-border text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
