'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function InvestorDashboard() {
    const { user } = useAuth();
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [selectedIdea, setSelectedIdea] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get('/ideas');
                setIdeas(data);
            } catch (err) { toast.error('Failed to load ideas'); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const openFund = (idea) => { setSelectedIdea(idea); setAmount(''); setMessage(''); };
    const closeFund = () => setSelectedIdea(null);

    const submitFund = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return toast.error('Enter a valid amount');
        try {
            const { data } = await api.post('/fundings', { ideaId: selectedIdea._id, amount: Number(amount), message });
            toast.success('Fund submitted — mock success');
            closeFund();
        } catch (err) { toast.error(err.response?.data?.error || 'Funding failed'); }
    };

    if (loading) return <div className="flex items-center justify-center h-[60vh]">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <h1 className="text-3xl font-extrabold">Investor Dashboard</h1>
            <p className="text-slate-400">Browse ideas and submit funding (mock).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ideas.map(i => (
                    <div key={i._id} className="glass-card p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold">{i.title}</h3>
                            <span className="text-xs text-slate-400">{i.industry}</span>
                        </div>
                        <p className="text-slate-300 mb-4">{i.description}</p>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">Equity: {i.equityOffered || 'TBD'}</div>
                            <button onClick={() => openFund(i)} className="gradient-btn px-4 py-2 rounded-2xl font-bold text-sm">Fund</button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedIdea && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-3">Fund: {selectedIdea.title}</h3>
                        <p className="text-slate-400 mb-4">{selectedIdea.description}</p>
                        <input type="number" placeholder="Amount (USD)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 mb-3 bg-slate-800 border border-white/10 rounded-2xl" />
                        <textarea placeholder="Message (optional)" value={message} onChange={e => setMessage(e.target.value)} className="w-full p-3 mb-4 bg-slate-800 border border-white/10 rounded-2xl" />
                        <div className="flex gap-3 justify-end">
                            <button onClick={closeFund} className="px-4 py-2 bg-white/5 rounded-2xl">Cancel</button>
                            <button onClick={submitFund} className="gradient-btn px-4 py-2 rounded-2xl font-bold">Submit Fund</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
