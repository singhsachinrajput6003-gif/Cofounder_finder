'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Snowfall from 'react-snowfall';
import {
    Rocket, Users, Zap, MessageSquare, ArrowRight,
    Building2, Briefcase, CheckCircle2, Star, ChevronDown
} from 'lucide-react';

const stats = [
    { value: '2,400+', label: 'Founders Joined' },
    { value: '850+', label: 'Startups Backed' },
    { value: '12k+', label: 'Connections Made' },
    { value: '99%', label: 'Match Satisfaction' },
];

const features = [
    {
        icon: Building2, color: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/20',
        title: 'Post Your Startup Idea',
        desc: 'Founders post pitches with equity, industry and role requirements. Get discovered by the right talent instantly.',
        href: '/register?type=company', cta: 'Post an Idea'
    },
    {
        icon: Users, color: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/20',
    title: 'Discover Users',
    desc: 'Browse verified users filtered by skills and location. Find your perfect co-founder or first hire.',
    href: '/dashboard', cta: 'Browse Users'
    },
    {
        icon: Zap, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20',
        title: 'Smart Requests',
        desc: 'Send a request with one click. Accept or decline with full control. No noise — only genuine matches.',
        href: '/requests', cta: 'View Requests'
    },
    {
        icon: MessageSquare, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20',
        title: 'Real-time Messaging',
        desc: 'Chat with connections instantly using our built-in real-time messenger. Start collaborating today.',
        href: '/messages', cta: 'Open Messages'
    },
];

const steps = [
    { step: '01', icon: Briefcase, color: 'from-indigo-500 to-blue-600', title: 'Create Your Profile', desc: 'Register as a Company Owner or User in 2 minutes. Choose your role, add your skills.', href: '/register' },
    { step: '02', icon: Users, color: 'from-purple-500 to-pink-600', title: 'Explore the Hub', desc: 'Browse startup ideas or users. Filter by skills, industry, and more.', href: '/dashboard' },
    { step: '03', icon: Zap, color: 'from-amber-500 to-orange-600', title: 'Connect & Match', desc: 'Send a connection request. The other party accepts — you both get notified instantly.', href: '/requests' },
    { step: '04', icon: MessageSquare, color: 'from-emerald-500 to-teal-600', title: 'Build Together', desc: 'Start chatting in real-time. Plan your product, share documents, and launch.', href: '/messages' },
];

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay },
});

export default function LandingPage() {
    return (
        <div className="overflow-x-hidden">
        <Snowfall color="#82C3D9"/>

            {/* ══════════════════ HERO ══════════════════ */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-24">
                {/* Glows */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
                    <div className="absolute top-2/3 right-10 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto"
                >
                    <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-sm font-bold mb-10 hover:bg-indigo-500/10 transition-colors">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        2,400+ Founders & Users — Join Free
                        <ChevronDown size={14} />
                    </Link>

                    <h1 className="text-6xl md:text-8xl font-extrabold leading-[1.05] tracking-tight mb-8">
                        Find the{' '}
                        <span className="gradient-text">Perfect Partner</span>
                        <br className="hidden md:block" />
                        {' '}for Your Startup
                    </h1>

                    <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-14 leading-relaxed">
                        Whether you&apos;re a <span className="text-white font-semibold">founder</span> with a big idea
                        or a <span className="text-white font-semibold">user</span> ready to build —
                        CoFound connects the right people in seconds.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register?type=company" className="gradient-btn px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-600/25 flex items-center justify-center gap-2 group">
                            <Building2 size={20} />
                            I have a Startup Idea
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                        </Link>
                        <Link href="/register?type=seeker" className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <Briefcase size={20} />
                            I want to Join a Startup
                        </Link>
                    </div>
                </motion.div>

                {/* Preview cards */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.4 }}
                    className="mt-20 w-full max-w-5xl mx-auto"
                >
                    <div className="glass-card p-3">
                        <div className="bg-slate-900/60 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { name: 'Alex Chen', role: 'Full Stack Dev', skills: ['React', 'Node.js', 'MongoDB'], color: 'from-indigo-500 to-purple-600', type: 'seeker' },
                                { name: 'Priya Sharma', role: 'UI/UX Designer', skills: ['Figma', 'Design Systems', 'UX'], color: 'from-pink-500 to-rose-600', type: 'seeker' },
                                { name: 'Sam Wilson', role: 'ML Engineer', skills: ['Python', 'TensorFlow', 'AI'], color: 'from-emerald-500 to-teal-600', type: 'seeker' },
                            ].map((p) => (
                                <div key={p.name} className="glass-card p-5 text-left hover:border-indigo-500/30 transition-all cursor-pointer group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 bg-gradient-to-br ${p.color} rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg`}>
                                            {p.name[0]}
                                        </div>
                                        <div className="flex gap-0.5 text-yellow-500">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                                        </div>
                                    </div>
                                    <p className="font-bold">{p.name}</p>
                                    <p className="text-indigo-400 text-xs font-semibold mb-3">{p.role}</p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {p.skills.map(s => (
                                            <span key={s} className="px-2 py-0.5 bg-white/5 rounded-lg text-[11px] text-slate-400">{s}</span>
                                        ))}
                                    </div>
                                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Send Request <ArrowRight size={11} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <a href="#stats" className="mt-12 text-slate-600 hover:text-slate-400 transition-colors animate-bounce">
                    <ChevronDown size={28} />
                </a>
            </section>

            {/* ══════════════════ STATS ══════════════════ */}
            <section id="stats" className="py-24 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((s, i) => (
                        <motion.div key={s.label} {...fadeUp(i * 0.1)} className="glass-card p-8 text-center hover:border-indigo-500/30 transition-all">
                            <div className="text-5xl font-extrabold gradient-text mb-2">{s.value}</div>
                            <div className="text-slate-500 text-sm font-medium">{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ══════════════════ FEATURES ══════════════════ */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...fadeUp()} className="text-center mb-20">
                        <h2 className="text-5xl font-extrabold mb-5">
                            Everything you need to <span className="gradient-text">co-found</span>
                        </h2>
                        <p className="text-xl text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto md:mx-0">
                        Stop endlessly searching. We connect ambitious users with the right startup founders. Because great companies aren&apos;t built alone.
                    </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {features.map((f, i) => (
                            <motion.div key={f.title} {...fadeUp(i * 0.1)} className="glass-card p-10 group hover:border-indigo-500/30 transition-all flex flex-col">
                                <div className={`w-16 h-16 bg-gradient-to-br ${f.color} rounded-2xl flex items-center justify-center mb-8 shadow-xl ${f.shadow} group-hover:scale-110 transition-transform`}>
                                    <f.icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                                <p className="text-slate-400 leading-relaxed flex-1">{f.desc}</p>
                                <Link href={f.href} className="mt-8 inline-flex items-center gap-2 text-indigo-400 font-bold text-sm hover:gap-3 transition-all">
                                    {f.cta} <ArrowRight size={15} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════ HOW IT WORKS ══════════════════ */}
            <section id="how-it-works" className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fadeUp()} className="text-center mb-20">
                        <h2 className="text-5xl font-extrabold mb-5">
                            From signup to <span className="gradient-text">co-founding</span>
                        </h2>
                        <p className="text-slate-400 text-lg">4 simple steps to find your perfect match.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {steps.map((s, i) => (
                            <motion.div key={s.step} {...fadeUp(i * 0.1)}>
                                <Link href={s.href} className="glass-card p-8 flex items-start gap-6 group hover:border-indigo-500/30 transition-all block">
                                    <div className="shrink-0">
                                        <div className={`w-14 h-14 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                                            <s.icon size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Step {s.step}</span>
                                            <CheckCircle2 size={14} className="text-indigo-500/40 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">{s.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════ CTA ══════════════════ */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fadeUp()} className="glass-card p-16 md:p-24 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-bold mb-8 uppercase tracking-widest">
                                <Rocket size={12} /> Start Building Today
                            </div>
                            <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
                                Ready to find your<br />
                                <span className="gradient-text">co-founder?</span>
                            </h2>
                            <p className="text-slate-400 mb-12 max-w-lg mx-auto text-lg leading-relaxed">
                                Join thousands of founders and users already building the future together. Free to join, forever.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center">
                                <Link href="/register?type=company" className="gradient-btn px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-600/25 flex items-center justify-center gap-3 group">
                                    <Building2 size={20} />
                                    I&apos;m a Founder
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                                </Link>
                                <Link href="/register?type=seeker" className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3">
                                    <Briefcase size={20} />
                                    I&apos;m Looking for a Role
                                </Link>
                            </div>
                            <p className="mt-8 text-slate-600 text-sm">
                                Already have an account?{' '}
                                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold">Sign in →</Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
