'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard, MessageSquare, UserPlus, User,
    LogOut, Rocket, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    { name: 'Discover', href: '/dashboard', icon: LayoutDashboard, desc: 'Find talent & ideas' },
    { name: 'Requests', href: '/requests', icon: UserPlus, desc: 'Manage connections' },
    { name: 'Messages', href: '/messages', icon: MessageSquare, desc: 'Real-time chat' },
    { name: 'Profile', href: '/profile', icon: User, desc: 'Your profile' },
    { name: 'Investor', href: '/investor/dashboard', icon: Rocket, desc: 'Investor tools' },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare, desc: 'Submit feedback' },
];

// Guest top navbar
export function GuestNavbar() {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <Rocket size={16} className="text-white" />
                    </div>
                    <span className="text-lg font-bold gradient-text">CoFound</span>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                    <a href="#stats" className="hover:text-white transition-colors">Community</a>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2">
                        Login
                    </Link>
                    <Link href="/register" className="text-sm font-bold gradient-btn py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-600/20">
                        Get Started →
                    </Link>
                </div>
            </div>
        </nav>
    );
}

// Authenticated left sidebar
export function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    return (
        <aside className="fixed top-0 left-0 h-full w-64 bg-slate-950/90 border-r border-white/5 backdrop-blur-xl z-40 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
                        <Rocket size={18} className="text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-extrabold gradient-text">CoFound</span>
                        <p className="text-[10px] text-slate-600 font-medium">Find your co-founder</p>
                    </div>
                </Link>
            </div>

            {/* User pill */}
            <div className="px-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase truncate">
                            {user?.accountType === 'company' ? 'Company Owner' : user?.accountType === 'investor' ? 'Investor' : 'User'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest px-3 mb-3">Navigation</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group relative
                                ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all
                                ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-600'}`}>
                                    {item.desc}
                                </p>
                            </div>
                            {isActive && <ChevronRight size={14} className="shrink-0 opacity-60" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
                >
                    <div className="w-9 h-9 bg-white/5 group-hover:bg-red-500/10 rounded-xl flex items-center justify-center shrink-0 transition-all">
                        <LogOut size={18} />
                    </div>
                    <span className="font-semibold text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

// Default export — used in layout
export default function Navbar() {
    const { user } = useAuth();
    if (user) return <Sidebar />;
    return <GuestNavbar />;
}
