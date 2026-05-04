'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, MessageCircle, ArrowRight,
    Briefcase, Clock, CheckCircle2, XCircle, Users,
    ShieldCheck, BadgeCheck, Eye, ChevronDown, ChevronUp, AlertCircle,
    MapPin, Mail, Linkedin, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { calculateCompatibility } from '@/lib/compatibility';

const StatusBadge = ({ status }) => {
    if (status === 'accepted') return <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-xl text-xs font-bold"><CheckCircle2 size={13} /> Accepted</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold"><XCircle size={13} /> Declined</span>;
    return <span className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-xl text-xs font-bold"><Clock size={13} /> Pending</span>;
};

const IdBadge = ({ status }) => {
    if (status === 'approved') return <span className="flex items-center gap-1 text-blue-400 text-[10px] font-bold"><BadgeCheck size={11} /> Verified</span>;
    if (status === 'pending') return <span className="flex items-center gap-1 text-yellow-400 text-[10px] font-bold"><Clock size={11} /> ID Pending</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 text-red-400 text-[10px] font-bold"><AlertCircle size={11} /> ID Rejected</span>;
    return <span className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">No ID</span>;
};

export default function RequestsPage() {
    const { user: currentUser } = useAuth();
    const displayRole = (r, fallback = 'User') => {
        if (!r) return fallback;
        if (/job seeker/i.test(r) || /seeker/i.test(r)) return 'User';
        return r;
    };
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [reviewLoading, setReviewLoading] = useState({});

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/requests/received');
            setRequests(data);
        } catch { toast.error('Failed to load requests'); }
        finally { setLoading(false); }
    };

    // Accept/Decline connection request
    const respond = async (requestId, status, senderName) => {
        try {
            await api.post('/requests/respond', { requestId, status });
            setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r));
            if (status === 'accepted') toast.success(`🎉 Connected with ${senderName}!`);
            else toast('Request declined', { icon: '👋' });
        } catch { toast.error('Failed to respond'); }
    };

    // Approve/Reject ID card (admin only)
    const reviewIdCard = async (userId, idStatus, reqId) => {
        try {
            await api.post(`/users/review-id/${userId}`, { status: idStatus });
            // Update the sender's idCard.status in local state
            setRequests(prev => prev.map(r => {
                if (r._id === reqId && r.senderId) {
                    return { ...r, senderId: { ...r.senderId, idCard: { ...r.senderId.idCard, status: idStatus } } };
                }
                return r;
            }));
            if (selectedUser?._id === userId) {
                setSelectedUser(prev => ({ ...prev, idCard: { ...prev.idCard, status: idStatus } }));
            }
            toast.success(idStatus === 'approved' ? '✅ ID Approved!' : '❌ ID Rejected');
        } catch { toast.error('Failed to review ID'); }
        finally { setReviewLoading(prev => ({ ...prev, [userId]: false })); }
    };

    // Open full profile modal
    const openProfile = async (userId) => {
        setProfileLoading(true);
        setSelectedUser({ _id: userId }); // show loader early
        try {
            const { data } = await api.get(`/users/${userId}`);
            setSelectedUser(data);
        } catch { toast.error('Failed to load profile'); setSelectedUser(null); }
        finally { setProfileLoading(false); }
    };

    // Log profile view when expanding ID card
    const toggleIdCard = async (reqId, senderId) => {
        if (expandedId !== reqId) {
            // Opening — log a profile view
            try { await api.get(`/users/${senderId}`); } catch {}
        }
        setExpandedId(prev => prev === reqId ? null : reqId);
    };

    const isAdmin = currentUser?.accountType === 'company' || currentUser?.role === 'Company Owner' || currentUser?.role === 'Founder';
    const pending = requests.filter(r => r.status === 'pending');
    const accepted = requests.filter(r => r.status === 'accepted');
    const rejected = requests.filter(r => r.status === 'rejected');

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2">Connection <span className="gradient-text">Requests</span></h1>
                    <p className="text-slate-400">Review ID cards and manage connections.</p>
                </div>
                <div className="flex gap-4 flex-wrap">
                    <div className="px-5 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-center">
                        <div className="text-2xl font-extrabold text-yellow-400">{pending.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Pending</div>
                    </div>
                    <div className="px-5 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                        <div className="text-2xl font-extrabold text-green-400">{accepted.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-green-500">Connected</div>
                    </div>
                    <div className="px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        <div className="text-2xl font-extrabold text-red-400">{rejected.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">Declined</div>
                    </div>
                </div>
            </header>

            {/* PENDING */}
            {pending.length > 0 && (
                <section className="space-y-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-2">
                        <Clock size={14} /> Awaiting Your Response ({pending.length})
                    </h2>
                    <AnimatePresence>
                        {pending.map((req) => (
                            <RequestCard key={req._id} req={req} onRespond={respond} onReviewId={reviewIdCard}
                                showActions expanded={expandedId === req._id}
                                onToggleId={() => toggleIdCard(req._id, req.senderId?._id)} isAdmin={isAdmin}
                                onOpenProfile={() => openProfile(req.senderId?._id)} />
                        ))}
                    </AnimatePresence>
                </section>
            )}

            {/* ACCEPTED */}
            {accepted.length > 0 && (
                <section className="space-y-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-green-400 flex items-center gap-2">
                        <CheckCircle2 size={14} /> Connected ({accepted.length})
                    </h2>
                    {accepted.map((req) => (
                        <RequestCard key={req._id} req={req} showActions={false} onReviewId={reviewIdCard}
                            expanded={expandedId === req._id}
                            onToggleId={() => toggleIdCard(req._id, req.senderId?._id)} isAdmin={isAdmin}
                            onOpenProfile={() => openProfile(req.senderId?._id)} />
                    ))}
                </section>
            )}

            {/* REJECTED */}
            {rejected.length > 0 && (
                <section className="space-y-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                        <XCircle size={14} /> Declined ({rejected.length})
                    </h2>
                    {rejected.map((req) => (
                        <RequestCard key={req._id} req={req} showActions={false} onReviewId={reviewIdCard}
                            expanded={expandedId === req._id}
                            onToggleId={() => toggleIdCard(req._id, req.senderId?._id)} isAdmin={isAdmin}
                            onOpenProfile={() => openProfile(req.senderId?._id)} />
                    ))}
                </section>
            )}

            {/* Empty */}
            {requests.length === 0 && (
                <div className="text-center py-20 px-8 glass-card">
                    <div className="w-20 h-20 bg-white/5 mx-auto rounded-3xl flex items-center justify-center text-slate-600 mb-6"><Users size={40} /></div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-300">No requests yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto leading-relaxed mb-8">Share your profile or explore the Discovery Hub.</p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 gradient-btn px-8 py-4 rounded-2xl font-bold text-sm shadow-lg">
                        Go to Discovery <ArrowRight size={16} />
                    </Link>
                </div>
            )}
            {/* ═══════════ PROFILE MODAL ═══════════ */}
            <AnimatePresence>
                {(selectedUser || profileLoading) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center p-6 pt-20 overflow-y-auto"
                        onClick={() => setSelectedUser(null)}
                    >
                        {profileLoading && !selectedUser?.email ? (
                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mt-32" />
                        ) : selectedUser?.email && (
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
                                                {selectedUser.idCard?.status === 'pending' && <Clock size={20} className="text-yellow-400" />}
                                            </div>
                                            <p className="text-indigo-400 font-semibold flex items-center gap-2"><Briefcase size={14} /> {displayRole(selectedUser.role)}</p>
                                            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1"><MapPin size={13} /> {selectedUser.location || 'Remote'}</p>
                                        </div>
                                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                                    </div>
                                </div>

                                {/* Profile body */}
                                <div className="p-8 space-y-6">
                                    {selectedUser.bio && (
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">About</h3>
                                            <p className="text-slate-300 leading-relaxed">{selectedUser.bio}</p>
                                        </div>
                                    )}

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

                                    {/* ID Card Section */}
                                    <div className="border-t border-white/5 pt-6">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <ShieldCheck size={13} className="text-indigo-400" /> ID Card Verification
                                        </h3>

                                        {selectedUser.idCard?.url ? (
                                            <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 mb-5">
                                                <img src={selectedUser.idCard.url} alt="ID Card" className="w-full max-h-[400px] object-contain" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-6 bg-slate-900/60 rounded-2xl border border-dashed border-white/10 mb-5">
                                                <AlertCircle size={20} className="text-slate-600" />
                                                <p className="text-slate-500 text-sm">No ID card uploaded yet</p>
                                            </div>
                                        )}

                                        {isAdmin && selectedUser.idCard?.status === 'pending' && (
                                            <div className="flex items-center gap-4 p-5 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                                                <ShieldCheck size={20} className="text-yellow-400 shrink-0" />
                                                <p className="text-sm text-slate-300 flex-1">This ID is pending — review carefully before approving.</p>
                                                <button onClick={() => reviewIdCard(selectedUser._id, 'rejected', requests.find(r => r.senderId?._id === selectedUser._id)?._id)} disabled={reviewLoading[selectedUser._id]}
                                                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all font-bold text-sm flex items-center gap-2 disabled:opacity-40">
                                                    <X size={15} /> Reject
                                                </button>
                                                <button onClick={() => reviewIdCard(selectedUser._id, 'approved', requests.find(r => r.senderId?._id === selectedUser._id)?._id)} disabled={reviewLoading[selectedUser._id]}
                                                    className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg disabled:opacity-40">
                                                    <BadgeCheck size={15} /> Approve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-6 border-t border-white/5 bg-slate-900/20 flex justify-end">
                                    <button onClick={() => setSelectedUser(null)} className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-sm transition-all">Close</button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Request Card ─── */
function RequestCard({ req, onRespond, onReviewId, showActions, expanded, onToggleId, isAdmin, onOpenProfile }) {
    const sender = req.senderId;
    if (!sender) return null;

    const hasIdCard = sender.idCard?.url;
    const idStatus = sender.idCard?.status || 'none';
    const compScore = req.ideaId && sender.skills && req.ideaId.lookingFor ? calculateCompatibility(sender.skills, req.ideaId.lookingFor) : 0;

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`glass-card overflow-hidden transition-all
                ${req.status === 'accepted' ? 'border-green-500/20' :
                  req.status === 'rejected' ? 'border-red-500/10 opacity-60' :
                  'hover:border-indigo-500/30'}`}
        >
            {/* ── Top section ── */}
            <div className="p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5">
                {/* Avatar */}
                <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl
                    ${req.status === 'accepted' ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20' :
                      req.status === 'rejected' ? 'bg-slate-700' :
                      'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'}`}
                >
                    {sender.firstName?.[0]}{sender.lastName?.[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            {sender.firstName} {sender.lastName}
                            {compScore > 0 && <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md">{compScore}% Skill Match</span>}
                        </h3>
                            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <Briefcase size={10} /> {displayRole(sender.role)}
                        </span>
                        <StatusBadge status={req.status} />
                        <IdBadge status={idStatus} />
                    </div>

                    {sender.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {sender.skills.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 font-medium">{s}</span>
                            ))}
                        </div>
                    )}

                    {req.ideaId && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl w-fit">
                            <Briefcase size={12} className="text-indigo-400" />
                            <span className="text-xs font-bold text-indigo-300">
                                Request for Idea: {req.ideaId.title} ({req.ideaId.industry})
                            </span>
                        </div>
                    )}

                    <p className="text-slate-400 text-sm italic line-clamp-2">
                        &quot;{req.message || "Hi! I'd love to connect and explore opportunities together."}&quot;
                    </p>
                </div>

                {/* Right actions */}
                <div className="shrink-0 flex flex-col gap-3 items-end">
                    <div className="flex gap-2">
                        {/* View Full Profile button */}
                        <button onClick={onOpenProfile}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/30"
                        >
                            <Eye size={14} /> Full Profile
                        </button>

                        {/* View ID Card Toggle */}
                        {hasIdCard && (
                            <button onClick={onToggleId}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border
                                    ${expanded
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/30'}`}
                            >
                                <ShieldCheck size={14} /> ID
                                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                        )}
                    </div>

                    {/* Connection Accept/Decline or Chat */}
                    <div className="flex gap-3">
                        {showActions && req.status === 'pending' ? (
                            <>
                                <button onClick={() => onRespond(req._id, 'rejected', sender.firstName)}
                                    className="p-2.5 px-5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all flex items-center gap-2 font-bold text-sm">
                                    <X size={16} /> Decline
                                </button>
                                <button onClick={() => onRespond(req._id, 'accepted', sender.firstName)}
                                    className="gradient-btn rounded-xl flex items-center gap-2 font-bold px-6 py-2.5 shadow-xl shadow-indigo-600/20">
                                    <Check size={16} /> Accept
                                </button>
                            </>
                        ) : req.status === 'accepted' ? (
                            <Link href="/messages" className="gradient-btn px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg whitespace-nowrap">
                                <MessageCircle size={15} /> Chat
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* ── Expanded ID Card Section ── */}
            <AnimatePresence>
                {expanded && hasIdCard && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-7 pb-7 pt-3 border-t border-white/5 bg-slate-950/30">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ShieldCheck size={13} className="text-indigo-400" /> ID Card — {sender.firstName} {sender.lastName}
                            </p>

                            {/* ID Card Image */}
                            <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 mb-5">
                                <img
                                    src={sender.idCard.url}
                                    alt={`${sender.firstName}'s ID Card`}
                                    className="w-full max-h-[420px] object-contain"
                                />
                            </div>

                            {/* Status + Date */}
                            <div className="flex items-center gap-3 mb-5">
                                <IdBadge status={idStatus} />
                                {sender.idCard?.submittedAt && (
                                    <span className="text-slate-600 text-xs">
                                        Submitted: {new Date(sender.idCard.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                            </div>

                            {/* ── ID Approve / Reject Buttons (Admin only, if ID is pending) ── */}
                            {isAdmin && idStatus === 'pending' && (
                                <div className="flex items-center gap-4 p-5 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                                    <ShieldCheck size={20} className="text-yellow-400 shrink-0" />
                                    <p className="text-sm text-slate-300 flex-1">
                                        This user&apos;s ID card is pending review. Approve or reject it below.
                                    </p>
                                    <button
                                        onClick={() => onReviewId(sender._id, 'rejected', req._id)}
                                        className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all font-bold text-sm flex items-center gap-2"
                                    >
                                        <X size={15} /> Reject ID
                                    </button>
                                    <button
                                        onClick={() => onReviewId(sender._id, 'approved', req._id)}
                                        className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                    >
                                        <BadgeCheck size={15} /> Approve ID
                                    </button>
                                </div>
                            )}

                            {/* Already approved message */}
                            {idStatus === 'approved' && (
                                <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl">
                                    <BadgeCheck size={18} className="text-green-400" />
                                    <p className="text-sm text-green-300 font-semibold">This ID card has been verified and approved.</p>
                                </div>
                            )}

                            {/* Rejected message */}
                            {idStatus === 'rejected' && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                    <AlertCircle size={18} className="text-red-400" />
                                    <p className="text-sm text-red-300 font-semibold">This ID card has been rejected.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
