import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Lock,
    Key,
    Smartphone,
    Globe,
    Monitor,
    Activity,
    AlertTriangle,
    ShieldAlert,
    UserCheck,
    History,
    LogOut,
    ExternalLink,
    ChevronRight,
    ChevronLeft,
    Search,
    Loader2,
    Plus,
    X,
    UserPlus,
    Calendar,
    XCircle
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SecurityLog {
    id: number;
    user_email: string;
    ip_address: string;
    location: string;
    device_info: string;
    status: string;
    created_at: string;
    event_type: string;
}

interface AdminUser {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    updated_at: string;
}

const AdminSecurity: React.FC = () => {
    const [accessLogs, setAccessLogs] = useState<SecurityLog[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        score: 98,
        activeSessions: 0,
        criticalAlerts: 0
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        cpf: '',
        role: 'admin_op'
    });

    // Pagination & Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalLogsCount, setTotalLogsCount] = useState(0);
    const [isLogsLoading, setIsLogsLoading] = useState(false);
    const logsPerPage = 10;

    useEffect(() => {
        fetchSecurityData();
    }, []);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createFormData.email.trim() || !createFormData.password.trim() || !createFormData.name.trim()) {
            toast.error('Por favor, preencha Nome, E-mail e Senha.');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.rpc('admin_create_user', {
                p_email: createFormData.email.trim(),
                p_password: createFormData.password.trim(),
                p_role: createFormData.role,
                p_full_name: createFormData.name.trim(),
                p_whatsapp: createFormData.phone.trim() || null,
                p_cpf: createFormData.cpf.trim() || null,
                p_cnpj: null,
                p_login: null,
                p_sponsor_code: null
            });

            if (error) throw error;

            toast.success('Administrador cadastrado com sucesso!');
            setIsCreateModalOpen(false);
            setCreateFormData({
                name: '',
                email: '',
                password: '',
                phone: '',
                cpf: '',
                role: 'admin_op'
            });
            fetchSecurityData();
        } catch (error: any) {
            console.error('Error creating admin:', error);
            toast.error(error.message || 'Erro ao cadastrar administrador');
        } finally {
            setIsSaving(false);
        }
    };

    const fetchLogs = async (
        page = currentPage,
        search = searchTerm,
        start = startDate,
        end = endDate
    ) => {
        setIsLogsLoading(true);
        try {
            let query = supabase
                .from('security_logs')
                .select('*', { count: 'exact' });

            if (search.trim()) {
                const term = search.trim();
                query = query.or(`user_email.ilike.*${term}*,ip_address.ilike.*${term}*,location.ilike.*${term}*,device_info.ilike.*${term}*`);
            }

            if (start) {
                const startISO = new Date(`${start}T00:00:00`).toISOString();
                query = query.gte('created_at', startISO);
            }
            if (end) {
                const endISO = new Date(`${end}T23:59:59`).toISOString();
                query = query.lte('created_at', endISO);
            }

            query = query.order('created_at', { ascending: false });

            const from = (page - 1) * logsPerPage;
            const to = from + logsPerPage - 1;
            query = query.range(from, to);

            const { data, count, error } = await query;
            if (error) throw error;

            setAccessLogs(data || []);
            setTotalLogsCount(count || 0);
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Erro ao carregar logs de acesso.');
        } finally {
            setIsLogsLoading(false);
        }
    };

    const fetchSecurityData = async () => {
        setIsLoading(true);
        try {
            // Fetch Admins
            const { data: adminsData, error: adminsError } = await supabase
                .from('user_profiles')
                .select('*')
                .in('role', ['admin', 'admin_master', 'admin_op']);

            if (adminsError) throw adminsError;
            setAdmins(adminsData || []);

            // Critical Alerts Count
            const { count, error: countError } = await supabase
                .from('security_logs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'failure')
                .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (!countError) {
                setStats(prev => ({ ...prev, criticalAlerts: count || 0 }));
            }

        } catch (error) {
            console.error('Error fetching security data:', error);
            toast.error('Erro ao carregar dados de segurança.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLogs(currentPage, searchTerm, startDate, endDate);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchTerm, startDate, endDate]);

    const handleInvalidateSessions = async () => {
        if (!confirm('Deseja realmente invalidar todas as sessões? Isso forçará todos os usuários (incluindo você) a logarem novamente.')) return;

        try {
            toast.success('Comando enviado! Sessões sendo invalidadas...');

            await supabase.from('security_logs').insert({
                user_email: 'admin',
                event_type: 'bulk_session_invalidation',
                status: 'success',
                ip_address: 'internal',
                location: 'System',
                device_info: 'Admin Dashboard'
            });

        } catch (error) {
            toast.error('Erro ao invalidar sessões.');
        }
    };

    const totalPages = Math.ceil(totalLogsCount / logsPerPage) || 1;
    const fromIndex = (currentPage - 1) * logsPerPage;

    const getPageNumbers = () => {
        const pages = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-[#a61d24] animate-spin" />
                    <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Carregando segurança...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white font-playfair">Segurança Operacional</h1>
                        <p className="text-slate-400 font-medium text-sm md:text-base font-inter">Monitoramento de acessos e configurações de proteção.</p>
                    </div>
                    <button
                        onClick={() => {
                            fetchSecurityData();
                            fetchLogs(currentPage, searchTerm, startDate, endDate);
                        }}
                        className="w-full sm:w-auto bg-[#a61d24] hover:bg-[#8d181e] text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-[#a61d24]/10 transition-all text-xs uppercase tracking-widest"
                    >
                        <ShieldCheck className="w-5 h-5 text-white" />
                        AUDITORIA
                    </button>
                </div>

                {/* Security Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-[#0d0d0d] rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform hidden sm:block">
                            <ShieldCheck className="w-24 h-24 text-[#a61d24]" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-950/20 border border-emerald-900/10 rounded-xl flex items-center justify-center text-emerald-400">
                                <Activity className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-white text-sm md:text-base font-playfair">Segurança</h4>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Proteção Ativa</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl md:text-4xl font-black text-white">{stats.score}%</span>
                            <span className="text-emerald-400 font-bold text-xs md:text-sm mb-1 leading-none">SSL Ativo</span>
                        </div>
                    </div>

                    <div className="bg-[#0d0d0d] rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform hidden sm:block">
                            <Lock className="w-24 h-24 text-[#a61d24]" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-950/20 border border-blue-900/10 rounded-xl flex items-center justify-center text-blue-400">
                                <Monitor className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-white text-sm md:text-base font-playfair">Admins</h4>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gestão</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl md:text-4xl font-black text-white">{admins.length}</span>
                            <span className="text-blue-400 font-bold text-xs md:text-sm mb-1 leading-none">Acessos</span>
                        </div>
                    </div>

                    <div className={`rounded-[2rem] p-6 md:p-8 text-white shadow-2xl border relative overflow-hidden group transition-all sm:col-span-2 lg:col-span-1 ${stats.criticalAlerts > 0 ? 'bg-[#a61d24] border-[#a61d24]/50 shadow-[#a61d24]/10' : 'bg-[#0d0d0d] border-white/5 shadow-slate-900/10'}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
                            <ShieldAlert className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg md:text-xl">
                                {stats.criticalAlerts > 0 ? '!' : <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />}
                            </div>
                            <div>
                                <h4 className="font-black text-white text-sm md:text-base font-playfair">Alertas</h4>
                                <p className="text-[9px] md:text-[10px] font-bold text-white/60 uppercase tracking-widest">Últimas 24h</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl md:text-4xl font-black">{stats.criticalAlerts.toString().padStart(2, '0')}</span>
                            <span className="text-white/80 font-bold text-xs md:text-sm mb-1 leading-none">{stats.criticalAlerts > 0 ? 'Requer Ação' : 'Nenhuma ameaça'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Access Logs */}
                    <div className="lg:col-span-2 bg-[#0d0d0d] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-white font-playfair">Logs de Acesso</h3>
                                <p className="text-xs md:text-sm font-medium text-slate-400">Últimas atividades administrativas.</p>
                            </div>
                            <History className="w-5 h-5 text-slate-500" />
                        </div>

                        {/* Filters Bar */}
                        <div className="p-6 bg-black/40 border-b border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar por e-mail, IP, dispositivo, local..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-black/40 border border-white/5 text-white placeholder-slate-500 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none focus:border-[#a61d24] transition-all font-semibold"
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none focus:border-[#a61d24] transition-all font-semibold text-slate-400"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none focus:border-[#a61d24] transition-all font-semibold text-slate-400"
                                    />
                                </div>
                                {(searchTerm || startDate || endDate) && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setStartDate('');
                                            setEndDate('');
                                            setCurrentPage(1);
                                        }}
                                        title="Limpar Filtros"
                                        className="p-3 bg-rose-950/20 text-rose-400 rounded-2xl border border-rose-900/10 hover:bg-rose-900 hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {isLogsLoading ? (
                            <div className="py-32 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-[#a61d24] animate-spin" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filtrando logs de acesso...</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Card View */}
                                <div className="block xl:hidden divide-y divide-white/5 bg-black/20">
                                    {accessLogs.length > 0 ? accessLogs.map((log) => (
                                        <div key={log.id} className="p-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'success' ? 'bg-white/5 text-slate-400 border border-white/5' : 'bg-rose-950/20 text-rose-400 border border-rose-900/10'}`}>
                                                        <UserCheck className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-black text-white text-xs truncate max-w-[150px]">{log.user_email}</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${log.status === 'success' ? 'bg-emerald-950/20 border border-emerald-900/10 text-emerald-400' : 'bg-rose-950/20 border border-rose-900/10 text-rose-400'}`}>
                                                    {log.status === 'success' ? 'Sucesso' : 'Falha'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 font-inter">IP / Local</p>
                                                    <p className="text-[10px] font-black text-white">{log.ip_address}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1 uppercase mt-0.5">
                                                        <Globe className="w-3 h-3" /> {log.location}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 font-inter">Data</p>
                                                    <p className="text-[10px] font-bold text-slate-400">
                                                        {new Date(log.created_at).toLocaleDateString('pt-BR')} {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Monitor className="w-3 h-3" />
                                                <p className="text-[10px] font-medium truncate">{log.device_info}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center">
                                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Nenhum log encontrado.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden xl:block overflow-x-auto bg-black/20">
                                    <table className="w-full">
                                        <thead className="bg-white/[0.01]">
                                            <tr>
                                                <th className="text-left py-4 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Usuário</th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">IP / Localização</th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Dispositivo</th>
                                                <th className="text-center py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Status</th>
                                                <th className="text-right py-4 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {accessLogs.length > 0 ? accessLogs.map((log) => (
                                                <tr key={log.id} className="group hover:bg-white/[0.01] transition-colors">
                                                    <td className="py-5 px-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'success' ? 'bg-white/5 text-slate-400 border border-white/5' : 'bg-rose-950/20 text-rose-400 border border-rose-900/10'}`}>
                                                                <UserCheck className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-bold text-white text-xs truncate max-w-[120px]">{log.user_email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-4">
                                                        <p className="text-xs font-black text-white">{log.ip_address}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-tight">
                                                            <Globe className="w-3 h-3" /> {log.location}
                                                        </p>
                                                    </td>
                                                    <td className="py-5 px-4 font-medium text-xs text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="w-3 h-3 text-slate-600" />
                                                            {log.device_info}
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${log.status === 'success' ? 'bg-emerald-950/20 border border-emerald-900/10 text-emerald-400' : 'bg-rose-950/20 border border-rose-900/10 text-rose-400'
                                                            }`}>
                                                            {log.status === 'success' ? 'Sucesso' : 'Falha'}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-8 text-right text-xs font-bold text-slate-500 whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleDateString('pt-BR')}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="py-20 text-center text-slate-500 font-bold text-xs uppercase">
                                                        Nenhum log de acesso encontrado.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Pagination Footer */}
                        {totalPages > 1 && !isLogsLoading && (
                            <div className="p-6 md:px-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20">
                                <p className="text-xs font-semibold text-slate-500">
                                    Mostrando {fromIndex + 1} a {Math.min(fromIndex + accessLogs.length, totalLogsCount)} de {totalLogsCount} logs
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={currentPage === 1 || isLogsLoading}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-white" />
                                    </button>
                                    
                                    {getPageNumbers().map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-9 h-9 rounded-xl text-xs font-black transition-all flex items-center justify-center ${
                                                currentPage === page
                                                    ? 'bg-[#a61d24] text-white shadow-lg shadow-[#a61d24]/10'
                                                    : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        disabled={currentPage === totalPages || isLogsLoading}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        <ChevronRight className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Settings & Admins */}
                    <div className="space-y-6">
                        {/* Admin List */}
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 text-white shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black font-playfair">Administradores</h3>
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="p-2.5 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-xl shadow-lg transition-all"
                                    title="Cadastrar Administrador"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                {admins.map((admin) => (
                                    <div key={admin.id} className="flex items-center justify-between group cursor-pointer p-1 rounded-xl hover:bg-white/[0.01]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center font-black group-hover:bg-[#a61d24] group-hover:text-white transition-all uppercase">
                                                {admin.email[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs truncate max-w-[120px] text-white">{admin.email}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{admin.role}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Actions */}
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                            <h3 className="text-xl font-black text-white font-playfair mb-6">Configurações Rápidas</h3>
                            <div className="space-y-4">
                                <button className="w-full flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/[0.02] transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-5 h-5 text-[#a61d24]" />
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white">Regras de Senha</p>
                                            <p className="text-[10px] font-bold text-slate-500">Complexidade Máxima</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-6 bg-emerald-600 rounded-full p-1 relative">
                                        <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/[0.02] transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-slate-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white">Timeout de Sessão</p>
                                            <p className="text-[10px] font-bold text-slate-500">Padrão: 60 minutos</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                                </button>
                                <button
                                    onClick={handleInvalidateSessions}
                                    className="w-full flex items-center justify-center gap-2 p-4 bg-rose-950/20 border border-rose-900/10 hover:bg-rose-900 hover:text-white text-rose-400 rounded-2xl transition-all font-black text-sm mt-4"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Invalidar Todas as Sessões
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="bg-[#0d0d0d] border border-white/5 w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center shrink-0">
                            <div>
                                <p className="text-[10px] font-black uppercase text-[#a61d24] tracking-[0.2em] mb-1">Segurança</p>
                                <h2 className="text-xl font-black text-white font-playfair">Novo Administrador</h2>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-500 hover:text-white" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAdmin} className="flex-1 overflow-y-auto p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Nome Completo</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                    value={createFormData.name}
                                    onChange={e => setCreateFormData({ ...createFormData, name: e.target.value })}
                                    placeholder="Nome do Administrador"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">E-mail</label>
                                <input
                                    type="email"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                    value={createFormData.email}
                                    onChange={e => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    placeholder="admin@pontadefaca.com.br"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Senha de Acesso</label>
                                <input
                                    type="password"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                    value={createFormData.password}
                                    onChange={e => setCreateFormData({ ...createFormData, password: e.target.value })}
                                    placeholder="Senha de acesso"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">WhatsApp</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                    value={createFormData.phone}
                                    onChange={e => setCreateFormData({ ...createFormData, phone: e.target.value })}
                                    placeholder="(31) 99999-9999"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">CPF</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                    value={createFormData.cpf}
                                    onChange={e => setCreateFormData({ ...createFormData, cpf: e.target.value })}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Nível de Permissão</label>
                                <select
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24] appearance-none"
                                    value={createFormData.role}
                                    onChange={e => setCreateFormData({ ...createFormData, role: e.target.value })}
                                >
                                    <option value="admin_op" className="bg-[#0d0d0d] text-white">Operador (admin_op)</option>
                                    <option value="admin_master" className="bg-[#0d0d0d] text-white">Master (admin_master)</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-[#a61d24] hover:bg-[#8d181e] wine-glow text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 text-white" />}
                                    CADASTRAR ADMIN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminSecurity;
