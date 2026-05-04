'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import {
    User, Mail, MapPin, Briefcase, Save, Plus, X,
    Shield, BadgeCheck, Clock, AlertCircle, Eye,
    Upload, Link as LinkIcon, Linkedin, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const IdStatusBadge = ({ status }) => {
    if (status === 'approved') return (
        <span className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-bold">
            <BadgeCheck size={16} /> Verified — ID Approved
        </span>
    );
    if (status === 'pending') return (
        <span className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl text-sm font-bold">
            <Clock size={16} /> Pending Admin Review
        </span>
    );
    if (status === 'rejected') return (
        <span className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold">
            <AlertCircle size={16} /> Rejected — Please re-upload
        </span>
    );
    return null;
};

export default function ProfilePage() {
    const { user: authUser } = useAuth();
    const displayRole = (r, fallback = 'User') => {
        // If the logged-in account type is investor, label should show Investor
        if (authUser?.accountType === 'investor') return 'Investor';
        if (!r) return fallback;
        if (/job seeker/i.test(r) || /seeker/i.test(r)) return 'User';
        return r;
    };
    const fileRef = useRef();
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', bio: '', role: '',
        location: '', skills: [], lookingFor: [], linkedIn: '', portfolio: ''
    });
    const [idCard, setIdCard] = useState({ status: 'none', url: '' });
    const [profileViews, setProfileViews] = useState([]);
    const [myIdeas, setMyIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [newLooking, setNewLooking] = useState('');
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'idcard' | 'views'

    useEffect(() => {
        const load = async () => {
            try {
                const [profileRes, ideasRes] = await Promise.all([
                    api.get('/users/profile'),
                    api.get('/ideas/my').catch(() => ({ data: [] }))
                ]);
                const p = profileRes.data;
                setFormData({
                    firstName: p.firstName || '', lastName: p.lastName || '',
                    bio: p.bio || '', role: p.role || '',
                    location: p.location || '', skills: p.skills || [],
                    lookingFor: p.lookingFor || [], linkedIn: p.linkedIn || '',
                    portfolio: p.portfolio || ''
                });
                setIdCard(p.idCard || { status: 'none', url: '' });
                setProfileViews(p.profileViews || []);
                setMyIdeas(ideasRes.data || []);
            } catch {
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formik = useFormik({
        initialValues: formData,
        enableReinitialize: true,
        validationSchema: Yup.object({
            firstName: Yup.string().required('First name is required'),
            lastName: Yup.string().required('Last name is required'),
            role: Yup.string().required('Role is required'),
            location: Yup.string().required('Location is required'),
        }),
        onSubmit: async (values) => {
            setSaving(true);
            try {
                await api.put('/users/profile', values);
                setFormData(values);
                toast.success('Profile saved! ✅');
            } catch { toast.error('Save failed'); }
            finally { setSaving(false); }
        }
    });

    const addSkill = () => {
        if (newSkill.trim() && !formik.values.skills.includes(newSkill.trim())) {
            formik.setFieldValue('skills', [...formik.values.skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const removeSkill = (s) => formik.setFieldValue('skills', formik.values.skills.filter(x => x !== s));
    const addLooking = () => {
        if (newLooking.trim() && !formik.values.lookingFor.includes(newLooking.trim())) {
            formik.setFieldValue('lookingFor', [...formik.values.lookingFor, newLooking.trim()]);
            setNewLooking('');
        }
    };
    const removeLooking = (s) => formik.setFieldValue('lookingFor', formik.values.lookingFor.filter(x => x !== s));

    const handleIdUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            setUploadingId(true);
            try {
                const base64 = ev.target.result;
                await api.post('/users/upload-id', { idCardBase64: base64 });
                setIdCard({ status: 'pending', url: base64 });
                toast.success('ID card submitted for review! 🎉');
            } catch { toast.error('Upload failed'); }
            finally { setUploadingId(false); }
        };
        reader.readAsDataURL(file);
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    const tabs = [
        { id: 'profile', label: 'Edit Profile', icon: User },
        { id: 'idcard',  label: 'ID Verification', icon: Shield },
        { id: 'views',   label: `Profile Views (${profileViews.length})`, icon: Eye },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* ── Profile header card ── */}
            <div className="glass-card p-8 flex items-center gap-8">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl font-extrabold text-white shadow-2xl shadow-indigo-500/20 shrink-0">
                    {formData.firstName?.[0] || '?'}{formData.lastName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h1 className="text-3xl font-extrabold">{formik.values.firstName} {formik.values.lastName}</h1>
                        {idCard.status === 'approved' && <BadgeCheck size={24} className="text-blue-400" title="Verified" />}
                    </div>
                    <p className="text-indigo-400 font-semibold flex items-center gap-2 mb-2">
                        <Briefcase size={15} /> {displayRole(formik.values.role) || 'Set your role'}
                    </p>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <MapPin size={13} /> {formik.values.location || 'Set your location'}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase text-slate-400">
                        {authUser?.accountType === 'company' ? '🏢 Company Owner' : '💼 User'}
                    </div>
                    <IdStatusBadge status={idCard.status} />
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 w-fit">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                            ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <t.icon size={15} /> {t.label}
                    </button>
                ))}
            </div>

            {/* ══════════ PROFILE EDIT TAB ══════════ */}
            {activeTab === 'profile' && (
                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div className="glass-card p-8 space-y-6">
                        <h2 className="text-lg font-bold text-slate-200 border-b border-white/5 pb-4">Personal Info</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { label: 'First Name', key: 'firstName', icon: User, placeholder: 'Elon', required: true },
                                { label: 'Last Name', key: 'lastName', icon: User, placeholder: 'Musk', required: true },
                                { label: 'Role / Title', key: 'role', icon: Briefcase, placeholder: 'Full Stack Developer', required: true },
                                { label: 'Location', key: 'location', icon: MapPin, placeholder: 'Mumbai, India', required: true },
                                { label: 'LinkedIn', key: 'linkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/you', required: false },
                                { label: 'Portfolio', key: 'portfolio', icon: LinkIcon, placeholder: 'yourportfolio.com', required: false },
                            ].map(({ label, key, icon: Icon, placeholder, required }) => (
                                <div key={key} className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
                                    <div className="relative group">
                                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                                        <input type="text" name={key} placeholder={placeholder} value={formik.values[key]}
                                            onChange={formik.handleChange} onBlur={formik.handleBlur}
                                            className={`w-full bg-slate-900 border ${formik.touched[key] && formik.errors[key] ? 'border-red-500' : 'border-white/10'} py-3.5 pl-11 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm`}
                                        />
                                    </div>
                                    {formik.touched[key] && formik.errors[key] && <div className="text-red-500 text-xs ml-1">{formik.errors[key]}</div>}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bio</label>
                            <textarea name="bio" rows={4} placeholder="Tell founders or users about yourself..." value={formik.values.bio}
                                onChange={formik.handleChange} onBlur={formik.handleBlur}
                                className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="glass-card p-8 space-y-5">
                        <h2 className="text-lg font-bold text-slate-200 border-b border-white/5 pb-4">Skills & Looking For</h2>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Your Skills</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formik.values.skills.map(s => (
                                    <span key={s} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-sm font-medium">
                                        {s} <button type="button" onClick={() => removeSkill(s)}><X size={13} className="hover:text-red-400 transition-colors" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <input type="text" placeholder="Add skill (e.g. React)" value={newSkill}
                                    onChange={e => setNewSkill(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                    className="flex-1 bg-slate-900 border border-white/10 px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm"
                                />
                                <button type="button" onClick={addSkill} className="gradient-btn px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"><Plus size={16}/> Add</button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Looking For</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formik.values.lookingFor.map(s => (
                                    <span key={s} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm font-medium">
                                        {s} <button type="button" onClick={() => removeLooking(s)}><X size={13} className="hover:text-red-400 transition-colors" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <input type="text" placeholder="e.g. CTO, Co-founder, Developer" value={newLooking}
                                    onChange={e => setNewLooking(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLooking())}
                                    className="flex-1 bg-slate-900 border border-white/10 px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm"
                                />
                                <button type="button" onClick={addLooking} className="gradient-btn px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"><Plus size={16}/> Add</button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={saving} className="gradient-btn w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 disabled:opacity-50">
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            )}

            {/* ══════════ ID CARD TAB ══════════ */}
            {activeTab === 'idcard' && (
                <div className="glass-card p-10 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3"><Shield size={22} className="text-indigo-400" /> ID Verification</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Upload a government-issued ID (Aadhar, PAN, Passport). A Company Owner will review and approve your ID within 24 hours.
                            Once approved, a <BadgeCheck size={14} className="inline text-blue-400" /> verified badge appears on your profile.
                        </p>
                    </div>

                    <IdStatusBadge status={idCard.status} />

                    {/* Preview current ID */}
                    {idCard.url && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Uploaded ID</p>
                            <img src={idCard.url} alt="ID Card" className="max-h-64 rounded-2xl border border-white/10 object-contain w-full" />
                        </div>
                    )}

                    {/* Upload */}
                    <div>
                        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
                        <button onClick={() => fileRef.current?.click()} disabled={uploadingId}
                            className="w-full glass-card p-10 border-dashed border-2 border-white/10 hover:border-indigo-500/40 transition-all text-center rounded-2xl cursor-pointer disabled:opacity-50 group"
                        >
                            <Upload size={36} className="mx-auto mb-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            <p className="font-bold text-slate-300 mb-1">{uploadingId ? 'Uploading...' : idCard.url ? 'Re-upload ID Card' : 'Upload ID Card'}</p>
                            <p className="text-slate-500 text-sm">JPG, PNG or PDF · Max 5MB</p>
                        </button>
                    </div>

                    <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl text-sm text-indigo-300 leading-relaxed">
                        <strong className="font-bold">Why verify?</strong> Verified profiles get more connection requests, show a ✅ badge, and rank higher in discovery.
                    </div>
                </div>
            )}

            {/* ══════════ PROFILE VIEWS TAB ══════════ */}
            {activeTab === 'views' && (
                <div className="space-y-5">
                    <div className="flex items-center gap-4 glass-card p-6">
                        <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                            <Eye size={28} className="text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold gradient-text">{profileViews.length}</div>
                            <div className="text-slate-400 text-sm font-medium">People viewed your profile</div>
                        </div>
                    </div>

                    {profileViews.length === 0 ? (
                        <div className="glass-card p-16 text-center">
                            <Eye size={40} className="mx-auto text-slate-700 mb-4" />
                            <h3 className="text-xl font-bold text-slate-400 mb-2">No views yet</h3>
                            <p className="text-slate-600 text-sm">Complete your profile to attract more visitors.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[...profileViews].reverse().map((view, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    className="glass-card p-5 flex items-center gap-5 hover:border-indigo-500/20 transition-all"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-bold text-white text-lg shrink-0">
                                        {view.viewerId?.firstName?.[0] || '?'}{view.viewerId?.lastName?.[0] || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold">{view.viewerId?.firstName || 'Unknown'} {view.viewerId?.lastName || ''}</p>
                                        <p className="text-slate-500 text-sm flex items-center gap-2">
                                            <Briefcase size={12} /> {displayRole(view.viewerId?.role)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-xs">{new Date(view.viewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <p className="text-slate-600 text-[11px]">{new Date(view.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
