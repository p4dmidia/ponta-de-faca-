import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Users,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Activity,
    Wallet,
    Search,
    Mail,
    Phone,
    MapPin,
    Trash2,
    Loader2
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState([
        { label: 'Vendas Totais', value: 'R$ 0', change: '0%', isPositive: true, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/10' },
        { label: 'Novos Afiliados', value: '0', change: '0%', isPositive: true, icon: Users, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/10' },
        { label: 'Afiliados a Pagar', value: '0', change: '0%', isPositive: false, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/10' },
        { label: 'Fila de Espera (Ativos)', value: '0', change: 'Aguardando', isPositive: true, icon: Clock, color: 'text-[#a61d24]', bg: 'bg-[#a61d24]/10 border-[#a61d24]/20' },
    ]);

    const [recentAffiliates, setRecentAffiliates] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState('30d');

    // Waiting List State
    const [waitingList, setWaitingList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'notified'>('pending');
    const [loadingWaitlist, setLoadingWaitlist] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        fetchWaitingList();
    }, [timeframe]);

    const fetchWaitingList = async () => {
        try {
            setLoadingWaitlist(true);
            const { data, error } = await supabase
                .from('waiting_list')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWaitingList(data || []);
        } catch (err: any) {
            console.error('Error fetching waitlist:', err);
            toast.error('Erro ao carregar fila de espera.');
        } finally {
            setLoadingWaitlist(false);
        }
    };

    const handleNotifyLead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('waiting_list')
                .update({ 
                    notified: true, 
                    notified_at: new Date().toISOString() 
                })
                .eq('id', id);

            if (error) throw error;
            
            toast.success('Lead notificado e vaga pré-liberada!');
            fetchWaitingList();
            fetchDashboardData();
        } catch (err: any) {
            console.error('Error notifying lead:', err);
            toast.error('Erro ao notificar lead.');
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este lead da lista de espera?')) return;
        
        try {
            const { error } = await supabase
                .from('waiting_list')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Lead removido com sucesso!');
            fetchWaitingList();
            fetchDashboardData();
        } catch (err: any) {
            console.error('Error deleting lead:', err);
            toast.error('Erro ao remover lead.');
        }
    };

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Orders for calculations
            const { data: allOrders } = await supabase
                .from('orders')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID);

            const paidOrders = allOrders?.filter(o => o.status === 'Pago' || o.status === 'completed' || o.status === 'Entregue') || [];
            const totalSalesValue = paidOrders.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
            const avgTicket = paidOrders.length > 0 ? totalSalesValue / paidOrders.length : 0;

            // 2. New Affiliates (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { count: newAffiliatesCount } = await supabase
                .from('affiliates')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', ORGANIZATION_ID)
                .gt('created_at', thirtyDaysAgo.toISOString());

            // 3. Affiliates with Balance (Pending Payouts)
            const { count: pendingPayoutsCount } = await supabase
                .from('user_settings')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', ORGANIZATION_ID)
                .gt('available_balance', 0);

            // 4. Waiting list pending count
            const { count: waitlistCount } = await supabase
                .from('waiting_list')
                .select('*', { count: 'exact', head: true })
                .eq('notified', false);

            // 5. Recent Affiliates
            const { data: latestAffs } = await supabase
                .from('affiliates')
                .select('full_name, created_at, is_active')
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false })
                .limit(4);

            // 6. Revenue Data Points based on Timeframe
            const now = new Date();
            let startDate = new Date();
            let groupBy: 'day' | 'month' = 'day';

            if (timeframe === '7d') startDate.setDate(now.getDate() - 7);
            else if (timeframe === '15d') startDate.setDate(now.getDate() - 15);
            else if (timeframe === '30d') startDate.setDate(now.getDate() - 30);
            else if (timeframe === '6m') { startDate.setMonth(now.getMonth() - 6); groupBy = 'month'; }
            else if (timeframe === '1y') { startDate.setFullYear(now.getFullYear() - 1); groupBy = 'month'; }

            const revenuePoints: any[] = [];
            const filteredOrders = paidOrders.filter(o => new Date(o.created_at) >= startDate);

            if (groupBy === 'day') {
                const days = timeframe === '7d' ? 7 : timeframe === '15d' ? 15 : 30;
                for (let i = days; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(now.getDate() - i);
                    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const amount = filteredOrders
                        .filter(o => new Date(o.created_at).toLocaleDateString() === d.toLocaleDateString())
                        .reduce((acc, curr) => acc + Number(curr.total_amount), 0);
                    revenuePoints.push({ name: dateStr, value: amount });
                }
            } else {
                const months = timeframe === '6m' ? 6 : 12;
                for (let i = months; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(now.getMonth() - i);
                    const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
                    const amount = filteredOrders
                        .filter(o => {
                            const od = new Date(o.created_at);
                            return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
                        })
                        .reduce((acc, curr) => acc + Number(curr.total_amount), 0);
                    revenuePoints.push({ name: monthName.toUpperCase(), value: amount });
                }
            }
            setRevenueData(revenuePoints);

            // 7. Categories Data (Ponta D'Faca specific curations)
            setCategoryData([
                { name: 'Clássico Mineiro', value: totalSalesValue * 0.50, color: '#a61d24' },
                { name: 'Churrasco Premium', value: totalSalesValue * 0.30, color: '#d97706' },
                { name: 'Edições Sazonais', value: totalSalesValue * 0.20, color: '#4b5563' }
            ]);

            setStats([
                { label: 'Vendas Totais', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSalesValue), change: '+12.4%', isPositive: true, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/10' },
                { label: 'Novos Afiliados', value: String(newAffiliatesCount || 0), change: '+5.1%', isPositive: true, icon: Users, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/10' },
                { label: 'Afiliados a Pagar', value: String(pendingPayoutsCount || 0), change: 'Dia 15', isPositive: true, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/10' },
                { label: 'Fila de Espera (Pendente)', value: String(waitlistCount || 0), change: 'Ativos', isPositive: true, icon: Clock, color: 'text-[#a61d24]', bg: 'bg-[#a61d24]/10 border-[#a61d24]/20' },
            ]);

            setRecentAffiliates(latestAffs?.map(aff => {
                const date = new Date(aff.created_at);
                return {
                    name: aff.full_name || 'Sem Nome',
                    date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                    status: aff.is_active ? 'Ativo' : 'Pendente',
                    plan: 'Membro'
                };
            }) || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter and search waiting list
    const filteredWaitingList = waitingList.filter(lead => {
        const matchesSearch = 
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (lead.city && lead.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
            lead.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filterStatus === 'all') return matchesSearch;
        if (filterStatus === 'pending') return matchesSearch && !lead.notified;
        if (filterStatus === 'notified') return matchesSearch && lead.notified;
        return matchesSearch;
    });

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white font-playfair">Dashboard Administrativo</h1>
                    <p className="text-slate-400 font-medium text-sm md:text-base font-inter">
                        Ponta D'Faca Charcutaria — Resumo operacional do clube e gestão de fila.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-[#0d0d0d] p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-white/10 hover:shadow-3xl transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl border ${stat.bg} ${stat.color} group-hover:scale-110 transition-all`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className={`flex items-center text-xs font-black px-2.5 py-1 rounded-full ${stat.isPositive ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/10' : 'text-rose-400 bg-rose-950/20 border border-rose-900/10'
                                    }`}>
                                    {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {stat.change}
                                </div>
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-white mt-1">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Revenue Area Chart */}
                    <div className="lg:col-span-2 bg-[#0d0d0d] rounded-[2.5rem] border border-white/5 p-6 md:p-8 shadow-2xl">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                            <h3 className="text-xl font-black text-white font-playfair">Faturamento do Clube</h3>
                            <select 
                                value={timeframe}
                                onChange={(e) => setTimeframe(e.target.value)}
                                className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none w-full sm:w-auto cursor-pointer hover:border-[#a61d24] transition-all"
                            >
                                <option value="7d">Últimos 7 dias</option>
                                <option value="15d">Últimos 15 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                                <option value="6m">Últimos 6 meses</option>
                                <option value="1y">Último 1 ano</option>
                            </select>
                        </div>
                        <div className="h-[300px] w-full">
                            {isLoading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-[#a61d24] animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a61d24" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#a61d24" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.03)" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                            tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#0d0d0d', 
                                                border: '1px solid rgba(255, 255, 255, 0.05)', 
                                                borderRadius: '16px', 
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#a61d24', fontWeight: 900 }}
                                            labelStyle={{ color: '#64748b', fontWeight: 700, marginBottom: '4px' }}
                                            formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#a61d24" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorValue)" 
                                            animationDuration={1000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* New Affiliates Card */}
                    <div className="bg-[#0d0d0d] rounded-[2.5rem] border border-white/5 p-6 md:p-8 shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-white font-playfair">Novos Afiliados</h3>
                                <button className="text-slate-500 hover:text-white transition-colors"><MoreHorizontal /></button>
                            </div>
                            <div className="space-y-6">
                                {isLoading ? (
                                    [1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex items-center gap-4 animate-pulse">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl"></div>
                                            <div className="flex-grow space-y-2">
                                                <div className="h-4 bg-white/5 rounded w-1/2"></div>
                                                <div className="h-3 bg-white/5 rounded w-1/4"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : recentAffiliates.length > 0 ? (
                                    recentAffiliates.map((aff, idx) => (
                                        <div key={idx} className="flex items-center justify-between group cursor-pointer p-2.5 hover:bg-white/[0.02] border border-transparent hover:border-white/5 rounded-2xl transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-black border border-white/5 flex items-center justify-center font-black text-[#a61d24] shrink-0 text-sm">
                                                    {aff.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-white text-sm truncate">{aff.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-3 h-3" /> {aff.date}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] font-black text-[#a61d24] uppercase tracking-widest">{aff.plan}</p>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${aff.status === 'Ativo' ? 'bg-emerald-950/20 border border-emerald-900/10 text-emerald-400' :
                                                    'bg-amber-950/20 border border-amber-900/10 text-amber-400'
                                                    }`}>
                                                    {aff.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-slate-500 font-bold text-xs uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                                        Nenhum afiliado recente
                                    </div>
                                )}
                            </div>
                        </div>
                        <Link
                            to="/admin/affiliates"
                            className="w-full mt-8 py-4 bg-[#a61d24] hover:bg-[#8d181e] wine-glow text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#a61d24]/10 flex items-center justify-center"
                        >
                            GERENCIAR AFILIADOS
                        </Link>
                    </div>
                </div>

                {/* Waiting List Management Section */}
                <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white font-playfair flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#a61d24]" />
                                Gestão da Fila de Espera
                            </h3>
                            <p className="text-slate-400 font-medium text-xs font-inter mt-1">
                                Monitore os leads cadastrados, busque por cidade e libere vagas de adesão.
                            </p>
                        </div>
                        <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-full md:w-auto">
                            <button
                                onClick={() => setFilterStatus('pending')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                    filterStatus === 'pending'
                                        ? 'bg-[#a61d24] text-white shadow-md'
                                        : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                Pendentes ({waitingList.filter(l => !l.notified).length})
                            </button>
                            <button
                                onClick={() => setFilterStatus('notified')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                    filterStatus === 'notified'
                                        ? 'bg-[#a61d24] text-white shadow-md'
                                        : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                Notificados ({waitingList.filter(l => l.notified).length})
                            </button>
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                    filterStatus === 'all'
                                        ? 'bg-[#a61d24] text-white shadow-md'
                                        : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                Todos ({waitingList.length})
                            </button>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar leads por nome, email ou cidade (ex: Belo Horizonte)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 text-white placeholder-slate-500 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-[#a61d24] transition-all font-medium"
                        />
                    </div>

                    {/* Waiting List Leads Table */}
                    <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/20">
                        {loadingWaitlist ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 text-[#a61d24] animate-spin mb-4" />
                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Carregando lista...</span>
                            </div>
                        ) : filteredWaitingList.length > 0 ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.01]">
                                        <th className="py-4 px-6 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Nome</th>
                                        <th className="py-4 px-6 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Contato</th>
                                        <th className="py-4 px-6 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Cidade</th>
                                        <th className="py-4 px-6 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Cadastro</th>
                                        <th className="py-4 px-6 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="py-4 px-6 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredWaitingList.map((lead) => {
                                        const dateStr = new Date(lead.created_at).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                        const notifiedDate = lead.notified_at ? new Date(lead.notified_at).toLocaleDateString('pt-BR') : '';

                                        return (
                                            <tr key={lead.id} className="hover:bg-white/[0.01] transition-all">
                                                <td className="py-5 px-6 font-bold text-white text-sm">
                                                    {lead.name}
                                                </td>
                                                <td className="py-5 px-6 space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                                                        <span>{lead.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                                                        <span>{lead.whatsapp}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                                        <MapPin className="w-3.5 h-3.5 text-[#a61d24]" />
                                                        <span>{lead.city || 'Não informada'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-xs text-slate-500 font-bold">
                                                    {dateStr}
                                                </td>
                                                <td className="py-5 px-6">
                                                    {lead.notified ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider" title={`Notificado em ${notifiedDate}`}>
                                                            Notificado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-950/30 border border-amber-900/10 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                                                            Pendente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {!lead.notified && (
                                                            <button
                                                                onClick={() => handleNotifyLead(lead.id)}
                                                                className="px-3 py-1.5 bg-[#a61d24]/10 border border-[#a61d24]/20 hover:bg-[#a61d24] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest text-[#a61d24] transition-all"
                                                            >
                                                                Notificar / Liberar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteLead(lead.id)}
                                                            className="p-1.5 bg-rose-950/20 border border-rose-900/10 hover:bg-rose-900 text-rose-400 hover:text-white rounded-lg transition-all"
                                                            title="Remover Lead"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-16 text-center">
                                <span className="material-symbols-outlined text-slate-600 text-5xl mb-3 block">hourglass_empty</span>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Nenhum lead encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Integration Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-emerald-600 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl shadow-emerald-900/20">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Mercado Pago</p>
                            <h4 className="text-lg font-black flex items-center gap-2">Online <CheckCircle className="w-4 h-4" /></h4>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-[#a61d24] rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl shadow-[#a61d24]/20">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">E-mail Marketing</p>
                            <h4 className="text-lg font-black flex items-center gap-2">Ativado <CheckCircle className="w-4 h-4" /></h4>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    
                    {/* Sales by Category Curation */}
                    <div className="bg-[#0d0d0d] rounded-[2rem] border border-white/5 p-6 flex flex-col shadow-2xl sm:col-span-2 lg:col-span-1 min-h-[160px] text-white">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Curadorias mais Vendidas</p>
                            <div className="w-8 h-8 bg-[#a61d24]/10 text-[#a61d24] rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={25}
                                            outerRadius={35}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-grow space-y-1.5">
                                {categoryData.slice(0, 3).map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                            <span className="text-[10px] font-bold text-slate-400">{cat.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white">
                                            {((cat.value / (categoryData.reduce((a,b) => a + b.value, 0) || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
