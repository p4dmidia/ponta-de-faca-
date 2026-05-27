import React, { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    CreditCard,
    PlusCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
    Send,
    Loader2
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Withdrawal {
    id: number;
    amount_requested: number;
    net_amount: number;
    status: string;
    pix_key: string;
    payment_method?: string;
    bank_name?: string;
    bank_agency?: string;
    bank_account?: string;
    bank_account_type?: string;
    bank_document?: string;
    proof_url?: string;
    created_at: string;
}

const AffiliateFinancial: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // PIX update modal (original)
    const [showPixModal, setShowPixModal] = useState(false);
    const [newPixKey, setNewPixKey] = useState('');

    // Withdrawal Request Modal (new)
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [withdrawalMethod, setWithdrawalMethod] = useState<'pix' | 'bank_transfer'>('pix');
    const [withdrawAmount, setWithdrawAmount] = useState('');

    // Financial Data States
    const [balance, setBalance] = useState({
        total: 0,
        available: 0,
        frozen: 0,
        withdrawn: 0
    });
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    
    // Bank & PIX profile details
    const [bankDetails, setBankDetails] = useState({
        pix_key: 'Não cadastrada',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: '',
        bank_document: ''
    });

    useEffect(() => {
        if (user) {
            fetchFinancialData();
        }
    }, [user]);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Balances & Bank info (user_settings)
            const { data: settingsData, error: settingsError } = await supabase
                .from('user_settings')
                .select('available_balance, frozen_balance, total_earnings, pix_key, bank_name, bank_agency, bank_account, bank_account_type, bank_document')
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID)
                .limit(1);

            if (settingsError) throw settingsError;
            
            const settings = settingsData?.[0] || null;

            if (!settings) {
                setLoading(false);
                return;
            }

            // 2. Fetch Withdrawal History
            const { data: withdrawData, error: withdrawError } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (withdrawError) throw withdrawError;

            // 3. Calculate Withdrawn amount
            const totalWithdrawn = (withdrawData || [])
                .filter(w => w.status === 'completed' || w.status === 'paid' || w.status === 'Pago')
                .reduce((acc, curr) => acc + Number(curr.amount_requested), 0);

            setBalance({
                total: Number(settings.total_earnings || 0),
                available: Number(settings.available_balance || 0),
                frozen: Number(settings.frozen_balance || 0),
                withdrawn: totalWithdrawn
            });

            setWithdrawals(withdrawData || []);
            
            setBankDetails({
                pix_key: settings.pix_key || 'Não cadastrada',
                bank_name: settings.bank_name || '',
                bank_agency: settings.bank_agency || '',
                bank_account: settings.bank_account || '',
                bank_account_type: settings.bank_account_type || '',
                bank_document: settings.bank_document || ''
            });

            setNewPixKey(settings.pix_key || '');
            setWithdrawAmount(Number(settings.available_balance || 0).toFixed(2));

        } catch (error: any) {
            console.error('Erro ao buscar dados financeiros:', error);
            toast.error('Erro ao carregar dados financeiros.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePix = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPixKey.trim()) {
            toast.error('Informe uma chave PIX válida.');
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await supabase
                .from('user_settings')
                .update({ pix_key: newPixKey.trim() })
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID);

            if (error) throw error;

            toast.success('Chave PIX atualizada com sucesso!');
            setBankDetails(prev => ({ ...prev, pix_key: newPixKey.trim() }));
            setShowPixModal(false);
            fetchFinancialData();
        } catch (error: any) {
            console.error('Erro ao atualizar PIX:', error);
            toast.error('Erro ao atualizar chave PIX.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const amount = Number(withdrawAmount);
        
        if (isNaN(amount) || amount < 50) {
            toast.error('O valor mínimo para saque é R$ 50,00.');
            return;
        }

        if (amount > balance.available) {
            toast.error('Saldo insuficiente para o saque solicitado.');
            return;
        }

        // Validate info depending on method
        if (withdrawalMethod === 'pix') {
            if (!bankDetails.pix_key || bankDetails.pix_key === 'Não cadastrada') {
                toast.error('Cadastre uma chave PIX antes de solicitar o saque.');
                return;
            }
        } else {
            if (!bankDetails.bank_name || !bankDetails.bank_agency || !bankDetails.bank_account || !bankDetails.bank_document) {
                toast.error('Cadastre seus dados bancários completos antes de solicitar o saque.');
                return;
            }
        }

        try {
            setSubmitting(true);

            // 1. Create withdrawal record
            const { error: withdrawErr } = await supabase
                .from('withdrawals')
                .insert([{
                    user_id: user?.id,
                    amount_requested: amount,
                    net_amount: amount,
                    pix_key: withdrawalMethod === 'pix' ? bankDetails.pix_key : 'Transferência Bancária',
                    status: 'pending',
                    payment_method: withdrawalMethod,
                    bank_name: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_name : null,
                    bank_agency: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_agency : null,
                    bank_account: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_account : null,
                    bank_account_type: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_account_type : null,
                    bank_document: withdrawalMethod === 'bank_transfer' ? bankDetails.bank_document : null,
                    organization_id: ORGANIZATION_ID
                }]);

            if (withdrawErr) throw withdrawErr;

            // 2. Deduct available balance in user_settings
            const newAvailable = balance.available - amount;
            const { error: balanceErr } = await supabase
                .from('user_settings')
                .update({ 
                    available_balance: newAvailable,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user?.id)
                .eq('organization_id', ORGANIZATION_ID);

            if (balanceErr) throw balanceErr;

            toast.success('Solicitação de saque efetuada com sucesso!');
            setShowWithdrawalModal(false);
            fetchFinancialData();
        } catch (error: any) {
            console.error('Erro ao solicitar saque:', error);
            toast.error(error.message || 'Erro ao processar saque.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const stats = [
        { label: 'Saldo Total', value: formatCurrency(balance.total), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-white/[0.02]' },
        { label: 'Saldo Disponível', value: formatCurrency(balance.available), icon: Wallet, color: 'text-[#a61d24]', bg: 'bg-white/[0.02]' },
        { label: 'Aguardando Liberação', value: formatCurrency(balance.frozen), icon: Clock, color: 'text-blue-400', bg: 'bg-white/[0.02]' },
        { label: 'Total Sacado', value: formatCurrency(balance.withdrawn), icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-white/[0.02]' },
    ];

    const hasBankDetails = bankDetails.bank_name && bankDetails.bank_agency && bankDetails.bank_account && bankDetails.bank_document;
    const hasPixKey = bankDetails.pix_key && bankDetails.pix_key !== 'Não cadastrada';

    return (
        <AffiliateLayout>
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white">Financeiro</h1>
                    <p className="text-slate-400 font-medium font-inter">Acompanhe seus ganhos e solicite saques manuais.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowWithdrawalModal(true)}
                        disabled={balance.available < 50}
                        className="px-6 py-4 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#a61d24]/10 wine-glow flex-1 md:flex-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={balance.available < 50 ? 'Saldo mínimo de R$ 50,00 necessário' : ''}
                    >
                        <ArrowUpRight className="w-5 h-5" />
                        SOLICITAR SAQUE
                    </button>
                    <button
                        onClick={fetchFinancialData}
                        className="p-4 bg-[#0d0d0d] border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all flex items-center justify-center"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-[#0d0d0d] p-6 rounded-[2rem] border border-white/5 transition-all hover:border-[#a61d24]/20 shadow-2xl relative group overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/[0.02] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-0 group-hover:scale-100"></div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} border border-white/5`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                        <h3 className="text-2xl font-black text-white">
                            {loading ? <span className="animate-pulse">...</span> : stat.value}
                        </h3>
                    </div>
                ))}
            </div>

            {/* Tables and Main Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transactions Table */}
                <div className="lg:col-span-2 bg-[#0d0d0d] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-white">Histórico de Pagamentos e Saques</h3>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Transações solicitadas</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/[0.02] text-left">
                                    <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Descrição</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Data</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Valor</th>
                                    <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                                            Carregando histórico...
                                        </td>
                                    </tr>
                                ) : withdrawals.length > 0 ? (
                                    withdrawals.map((item) => (
                                        <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-6 px-10">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                        item.status === 'rejected' 
                                                            ? 'bg-red-950/20 text-red-500 border border-red-905/20' 
                                                            : 'bg-emerald-950/20 text-emerald-400 border border-emerald-905/20'
                                                    }`}>
                                                        <ArrowDownLeft className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white">
                                                            Saque ({item.payment_method === 'bank_transfer' ? 'Transferência Bancária' : 'PIX'})
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                                            {item.payment_method === 'bank_transfer' ? `${item.bank_name} - Ag: ${item.bank_agency} / Cc: ${item.bank_account}` : `Chave: ${item.pix_key}`}
                                                        </span>
                                                        {item.proof_url && (
                                                            <a 
                                                                href={item.proof_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] font-black text-[#a61d24] uppercase tracking-widest hover:underline flex items-center gap-1 mt-1.5"
                                                            >
                                                                <CreditCard className="w-3 h-3" /> Ver Comprovante
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{formatDate(item.created_at).day}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium uppercase mt-1">{formatDate(item.created_at).time}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <span className={`font-black text-sm ${item.status === 'rejected' ? 'text-slate-600 line-through' : 'text-rose-500'}`}>
                                                    - {formatCurrency(item.amount_requested)}
                                                </span>
                                            </td>
                                            <td className="py-6 px-10 text-right">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                                                    item.status === 'completed' || item.status === 'paid' || item.status === 'Pago' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/10' :
                                                    item.status === 'pending' || item.status === 'Pendente' ? 'bg-amber-950/20 text-amber-400 border-amber-900/10' :
                                                    item.status === 'approved' ? 'bg-blue-950/20 text-blue-400 border-blue-900/10' : 'bg-red-950/20 text-red-500 border-red-900/10'
                                                }`}>
                                                    {item.status === 'pending' ? 'Pendente' :
                                                     item.status === 'approved' ? 'Aprovado' :
                                                     item.status === 'completed' || item.status === 'paid' || item.status === 'Pago' ? 'Pago' : 'Recusado'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-500 font-bold">
                                            Nenhum pagamento ou saque solicitado até o momento.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-8">
                    {/* PIX Key / Bank Details Box */}
                    <div className="bg-[#0d0d0d] border border-white/5 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#a61d24]/5 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <CreditCard className="w-5 h-5 text-[#a61d24]" />
                                </div>
                                <h3 className="font-black text-white text-lg">Dados de Recebimento</h3>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Chave PIX</p>
                                    <p className="font-bold text-sm text-white overflow-hidden text-ellipsis">{bankDetails.pix_key}</p>
                                </div>

                                {hasBankDetails ? (
                                    <div className="pt-4 border-t border-white/5 space-y-2">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Conta Bancária</p>
                                        <p className="text-xs font-bold text-white">{bankDetails.bank_name}</p>
                                        <p className="text-xs text-slate-300">Agência: {bankDetails.bank_agency} | Conta: {bankDetails.bank_account}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black">{bankDetails.bank_account_type}</p>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Conta Bancária Não Salva
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">Configure seus dados bancários para poder fazer transferências.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => navigate('/afiliado/settings?tab=bank')}
                                className="w-full bg-[#a61d24] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#8d181e] wine-glow transition-all"
                            >
                                GERENCIAR DADOS DE RECEBIMENTO
                            </button>
                        </div>
                    </div>

                    {/* Rules/Info Box */}
                    <div className="bg-[#0d0d0d] border border-white/5 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-[#a61d24] shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-black text-white text-base mb-4">Regras de Saque</h4>
                                <ul className="text-xs text-slate-400 font-medium space-y-3">
                                    <li className="flex gap-2"><span className="text-[#a61d24]">■</span> <span>Valor mínimo para solicitação: <b>R$ 50,00</b></span></li>
                                    <li className="flex gap-2"><span className="text-[#a61d24]">■</span> <span>Meios disponíveis: <b>PIX</b> ou <b>Transferência Bancária</b></span></li>
                                    <li className="flex gap-2"><span className="text-[#a61d24]">■</span> <span>Os saques dependem da aprovação e comprovação de pagamento pelo Administrador.</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {showWithdrawalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0d0d0d] border border-white/5 rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300 text-white">
                        <h3 className="text-2xl font-black text-white mb-2">Solicitar Saque</h3>
                        <p className="text-slate-400 text-sm mb-8 font-medium">Escolha como e quanto deseja transferir do seu saldo disponível.</p>

                        <form onSubmit={handleRequestWithdrawal} className="space-y-6">
                            {/* Method selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Método de Recebimento</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawalMethod('pix')}
                                        className={`py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border flex flex-col items-center gap-2 ${
                                            withdrawalMethod === 'pix'
                                                ? 'border-[#a61d24] bg-[#a61d24]/10 text-white'
                                                : 'border-white/5 bg-black/20 text-slate-500 hover:border-white/10'
                                        }`}
                                    >
                                        <Send className="w-5 h-5 text-[#a61d24]" />
                                        Chave PIX
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawalMethod('bank_transfer')}
                                        className={`py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border flex flex-col items-center gap-2 ${
                                            withdrawalMethod === 'bank_transfer'
                                                ? 'border-[#a61d24] bg-[#a61d24]/10 text-white'
                                                : 'border-white/5 bg-black/20 text-slate-500 hover:border-white/10'
                                        }`}
                                    >
                                        <CreditCard className="w-5 h-5 text-[#a61d24]" />
                                        Transferência
                                    </button>
                                </div>
                            </div>

                            {/* Chosen destination details */}
                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 text-xs text-slate-300">
                                {withdrawalMethod === 'pix' ? (
                                    <div>
                                        <p className="text-slate-500 font-black uppercase text-[10px] tracking-wider mb-2">PIX Destinatário</p>
                                        <p className="font-bold text-white break-all">{bankDetails.pix_key}</p>
                                        {!hasPixKey && (
                                            <p className="text-red-500 font-bold uppercase text-[9px] mt-3 flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Chave PIX não configurada no perfil.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-slate-500 font-black uppercase text-[10px] tracking-wider mb-2">Conta Bancária Destinatária</p>
                                        {hasBankDetails ? (
                                            <div className="space-y-1 text-white">
                                                <p className="font-bold">{bankDetails.bank_name} ({bankDetails.bank_account_type})</p>
                                                <p className="text-slate-300 font-medium">Agência: {bankDetails.bank_agency} | Conta: {bankDetails.bank_account}</p>
                                                <p className="text-slate-400 font-medium">CPF/CNPJ: {bankDetails.bank_document}</p>
                                            </div>
                                        ) : (
                                            <p className="text-red-500 font-bold uppercase text-[9px] mt-3 flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Dados bancários incompletos no perfil.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Amount field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Valor do Saque</label>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        Disponível: {formatCurrency(balance.available)}
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 font-bold">
                                        R$
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="50.00"
                                        required
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-12 outline-none focus:border-[#a61d24] focus:ring-1 focus:ring-[#a61d24]/50 transition-all font-black text-white text-lg"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold ml-1 uppercase tracking-wider">Mínimo de R$ 50,00.</p>
                            </div>

                            {/* Submit and Cancel */}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowWithdrawalModal(false)}
                                    className="flex-1 bg-[#121212] border border-white/5 hover:bg-white/5 py-5 rounded-2xl font-black text-slate-400 transition-all text-xs uppercase"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        submitting || 
                                        balance.available < 50 || 
                                        (withdrawalMethod === 'pix' && !hasPixKey) || 
                                        (withdrawalMethod === 'bank_transfer' && !hasBankDetails)
                                    }
                                    className="flex-1 bg-[#a61d24] hover:bg-[#8d181e] py-5 rounded-2xl font-black text-white transition-all shadow-xl shadow-[#a61d24]/10 wine-glow flex items-center justify-center gap-2 text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {submitting ? 'ENVIANDO...' : 'SOLICITAR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AffiliateLayout>
    );
};

export default AffiliateFinancial;
