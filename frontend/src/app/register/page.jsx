'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Building2, Briefcase, ChevronLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const accountTypes = [
    {
        type: 'company',
        icon: Building2,
        label: 'Company Owner',
        tagline: 'I have a startup idea or company',
        bullets: ['Post business ideas & pitches', 'Accept or reject applicants', 'Build your founding team'],
        gradient: 'from-indigo-500 to-purple-600',
        ring: 'border-indigo-500',
        bg: 'bg-indigo-500/10'
    },
    {
        type: 'user',
        icon: Briefcase,
        label: 'User',
        tagline: 'I want to join a startup',
        bullets: ['Browse startup ideas', 'Apply to join companies', 'Get discovered by founders'],
        gradient: 'from-emerald-500 to-teal-600',
        ring: 'border-emerald-500',
        bg: 'bg-emerald-500/10'
    }
    ,
    {
        type: 'investor',
        icon: User,
        label: 'Investor',
        tagline: 'I want to fund promising startups',
        bullets: ['Browse ideas to invest', 'Contact founders', 'Support early-stage startups'],
        gradient: 'from-yellow-500 to-amber-600',
        ring: 'border-yellow-500',
        bg: 'bg-yellow-500/10'
    }
];

export default function RegisterPage() {
    const [step, setStep] = useState(1); // 1 = choose type, 2 = fill form
    const [accountType, setAccountType] = useState(null);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const selectedType = accountTypes.find(t => t.type === accountType);

    const handleSelect = (type) => {
        setAccountType(type);
        setStep(2);
    };

    const formik = useFormik({
        initialValues: { firstName: '', lastName: '', email: '', password: '',confirmPassword:'', agree: false },
        validationSchema: Yup.object({
            firstName: Yup.string().required('First name is required'),
            lastName: Yup.string().required('Last name is required'),
            email: Yup.string().email('Invalid email address').required('Email is required'),
            password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
            confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm password is required'),
            agree: Yup.boolean().oneOf([true], 'You must confirm that this idea is original and confidential'),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            try {
                await register({ ...values, accountType });
                toast.success('Welcome aboard! 🚀');
            } catch (err) {
                toast.error(err.response?.data?.error || 'Registration failed');
            } finally {
                setLoading(false);
            }
        }
    });

    return (
        <div className="flex justify-center items-center min-h-[85vh] py-8">
            <AnimatePresence mode="wait">

                {/* ===== STEP 1: Choose Account Type ===== */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-3xl"
                    >
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-extrabold mb-3">
                                Join <span className="gradient-text">CoFound</span>
                            </h1>
                            <p className="text-slate-400 text-lg">Who are you joining as?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {accountTypes.map((at) => (
                                <motion.button
                                    key={at.type}
                                    onClick={() => handleSelect(at.type)}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="glass-card p-10 text-left hover:border-white/20 transition-all group"
                                >
                                    <div className={`w-16 h-16 bg-gradient-to-br ${at.gradient} rounded-2xl flex items-center justify-center mb-8 shadow-xl`}>
                                        <at.icon size={30} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-extrabold mb-2">{at.label}</h3>
                                    <p className="text-slate-400 mb-8 text-sm">{at.tagline}</p>
                                    <ul className="space-y-3">
                                        {at.bullets.map((b, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                                                <CheckCircle size={16} className="text-indigo-400 shrink-0" />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className={`mt-10 flex items-center gap-2 font-bold text-sm ${at.type === 'company' ? 'text-indigo-400' : 'text-emerald-400'} group-hover:gap-4 transition-all`}>
                                        Select & Continue <ArrowRight size={16} />
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        <p className="text-center text-slate-500 mt-10 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-indigo-400 font-bold hover:text-indigo-300">Sign In</Link>
                        </p>
                    </motion.div>
                )}

                {/* ===== STEP 2: Fill in details ===== */}
                {step === 2 && selectedType && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="w-full max-w-lg"
                    >
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-semibold"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        <div className="glass-card p-12">
                            {/* Type Badge */}
                            <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl ${selectedType.bg} border border-white/10 mb-8`}>
                                <div className={`w-8 h-8 bg-gradient-to-br ${selectedType.gradient} rounded-lg flex items-center justify-center`}>
                                    <selectedType.icon size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-sm">{selectedType.label}</span>
                            </div>

                            <h2 className="text-3xl font-extrabold mb-2">Create your account</h2>
                            <p className="text-slate-400 mb-10 text-sm">Fill in your details to get started instantly.</p>

                            <form onSubmit={formik.handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">First Name <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={17} />
                                            <input
                                                name="firstName"
                                                type="text" placeholder="Elon"
                                                className={`w-full bg-slate-900 border ${formik.touched.firstName && formik.errors.firstName ? 'border-red-500' : 'border-white/10'} p-4 pl-11 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm`}
                                                value={formik.values.firstName}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                        </div>
                                        {formik.touched.firstName && formik.errors.firstName && <div className="text-red-500 text-xs ml-1">{formik.errors.firstName}</div>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={17} />
                                            <input
                                                name="lastName"
                                                type="text" placeholder="Musk"
                                                className={`w-full bg-slate-900 border ${formik.touched.lastName && formik.errors.lastName ? 'border-red-500' : 'border-white/10'} p-4 pl-11 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm`}
                                                value={formik.values.lastName}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                        </div>
                                        {formik.touched.lastName && formik.errors.lastName && <div className="text-red-500 text-xs ml-1">{formik.errors.lastName}</div>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={17} />
                                        <input
                                            name="email"
                                            type="email" placeholder="you@startup.com"
                                            className={`w-full bg-slate-900 border ${formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-white/10'} p-4 pl-11 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm`}
                                            value={formik.values.email}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                    </div>
                                    {formik.touched.email && formik.errors.email && <div className="text-red-500 text-xs ml-1">{formik.errors.email}</div>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={17} />
                                        <input
                                            name="password"
                                            type="password" placeholder="••••••••"
                                            className={`w-full bg-slate-900 border ${formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-white/10'} p-4 pl-11 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm`}
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                    </div>
                                    {formik.touched.password && formik.errors.password && <div className="text-red-500 text-xs ml-1">{formik.errors.password}</div>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirm Password <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={17} />
                                        <input
                                            name="confirmPassword"
                                            type="password" placeholder="••••••••"
                                            className={`w-full bg-slate-900 border ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500' : 'border-white/10'} p-4 pl-11 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm`}
                                            value={formik.values.confirmPassword}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                    </div>
                                    {formik.touched.confirmPassword && formik.errors.confirmPassword && <div className="text-red-500 text-xs ml-1">{formik.errors.confirmPassword}</div>}
                                </div>

                                    {/* Agreement checkbox - required */}
                                    <div className="space-y-2">
                                        <label className="inline-flex items-start gap-3 text-sm text-slate-300">
                                            <input
                                                name="agree"
                                                type="checkbox"
                                                checked={!!formik.values?.agree}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                className="mt-1 w-4 h-4 rounded text-indigo-500 bg-slate-900 border-white/10"
                                            />
                                            <span className="text-slate-300 text-sm">This idea is original and confidential. Any unauthorized use, reproduction, or copying is strictly prohibited.</span>
                                        </label>
                                        {formik.touched.agree && formik.errors.agree && <div className="text-red-500 text-xs ml-1">{formik.errors.agree}</div>}
                                    </div>

                                    <button
                                    type="submit"
                                        disabled={loading || !formik.values?.agree}
                                    className="w-full gradient-btn p-5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 group shadow-xl shadow-indigo-600/20 mt-4"
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                    {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />}
                                </button>
                            </form>

                            <p className="mt-8 pt-8 border-t border-white/5 text-center text-slate-500 text-sm">
                                Already have an account?{' '}
                                <Link href="/login" className="text-indigo-400 font-bold hover:text-indigo-300">Sign In</Link>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
