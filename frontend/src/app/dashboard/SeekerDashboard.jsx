'use client';
import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Check, Clock, X, ChevronRight, Filter,
    Rocket, Briefcase, Terminal, AlertCircle, BadgeCheck, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateCompatibility } from '@/lib/compatibility';

/* ─── Request button ─── */
const RequestButton = ({ ideaId, userId, requestMap, onSend }) => {
    const key = ideaId || userId;
    const s = requestMap[key];
    if (s === 'accepted') return <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-xl text-xs font-bold"><Check size={12}/> Connected</span>;
    if (s === 'pending')  return <span className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-xl text-xs font-bold"><Clock size={12}/> Pending</span>;
    if (s === 'rejected') return <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold"><X size={12}/> Declined</span>;
    return <button onClick={() => onSend(userId, ideaId)} className="p-2 bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/30 rounded-xl text-indigo-400 transition-all flex items-center gap-1.5 font-bold text-xs">Contact <ChevronRight size={13}/></button>;
};

/* ─── Checkbox ─── */
const Checkbox = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer group">
        <div onClick={onChange} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-white/20 bg-white/5 group-hover:border-indigo-500/50'}`}>
            {checked && <Check size={12} className="text-white"/>}
        </div>
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </label>
);

export default function SeekerDashboard() {
    const { user: currentUser } = useAuth();
    const [myProfile, setMyProfile] = useState(null); // fresh profile with skills
    const [ideas, setIdeas] = useState([]);
    const [requestMap, setRequestMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedIndustries, setSelectedIndustries] = useState([]);
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showRecommended, setShowRecommended] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [ideasRes, sentRes, profileRes] = await Promise.all([
                    api.get('/ideas'),
                    api.get('/requests/sent'),
                    api.get('/users/profile'),  // fetch fresh skills data
                ]);
                setIdeas(ideasRes.data);
                setMyProfile(profileRes.data);
                const map = {};
                for (const r of sentRes.data) {
                    const key = r.ideaId ? r.ideaId.toString() : r.receiverId?.toString();
                    if (key) map[key] = r.status;
                }
                setRequestMap(map);
            } catch { toast.error('Failed to load'); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const sendRequest = async (receiverId, ideaId) => {
        const key = ideaId || receiverId;
        if (!receiverId || receiverId === currentUser?.id || requestMap[key]) return;

        // Use fresh profile skills (login response doesn't include skills field)
        const mySkills = myProfile?.skills || [];
        const idea = ideas.find(i => i._id === ideaId);

        // Strict matching: if idea has lookingFor AND user has skills, both must overlap
        if (idea && idea.lookingFor?.length > 0 && mySkills.length > 0) {
            const compScore = calculateCompatibility(mySkills, idea.lookingFor);
            if (compScore === 0) {
                toast.error("Skills did not match! Your skills do not match the requirements of this startup. Update your profile first.", {
                    icon: '⚠️',
                    duration: 5000
                });
                return;
            }
        } else if (idea && idea.lookingFor?.length > 0 && mySkills.length === 0) {
            // User hasn't added any skills — warn them
            toast.error("Please add skills to your profile before sending requests!", {
                icon: '📝',
                duration: 4000
            });
            return;
        }

        setRequestMap(prev => ({ ...prev, [key]: 'pending' }));
        try {
            await api.post('/requests/send', { receiverId, ideaId, message: "Hi! I saw your startup idea and I'd love to connect!" });
            toast.success('Request sent! 🚀');
        } catch (err) {
            setRequestMap(prev => { const u = {...prev}; delete u[key]; return u; });
            toast.error(err.response?.data?.error || 'Failed');
        }
    };

    // Log profile view when clicking eye icon on a founder card
    const logProfileView = async (userId) => {
        try { await api.get(`/users/${userId}`); toast('Profile viewed', { icon: '👁️' }); } catch {}
    };

    // All unique industries
    const allIndustries = useMemo(() => [...new Set(ideas.map(i => i.industry).filter(Boolean))].sort(), [ideas]);
    // All unique company names from founder names
    const allCompanies = useMemo(() => [...new Set(ideas.map(i => i.founderId?.firstName ? `${i.founderId.firstName} ${i.founderId.lastName}` : null).filter(Boolean))].sort(), [ideas]);

    const toggleIndustry = (v) => setSelectedIndustries(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
    const toggleCompany  = (v) => setSelectedCompanies(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

    const filtered = ideas.filter(i => {
        const searchMatch = i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()) || i.industry?.toLowerCase().includes(search.toLowerCase());
        const indMatch = selectedIndustries.length === 0 || selectedIndustries.includes(i.industry);
        const founderName = i.founderId?.firstName ? `${i.founderId.firstName} ${i.founderId.lastName}` : '';
        const compMatch = selectedCompanies.length === 0 || selectedCompanies.includes(founderName);
        
        const mySkillsLower = (myProfile?.skills || []).map(s => s.toLowerCase());
        const recomMatch = !showRecommended || (i.lookingFor?.some(r => mySkillsLower.includes(r.toLowerCase())));

        return searchMatch && indMatch && compMatch && recomMatch;
    });

    const isOwn = (idea) => idea.founderId?._id === currentUser?.id;

    if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"/></div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <header>
                <div className="flex items-center gap-3 mb-1">
                    <Briefcase size={18} className="text-emerald-400"/>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">User Dashboard</span>
                </div>
                <h1 className="text-4xl font-extrabold mb-2">Explore <span className="gradient-text">Startups</span></h1>
                <p className="text-slate-400">Browse company ideas and connect with founders.</p>
            </header>

            {/* Search + filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17}/>
                    <input type="text" placeholder="Search by idea, industry..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"/>
                </div>
                
                <button onClick={() => setShowRecommended(r => !r)}
                    className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm border transition-all whitespace-nowrap ${showRecommended ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                >
                    ⭐ Recommended
                </button>

                <button onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm border transition-all whitespace-nowrap ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                >
                    <Filter size={16}/> Filters
                    {(selectedIndustries.length + selectedCompanies.length) > 0 && (
                        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{selectedIndustries.length + selectedCompanies.length}</span>
                    )}
                </button>
            </div>

            {/* Filter panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-6 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2"><Filter size={13}/> By Industry</h3>
                                {selectedIndustries.length > 0 && <button onClick={() => setSelectedIndustries([])} className="text-xs text-red-400 font-bold">Clear</button>}
                            </div>
                            <div className="flex flex-col gap-3">
                                {allIndustries.map(ind => <Checkbox key={ind} label={ind} checked={selectedIndustries.includes(ind)} onChange={() => toggleIndustry(ind)}/>)}
                                {allIndustries.length === 0 && <p className="text-slate-500 text-sm">No industries found yet.</p>}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2"><Filter size={13}/> By Founder / Company</h3>
                                {selectedCompanies.length > 0 && <button onClick={() => setSelectedCompanies([])} className="text-xs text-red-400 font-bold">Clear</button>}
                            </div>
                            <div className="flex flex-col gap-3">
                                {allCompanies.map(c => <Checkbox key={c} label={c} checked={selectedCompanies.includes(c)} onChange={() => toggleCompany(c)}/>)}
                                {allCompanies.length === 0 && <p className="text-slate-500 text-sm">No companies found yet.</p>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ideas grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((idea, i) => (
                    <motion.div key={idea._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="glass-card p-7 flex flex-col group hover:border-purple-500/30 transition-all"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[11px] font-bold uppercase">{idea.industry}</span>
                            <span className="text-slate-500 text-[11px] font-bold uppercase flex items-center gap-1"><Terminal size={11}/> {idea.status}</span>
                        </div>

                        <h3 className="text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors">{idea.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed flex-1 line-clamp-4 mb-6">{idea.description}</p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-bold uppercase">Equity Offered</span>
                                <span className="font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/20">{idea.equityOffered || 'TBD'}</span>
                            </div>
                            {idea.lookingFor?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="text-[11px] text-slate-500 font-bold uppercase self-center mr-1">Looking for:</span>
                                    {idea.lookingFor.map((r, idx) => <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-slate-300">{r}</span>)}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-sm font-bold text-white">
                                    {idea.founderId?.firstName?.[0] || '?'}{idea.founderId?.lastName?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{idea.founderId?.firstName} {idea.founderId?.lastName}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Founder</p>
                                        {idea.founderId?.idCard?.status === 'approved' && <BadgeCheck size={11} className="text-blue-400" title="Verified"/>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isOwn(idea) && idea.founderId?._id && (
                                    <button onClick={() => logProfileView(idea.founderId._id)} className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all" title="View Founder Profile">
                                        <Eye size={14} />
                                    </button>
                                )}
                                {isOwn(idea) ? (
                                    <span className="text-[10px] text-indigo-400 font-bold uppercase bg-indigo-500/10 px-3 py-1.5 rounded-lg">Your Idea</span>
                                ) : (
                                    <RequestButton ideaId={idea._id} userId={idea.founderId?._id} requestMap={requestMap} onSend={sendRequest}/>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full text-center py-20 glass-card">
                        <AlertCircle size={40} className="mx-auto text-slate-600 mb-4"/>
                        <p className="text-slate-400 font-medium">No ideas match your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}