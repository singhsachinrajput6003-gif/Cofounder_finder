'use client';
import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, MapPin, Check, Clock, X, ChevronRight,
    Rocket, Users, ShieldCheck, Filter, Building2,
    BadgeCheck, AlertCircle, Eye, Plus, Briefcase,
    Linkedin, Link as LinkIcon, Mail, MessageSquare, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import PostIdeaModal from '@/components/PostIdeaModal';
import { calculateCompatibility } from '@/lib/compatibility';

/* ─── Connect button ─── */
const ConnectButton = ({ userId, requestMap, onSend }) => {
    const s = requestMap[userId];
    if (s === 'accepted') return <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-xl text-xs font-bold"><Check size={12} /> Connected</span>;
    if (s === 'pending')  return <span className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-xl text-xs font-bold"><Clock size={12} /> Pending</span>;
    if (s === 'rejected') return <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold"><X size={12} /> Declined</span>;
    return (
        <button onClick={(e) => { e.stopPropagation(); onSend(userId); }} className="p-2 bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/30 rounded-xl text-indigo-400 transition-all flex items-center gap-1.5 font-bold text-xs">
            Connect <ChevronRight size={13} />
        </button>
    );
};

/* ─── Checkbox filter ─── */
const CheckFilter = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer group">
        <div onClick={onChange} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-white/20 bg-white/5 group-hover:border-indigo-500/50'}`}>
            {checked && <Check size={12} className="text-white" />}
        </div>
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </label>
);

export default function AdminDashboard() {
    const displayRole = (r, fallback = 'User') => {
        if (!r) return fallback;
        if (/job seeker/i.test(r) || /seeker/i.test(r)) return 'User';
        return r;
    };
    const { user: currentUser } = useAuth();
    const [tab, setTab] = useState('seekers');
    const [myProfile, setMyProfile] = useState(null); // fresh profile with skills/lookingFor
    const [seekers, setSeekers] = useState([]);
    const [ideas, setIdeas] = useState([]);
    const [pendingIds, setPendingIds] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [requestMap, setRequestMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [selectedIndustries, setSelectedIndustries] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showRecommended, setShowRecommended] = useState(false);
    const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [reviewLoading, setReviewLoading] = useState({});

    // Profile modal state
    const [selectedUser, setSelectedUser] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [seekersRes, ideasRes, sentRes, pendingRes, feedbackRes, profileRes] = await Promise.all([
                    api.get('/users/seekers'),
                    api.get('/ideas'),
                    api.get('/requests/sent'),
                    api.get('/users/pending-ids'),
                    api.get('/feedback').catch(() => ({ data: [] })),
                    api.get('/users/profile'),  // fresh skills/lookingFor data
                ]);
                setSeekers(seekersRes.data);
                setIdeas(ideasRes.data);
                setPendingIds(pendingRes.data);
                setFeedbacks(feedbackRes.data);
                setMyProfile(profileRes.data);
                const map = {};
                for (const r of sentRes.data) map[r.receiverId?.toString()] = r.status;
                setRequestMap(map);
            } catch {
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const sendRequest = async (receiverId) => {
        if (!receiverId || receiverId === currentUser?.id || requestMap[receiverId]) return;

        const seeker = seekers.find(s => s._id === receiverId);
        const seekerSkills = seeker?.skills || [];

        // Collect all skills admin is looking for:
        // 1. From posted ideas (lookingFor field)
        // 2. Fallback: from admin's own profile lookingFor
        const ideaSkills = [...new Set(ideas.flatMap(id => id.lookingFor || []))];
        const profileSkills = myProfile?.lookingFor || [];
        const adminIdeaSkills = ideaSkills.length > 0 ? ideaSkills : profileSkills;

        if (seekerSkills.length === 0) {
            toast.error("The seeker has not added any skills yet, so the request cannot be sent.", {
                icon: '⚠️',
                duration: 4000
            });
            return;
        }

        if (adminIdeaSkills.length > 0) {
            const compScore = calculateCompatibility(seekerSkills, adminIdeaSkills);
            if (compScore === 0) {
                toast.error("Skills did not match! This seeker's skills do not match your requirements", {
                    icon: '⚠️',
                    duration: 5000
                });
                return;
            }
        } else {
            // Admin has no ideas AND no lookingFor in profile — can't match
            toast.error("I am looking for co-founders/core team members with the following skills to build the Minimum Viable Product ", {
                icon: '💡',
                duration: 5000
            });
            return;
        }
        
        setRequestMap(prev => ({ ...prev, [receiverId]: 'pending' }));
        try {
            await api.post('/requests/send', { receiverId, message: "Hi! I'd love to connect and discuss an opportunity." });
            toast.success('Request sent!');
        } catch (err) {
            setRequestMap(prev => { const u = { ...prev }; delete u[receiverId]; return u; });
            toast.error(err.response?.data?.error || 'Failed');
        }
    };

    // Open full profile modal (also logs a profile view)
    const openProfile = async (userId) => {
        setProfileLoading(true);
        try {
            const { data } = await api.get(`/users/${userId}`);
            setSelectedUser(data);
        } catch { toast.error('Failed to load profile'); }
        finally { setProfileLoading(false); }
    };

    // Approve/reject ID card
    const reviewId = async (userId, status) => {
        setReviewLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await api.post(`/users/review-id/${userId}`, { status });
            // Update in pendingIds list
            setPendingIds(prev => prev.filter(u => u._id !== userId));
            // Update in seekers list
            setSeekers(prev => prev.map(u =>
                u._id === userId ? { ...u, idCard: { ...u.idCard, status } } : u
            ));
            // Update in selected user modal
            if (selectedUser?._id === userId) {
                setSelectedUser(prev => ({ ...prev, idCard: { ...prev.idCard, status } }));
            }
            toast.success(status === 'approved' ? '✅ ID Approved!' : '❌ ID Rejected');
        } catch {
            toast.error('Failed to review ID');
        } finally {
            setReviewLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const allSkills = useMemo(() => {
        const s = new Set();
        seekers.forEach(u => u.skills?.forEach(sk => s.add(sk)));
        return [...s].sort();
    }, [seekers]);

    const allIndustries = useMemo(() => [...new Set(ideas.map(i => i.industry).filter(Boolean))].sort(), [ideas]);

    const filteredSeekers = seekers.filter(u => {
        const nameMatch = `${u.firstName} ${u.lastName} ${u.role}`.toLowerCase().includes(search.toLowerCase());
        const skillMatch = selectedSkills.length === 0 || selectedSkills.some(sk => u.skills?.includes(sk));
        
        const ideaSkills = [...new Set(ideas.flatMap(i => i.lookingFor || []))].map(s => s.toLowerCase());
        const profileSkills = (myProfile?.lookingFor || []).map(s => s.toLowerCase());
        const adminIdeaSkills = ideaSkills.length > 0 ? ideaSkills : profileSkills;
        const recomMatch = !showRecommended || (u.skills?.some(sk => adminIdeaSkills.includes(sk.toLowerCase())));

        return nameMatch && skillMatch && recomMatch;
    });

    const filteredIdeas = ideas.filter(i => {
        const nameMatch = `${i.title} ${i.description}`.toLowerCase().includes(search.toLowerCase());
        const indMatch = selectedIndustries.length === 0 || selectedIndustries.includes(i.industry);
        return nameMatch && indMatch;
    });

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 pb-20">

            {/* Header */}
            <header>
                <div className="flex items-center gap-2 mb-1">
                    <Building2 size={16} className="text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Company Owner · Admin View</span>
                </div>
                <h1 className="text-4xl font-extrabold mb-6">Admin <span className="gradient-text">Hub</span></h1>
                <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit flex-wrap">
                    {[
                        { id: 'seekers', label: 'Users', icon: Users, count: seekers.length },
                        { id: 'ideas', label: 'My Ideas', icon: Rocket, count: ideas.length },
                        { id: 'approvals', label: 'ID Approvals', icon: ShieldCheck, count: pendingIds.length, alert: pendingIds.length > 0 },
                        { id: 'feedback', label: 'User Feedback', icon: MessageSquare, count: feedbacks.length },
                    ].map(t => (
                        <button key={t.id}
                            onClick={() => { setTab(t.id); setSearch(''); setSelectedSkills([]); setSelectedIndustries([]); setShowFilters(false); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all relative
                                ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <t.icon size={16} /> {t.label}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === t.id ? 'bg-white/20' : 'bg-white/10'}`}>{t.count}</span>
                            {t.alert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                        </button>
                    ))}
                </div>
            </header>

            {/* Search + Filter */}
            {tab !== 'approvals' && tab !== 'feedback' && (
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                        <input type="text"
                            placeholder={tab === 'seekers' ? 'Search by name or role...' : 'Search by title or description...'}
                            className="w-full bg-slate-900/60 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {tab === 'seekers' && (
                        <button onClick={() => setShowRecommended(r => !r)}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm border transition-all whitespace-nowrap ${showRecommended ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                        >
                            ⭐ Recommended
                        </button>
                    )}
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm border transition-all whitespace-nowrap ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                        <Filter size={16} /> Filters
                        {(selectedSkills.length + selectedIndustries.length) > 0 && (
                            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{selectedSkills.length + selectedIndustries.length}</span>
                        )}
                    </button>
                    {tab === 'ideas' && (
                        <button onClick={() => setIsIdeaModalOpen(true)} className="gradient-btn px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg">
                            <Plus size={16} /> Pitch Idea
                        </button>
                    )}
                </div>
            )}

            {/* Filter panel */}
            <AnimatePresence>
                {showFilters && tab !== 'approvals' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-6 overflow-hidden"
                    >
                        {tab === 'seekers' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2"><Filter size={13} /> Filter by Skill</h3>
                                    {selectedSkills.length > 0 && <button onClick={() => setSelectedSkills([])} className="text-xs text-red-400 font-bold">Clear all</button>}
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-3">
                                    {allSkills.map(sk => (
                                        <CheckFilter key={sk} label={sk} checked={selectedSkills.includes(sk)}
                                            onChange={() => setSelectedSkills(p => p.includes(sk) ? p.filter(s => s !== sk) : [...p, sk])} />
                                    ))}
                                    {allSkills.length === 0 && <p className="text-slate-500 text-sm">No skills yet.</p>}
                                </div>
                            </div>
                        )}
                        {tab === 'ideas' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2"><Filter size={13} /> Filter by Industry</h3>
                                    {selectedIndustries.length > 0 && <button onClick={() => setSelectedIndustries([])} className="text-xs text-red-400 font-bold">Clear all</button>}
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-3">
                                    {allIndustries.map(ind => (
                                        <CheckFilter key={ind} label={ind} checked={selectedIndustries.includes(ind)}
                                            onChange={() => setSelectedIndustries(p => p.includes(ind) ? p.filter(s => s !== ind) : [...p, ind])} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════ SEEKERS TAB ═══════════ */}
            {tab === 'seekers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSeekers.map((u, i) => {
                        const adminIdeaSkills = [...new Set(ideas.flatMap(id => id.lookingFor || []))];
                        const compScore = calculateCompatibility(u.skills, adminIdeaSkills);
                        
                        return (
                        <motion.div key={u._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            onClick={() => openProfile(u._id)}
                            className="glass-card p-7 flex flex-col group hover:border-emerald-500/30 transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[11px] font-bold uppercase">{displayRole(u.role)}</span>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-slate-500 text-[11px] flex items-center gap-1"><MapPin size={11} />{u.location || 'Remote'}</span>
                                    {u.idCard?.status === 'approved' && <span className="flex items-center gap-1 text-blue-400 text-[10px] font-bold"><BadgeCheck size={11}/> Verified</span>}
                                    {u.idCard?.status === 'pending' && <span className="flex items-center gap-1 text-yellow-400 text-[10px] font-bold"><Clock size={11}/> ID Pending</span>}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                                <span>{u.firstName} {u.lastName}</span>
                                {compScore > 0 && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md ml-2 flex-shrink-0">{compScore}% Match</span>}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-1 line-clamp-3">{u.bio || 'Driven professional ready to join a great startup.'}</p>
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {(u.skills?.length > 0 ? u.skills : ['Open to roles']).slice(0, 5).map((sk, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-slate-300">{sk}</span>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-5 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-sm font-bold text-white">
                                        {u.firstName?.[0]}{u.lastName?.[0]}
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Click to view profile</span>
                                </div>
                                <ConnectButton userId={u._id} requestMap={requestMap} onSend={sendRequest} />
                            </div>
                        </motion.div>
                        );
                    })}
                    {filteredSeekers.length === 0 && <EmptyState msg="No seekers match your filters." />}
                </div>
            )}

            {/* ═══════════ IDEAS TAB ═══════════ */}
            {tab === 'ideas' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredIdeas.map((idea, i) => (
                        <motion.div key={idea._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="glass-card p-7 flex flex-col group hover:border-purple-500/30 transition-all"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[11px] font-bold uppercase">{idea.industry}</span>
                                <span className="text-slate-500 text-[11px] font-bold uppercase">{idea.status}</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors">{idea.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1 line-clamp-4 mb-6">{idea.description}</p>
                            <div className="flex flex-wrap gap-2 mb-5">
                                {idea.lookingFor?.map((r, idx) => <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-slate-300">{r}</span>)}
                            </div>
                            <div className="flex items-center justify-between pt-5 border-t border-white/5 text-xs">
                                <span className="text-slate-500 font-bold uppercase">Equity</span>
                                <span className="font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg">{idea.equityOffered || 'TBD'}</span>
                            </div>
                        </motion.div>
                    ))}
                    {filteredIdeas.length === 0 && <EmptyState msg="No ideas match your filters." />}
                </div>
            )}

            {/* ═══════════ ID APPROVALS TAB ═══════════ */}
            {tab === 'approvals' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-indigo-400" />
                        <h2 className="text-xl font-bold">Pending ID Verifications</h2>
                        <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">{pendingIds.length} pending</span>
                    </div>

                    {pendingIds.length === 0 ? (
                        <div className="glass-card p-20 text-center">
                            <ShieldCheck size={52} className="mx-auto text-green-500/30 mb-5" />
                            <h3 className="text-2xl font-bold text-slate-300 mb-2">All Clear!</h3>
                            <p className="text-slate-500 text-sm">No pending ID card verifications.</p>
                        </div>
                    ) : (
                        pendingIds.map((u) => (
                            <motion.div key={u._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="glass-card overflow-hidden border-yellow-500/10"
                            >
                                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/40">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-lg">
                                            {u.firstName?.[0]}{u.lastName?.[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-xl font-bold">{u.firstName} {u.lastName}</h3>
                                                <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-[11px] font-bold flex items-center gap-1">
                                                    <Clock size={10} /> Pending Review
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mt-0.5">{u.email} · {displayRole(u.role)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => openProfile(u._id)} className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-sm font-semibold flex items-center gap-2">
                                        <Eye size={15} /> View Full Profile
                                    </button>
                                </div>

                                <div className="p-6 bg-slate-950/30">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldCheck size={13} className="text-indigo-400" /> Uploaded ID Card
                                    </p>
                                    {u.idCard?.url ? (
                                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                                            <img src={u.idCard.url} alt={`${u.firstName}'s ID Card`}
                                                className="w-full max-h-[420px] object-contain" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-6 bg-slate-900/60 rounded-2xl border border-dashed border-white/10">
                                            <AlertCircle size={20} className="text-slate-600" />
                                            <p className="text-slate-500 text-sm">No ID card image available</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-4 p-6 border-t border-white/5 bg-slate-900/20">
                                    <p className="text-slate-500 text-sm mr-auto">Review carefully before approving.</p>
                                    <button onClick={() => reviewId(u._id, 'rejected')} disabled={reviewLoading[u._id]}
                                        className="flex items-center gap-2 px-7 py-3.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-2xl font-bold transition-all disabled:opacity-40 text-sm">
                                        <X size={18} /> Reject
                                    </button>
                                    <button onClick={() => reviewId(u._id, 'approved')} disabled={reviewLoading[u._id]}
                                        className="gradient-btn flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 disabled:opacity-40">
                                        <Check size={18} /> Approve ID
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* ═══════════ PROFILE MODAL ═══════════ */}
            <AnimatePresence>
                {(selectedUser || profileLoading) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center p-6 pt-20 overflow-y-auto"
                        onClick={() => setSelectedUser(null)}
                    >
                        {profileLoading ? (
                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mt-32" />
                        ) : selectedUser && (
                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                                className="glass-card max-w-2xl w-full overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Profile header */}
                                <div className="p-8 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-3xl font-extrabold text-white shadow-2xl shadow-indigo-500/20 shrink-0">
                                            {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                                <h2 className="text-2xl font-extrabold">{selectedUser.firstName} {selectedUser.lastName}</h2>
                                                {selectedUser.idCard?.status === 'approved' && <BadgeCheck size={20} className="text-blue-400" />}
                                            </div>
                                            <p className="text-indigo-400 font-semibold flex items-center gap-2"><Briefcase size={14} /> {displayRole(selectedUser.role)}</p>
                                            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1"><MapPin size={13} /> {selectedUser.location || 'Remote'}</p>
                                        </div>
                                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                                    </div>
                                </div>

                                {/* Profile body */}
                                <div className="p-8 space-y-6">
                                    {/* Bio */}
                                    {selectedUser.bio && (
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">About</h3>
                                            <p className="text-slate-300 leading-relaxed">{selectedUser.bio}</p>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {selectedUser.skills?.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUser.skills.map((s, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-sm font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Looking For */}
                                    {selectedUser.lookingFor?.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Looking For</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUser.lookingFor.map((s, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Links */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {selectedUser.email && (
                                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                                <Mail size={16} className="text-slate-400" />
                                                <span className="text-sm text-slate-300 truncate">{selectedUser.email}</span>
                                            </div>
                                        )}
                                        {selectedUser.linkedIn && (
                                            <a href={selectedUser.linkedIn} target="_blank" rel="noopener" className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                                <Linkedin size={16} className="text-blue-400" />
                                                <span className="text-sm text-slate-300 truncate">LinkedIn Profile</span>
                                            </a>
                                        )}
                                        {selectedUser.portfolio && (
                                            <a href={selectedUser.portfolio} target="_blank" rel="noopener" className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                                <LinkIcon size={16} className="text-emerald-400" />
                                                <span className="text-sm text-slate-300 truncate">{selectedUser.portfolio}</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* ID Card Section */}
                                    <div className="border-t border-white/5 pt-6">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <ShieldCheck size={13} className="text-indigo-400" /> ID Card Verification
                                        </h3>

                                        {/* Status */}
                                        {selectedUser.idCard?.status === 'approved' && (
                                            <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl mb-4">
                                                <BadgeCheck size={18} className="text-green-400" />
                                                <p className="text-sm text-green-300 font-semibold">ID Card Verified ✅</p>
                                            </div>
                                        )}
                                        {selectedUser.idCard?.status === 'rejected' && (
                                            <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl mb-4">
                                                <AlertCircle size={18} className="text-red-400" />
                                                <p className="text-sm text-red-300 font-semibold">ID Card Rejected</p>
                                            </div>
                                        )}

                                        {/* ID Card Image */}
                                        {selectedUser.idCard?.url ? (
                                            <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 mb-5">
                                                <img src={selectedUser.idCard.url} alt="ID Card"
                                                    className="w-full max-h-[400px] object-contain" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-6 bg-slate-900/60 rounded-2xl border border-dashed border-white/10 mb-5">
                                                <AlertCircle size={20} className="text-slate-600" />
                                                <p className="text-slate-500 text-sm">No ID card uploaded yet</p>
                                            </div>
                                        )}

                                        {/* Approve / Reject buttons — only if pending */}
                                        {selectedUser.idCard?.status === 'pending' && (
                                            <div className="flex items-center gap-4 p-5 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                                                <ShieldCheck size={20} className="text-yellow-400 shrink-0" />
                                                <p className="text-sm text-slate-300 flex-1">This ID is pending — review and approve or reject.</p>
                                                <button onClick={() => reviewId(selectedUser._id, 'rejected')} disabled={reviewLoading[selectedUser._id]}
                                                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all font-bold text-sm flex items-center gap-2 disabled:opacity-40">
                                                    <X size={15} /> Reject
                                                </button>
                                                <button onClick={() => reviewId(selectedUser._id, 'approved')} disabled={reviewLoading[selectedUser._id]}
                                                    className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg disabled:opacity-40">
                                                    <BadgeCheck size={15} /> Approve
                                                </button>
                                            </div>
                                        )}

                                        {/* No ID at all */}
                                        {(!selectedUser.idCard || selectedUser.idCard?.status === 'none') && (
                                            <div className="flex items-center gap-3 p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                                                <AlertCircle size={16} className="text-slate-500" />
                                                <p className="text-sm text-slate-500">This user hasn&apos;t uploaded an ID card yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="p-6 border-t border-white/5 bg-slate-900/20 flex items-center justify-between">
                                    <ConnectButton userId={selectedUser._id} requestMap={requestMap} onSend={sendRequest} />
                                    <button onClick={() => setSelectedUser(null)} className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-sm transition-all">
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════ FEEDBACK TAB ═══════════ */}
            {tab === 'feedback' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <MessageSquare size={20} className="text-indigo-400" />
                        <h2 className="text-xl font-bold">Platform Feedback</h2>
                    </div>

                    {feedbacks.length === 0 ? (
                        <EmptyState msg="No feedback received yet." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {feedbacks.map((fb) => (
                                <div key={fb._id} className="glass-card p-6 border-white/5 bg-slate-900/40">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center font-bold">
                                                {fb.userId?.firstName?.[0]}{fb.userId?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{fb.userId?.firstName} {fb.userId?.lastName}</p>
                                                <p className="text-[10px] text-slate-500">{displayRole(fb.userId?.role)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} size={14} className={fb.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-300 italic whitespace-pre-wrap px-2 py-3 bg-white/5 border border-white/5 rounded-xl">"{fb.message}"</p>
                                    <p className="text-[10px] text-slate-500 text-right mt-3 text-uppercase">
                                        {new Date(fb.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <PostIdeaModal
                isOpen={isIdeaModalOpen}
                onClose={() => setIsIdeaModalOpen(false)}
                onIdeaCreated={(idea) => { setIdeas(p => [idea, ...p]); setTab('ideas'); }}
            />
        </div>
    );
}

function EmptyState({ msg }) {
    return (
        <div className="col-span-full text-center py-20 glass-card">
            <AlertCircle size={40} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">{msg}</p>
        </div>
    );
}