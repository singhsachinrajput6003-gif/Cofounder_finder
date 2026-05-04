'use client';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from './AdminDashboard';
import SeekerDashboard from './SeekerDashboard';
import InvestorDashboard from '../investor/dashboard/page';

export default function DashboardPage() {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    if (!user) return null;

    // Company Owners → Admin Hub
    // Investors → Investor Dashboard
    // Users    → Startup Discovery
    if (user.accountType === 'company' || user.role === 'Company Owner' || user.role === 'Founder') {
        return <AdminDashboard />;
    }
    if (user.accountType === 'investor') {
        return <InvestorDashboard />;
    }
    return <SeekerDashboard />;
}
