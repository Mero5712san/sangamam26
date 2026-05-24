import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, UserPlus, ShieldAlert, CheckCircle, Search, Filter, Snowflake, MoreVertical, Building2, Mail, Phone, Plus, Calendar, X, Trash2 } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { volunteerAPI, eventAPI } from '../services/api';

const mockVolunteers = [
    { id: 1, name: 'Rahul Sharma', email: 'rahul.s@college.edu', college: 'BIT', status: 'active', phone: '+91 98765 43210', assignedEvents: ['Varna Kaaviyam'] },
    { id: 2, name: 'Ananya Iyer', email: 'ananya.i@college.edu', college: 'KCT', status: 'active', phone: '+91 91234 56780', assignedEvents: [] },
    { id: 3, name: 'Vijay Kumar', email: 'vijay.k@college.edu', college: 'PSG', status: 'freezed', phone: '+91 95432 10987', assignedEvents: [] },
    { id: 4, name: 'Meera Patel', email: 'meera.p@college.edu', college: 'SKCET', status: 'active', phone: '+91 99887 76655', assignedEvents: ['Dance Fusion'] },
];

const availableEvents = [
    'Varna Kaaviyam',
    'Dance Fusion',
    'Art Canvas',
    'Musical Harmony',
    'Drama Showcase',
    'Photography Fest'
];

export function VolunteersPage() {
    const { role } = useAuthStore();
    const { showToast } = useToastStore();
    const navigate = useNavigate();
    const { id } = useParams();
    const [volunteers, setVolunteers] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [assigningTo, setAssigningTo] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVolunteer, setNewVolunteer] = useState({
        name: '',
        email: '',
        phone: '',
        rollNo: '',
        department: '',
        year: '1',
        gender: 'Male',
        password: '',
        college: 'BIT'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [volRes, eventRes] = await Promise.all([
                    volunteerAPI.getAll(),
                    eventAPI.getAll()
                ]);
                setVolunteers(volRes.data);
                setAllEvents(eventRes.data);
            } catch (error) {
                showToast('Failed to load data', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Sync modal with URL
    React.useEffect(() => {
        if (id) {
            const volunteer = volunteers.find(v => v.id.toString() === id);
            if (volunteer) {
                setAssigningTo(volunteer);
            }
        } else {
            setAssigningTo(null);
        }
    }, [id, volunteers]);

    if (role !== 'admin') {
        return <div className="p-8 text-center text-gray-500">Only Admins can manage volunteers.</div>;
    }

    const toggleFreeze = (id) => {
        setVolunteers(volunteers.map(v => 
            v.id === id ? { ...v, status: v.status === 'active' ? 'freezed' : 'active' } : v
        ));
        showToast('Volunteer status updated', 'success');
    };

    const assignEvent = (volunteerId, eventName) => {
        setVolunteers(volunteers.map(v => {
            if (v.id === volunteerId) {
                if (v.assignedEvents.includes(eventName)) {
                    showToast('Event already assigned', 'warning');
                    return v;
                }
                return { ...v, assignedEvents: [...v.assignedEvents, eventName] };
            }
            return v;
        }));
        showToast(`Assigned ${eventName} to volunteer`, 'success');
    };

    const removeEvent = (volunteerId, eventName) => {
        setVolunteers(volunteers.map(v => 
            v.id === volunteerId 
                ? { ...v, assignedEvents: v.assignedEvents.filter(e => e !== eventName) } 
                : v
        ));
        showToast('Event assignment removed', 'info');
    };

    const handleAddVolunteer = async (e) => {
        e.preventDefault();
        try {
            const { data } = await volunteerAPI.add(newVolunteer);
            setVolunteers([...volunteers, data]);
            setShowAddModal(false);
            setNewVolunteer({
                name: '', email: '', phone: '', rollNo: '', department: '',
                year: '1', gender: 'Male', password: '', college: 'BIT'
            });
            showToast('Volunteer added successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to add volunteer', 'error');
        }
    };

    const handleAssignEvent = async (volunteerId, eventId) => {
        const volunteer = volunteers.find(v => v._id === volunteerId);
        if (!volunteer) return;

        const currentEvents = volunteer.assignedEvents.map(e => e._id || e);
        if (currentEvents.includes(eventId)) {
            showToast('Event already assigned', 'warning');
            return;
        }

        try {
            const { data } = await volunteerAPI.assign(volunteerId, [...currentEvents, eventId]);
            setVolunteers(volunteers.map(v => v._id === volunteerId ? data : v));
            showToast('Event assigned successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Assignment failed', 'error');
        }
    };

    const filteredVolunteers = volunteers.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             v.college.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Volunteer Squad</h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Empowering the backbone of Sangamam 2024</p>
                </div>
                <button 
                    className="sangamam-button px-6 py-3 flex items-center gap-2 font-bold shadow-lg"
                    onClick={() => setShowAddModal(true)}
                >
                    <UserPlus size={18} /> Add New Volunteer
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Squad</p>
                        <p className="text-2xl font-black text-gray-900">{volunteers.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Now</p>
                        <p className="text-2xl font-black text-gray-900">{volunteers.filter(v => v.status === 'active').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                    <div className="h-12 w-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                        <Snowflake size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Freezed</p>
                        <p className="text-2xl font-black text-gray-900">{volunteers.filter(v => v.status === 'freezed').length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or college..."
                        className="sangamam-input w-full pl-12 pr-4 py-3 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-gray-100">
                    <Filter size={18} className="text-gray-400" />
                    <select 
                        className="bg-transparent text-sm font-bold text-gray-600 focus:outline-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="freezed">Freezed Only</option>
                    </select>
                </div>
            </div>

            {/* Volunteers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVolunteers.map((volunteer) => (
                    <div key={volunteer.id} className={`bg-white rounded-[2.5rem] border transition-all duration-300 p-8 ${volunteer.status === 'freezed' ? 'border-red-100 opacity-75' : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${volunteer.status === 'active' ? 'bg-sangamam-maroon text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {volunteer.name.charAt(0)}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleFreeze(volunteer.id)}
                                    className={`p-2 rounded-xl transition-colors ${volunteer.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                    title={volunteer.status === 'active' ? 'Freeze Account' : 'Unfreeze Account'}
                                >
                                    <Snowflake size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{volunteer.name}</h3>
                                <div className="flex items-center gap-1 mt-1 text-sangamam-maroon">
                                    <Building2 size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{volunteer.college}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 space-y-2">
                                <div className="flex items-center gap-3 text-gray-500">
                                    <Mail size={14} />
                                    <span className="text-xs font-medium">{volunteer.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500">
                                    <Phone size={14} />
                                    <span className="text-xs font-medium">{volunteer.phone}</span>
                                </div>
                            </div>



                            <div className="pt-4 mt-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assignments ({volunteer.assignedEvents.length})</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {volunteer.assignedEvents.length > 0 ? (
                                        volunteer.assignedEvents.map(event => (
                                            <span key={event} className="inline-flex items-center gap-1.5 px-2 py-1 bg-sangamam-maroon/5 text-sangamam-maroon text-[10px] font-bold rounded-md border border-sangamam-maroon/10">
                                                <Calendar size={10} /> {event}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-gray-400 italic">No events assigned</span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => navigate(`/volunteers/assign-job/${volunteer.id}`)}
                                    className="w-full py-2.5 bg-sangamam-gold/10 text-sangamam-gold border border-sangamam-gold/20 rounded-xl text-xs font-bold hover:bg-sangamam-gold hover:text-[#2a130d] transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Assign Events
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Assignment Modal */}
            {assigningTo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-sangamam-maroon text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black">Assign Events</h2>
                                <p className="text-sangamam-gold/80 text-xs font-bold uppercase tracking-widest mt-1">Volunteer: {assigningTo.name}</p>
                            </div>
                            <button onClick={() => navigate('/volunteers')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Current Assignments</h3>
                                <div className="flex flex-wrap gap-2">
                                    {assigningTo.assignedEvents.length > 0 ? (
                                        assigningTo.assignedEvents.map(event => (
                                            <div key={event} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl group">
                                                <span className="text-xs font-bold text-gray-700">{event}</span>
                                                <button 
                                                    onClick={() => removeEvent(assigningTo.id, event)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No events assigned yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Available Events</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {availableEvents.map(event => (
                                        <button
                                            key={event}
                                            onClick={() => assignEvent(assigningTo.id, event)}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                                                assigningTo.assignedEvents.includes(event)
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 opacity-50 cursor-default'
                                                : 'bg-white border-gray-100 text-gray-700 hover:border-sangamam-gold hover:bg-sangamam-gold/5'
                                            }`}
                                        >
                                            <span className="text-xs font-bold">{event}</span>
                                            {!assigningTo.assignedEvents.includes(event) && <Plus size={14} className="text-sangamam-gold" />}
                                            {assigningTo.assignedEvents.includes(event) && <CheckCircle size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button 
                                onClick={() => navigate('/volunteers')}
                                className="px-8 py-3 bg-[#2a130d] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Volunteer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-[#2a130d] text-white flex justify-between items-center border-b border-white/10">
                            <div>
                                <h2 className="text-2xl font-black">Register New Volunteer</h2>
                                <p className="text-sangamam-gold/80 text-[10px] font-bold uppercase tracking-widest mt-1">Administrative Addition</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddVolunteer} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                                    <input 
                                        type="text" required
                                        className="sangamam-input w-full px-5 py-4 text-sm bg-gray-50"
                                        placeholder="John Doe"
                                        value={newVolunteer.name}
                                        onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                    <input 
                                        type="email" required
                                        className="sangamam-input w-full px-5 py-4 text-sm bg-gray-50"
                                        placeholder="john@college.edu"
                                        value={newVolunteer.email}
                                        onChange={(e) => setNewVolunteer({...newVolunteer, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                                    <input 
                                        type="tel" required
                                        className="sangamam-input w-full px-5 py-4 text-sm bg-gray-50"
                                        placeholder="+91 XXXXX XXXXX"
                                        value={newVolunteer.phone}
                                        onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Roll Number</label>
                                    <input 
                                        type="text" required
                                        className="sangamam-input w-full px-5 py-4 text-sm bg-gray-50"
                                        placeholder="21BCS001"
                                        value={newVolunteer.rollNo}
                                        onChange={(e) => setNewVolunteer({...newVolunteer, rollNo: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</label>
                                    <input 
                                        type="text" required
                                        className="sangamam-input w-full px-5 py-4 text-sm bg-gray-50"
                                        placeholder="Computer Science"
                                        value={newVolunteer.department}
                                        onChange={(e) => setNewVolunteer({...newVolunteer, department: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Academic Year</label>
                                    <select 
                                        className="sangamam-input w-full px-5 py-4 text-sm bg-gray-50 appearance-none"
                                        value={newVolunteer.year}
                                        onChange={(e) => setNewVolunteer({...newVolunteer, year: e.target.value})}
                                    >
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</label>
                                    <div className="flex gap-4 h-[52px] items-center">
                                        {['Male', 'Female'].map(g => (
                                            <label key={g} className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-600">
                                                <input 
                                                    type="radio" name="modal-gender" value={g}
                                                    checked={newVolunteer.gender === g}
                                                    onChange={(e) => setNewVolunteer({...newVolunteer, gender: e.target.value})}
                                                    className="accent-sangamam-maroon"
                                                />
                                                {g}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Password</label>
                                    <input 
                                        type="password" required
                                        className="sangamam-input w-full px-5 py-4 text-sm bg-gray-50"
                                        placeholder="••••••••"
                                        value={newVolunteer.password}
                                        onChange={(e) => setNewVolunteer({...newVolunteer, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-100">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-8 py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    Discard
                                </button>
                                <button 
                                    type="submit"
                                    className="px-8 py-4 bg-[#2a130d] text-white font-black rounded-2xl hover:opacity-90 transition-opacity shadow-xl"
                                >
                                    Register & Assign Jobs
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
