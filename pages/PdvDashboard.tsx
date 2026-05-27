import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { 
    Store, 
    Package, 
    CheckCircle2, 
    AlertTriangle, 
    QrCode, 
    FileCheck, 
    TrendingUp, 
    LogOut, 
    Search, 
    Loader2, 
    ArrowUpRight, 
    User, 
    Check, 
    Plus, 
    Minus,
    RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Company {
    id: number;
    nome_fantasia: string;
    endereco: string;
    cnpj: string;
    email: string;
    telefone: string;
    billing_model: 'centralized' | 'consigned';
}

const PdvDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [company, setCompany] = useState<Company | null>(null);
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };
    const [loadingCompany, setLoadingCompany] = useState(true);
    
    // Local Stock state
    const [stockCount, setStockCount] = useState(15);
    const [minStockLimit, setMinStockLimit] = useState(5);
    const [requestingReplenishment, setRequestingReplenishment] = useState(false);

    // Update stock in database
    const handleUpdateStock = async (newQty: number) => {
        setStockCount(newQty);
        if (!company) return;
        try {
            await supabase
                .from('companies')
                .update({ 
                    stock_quantity: newQty,
                    updated_at: new Date().toISOString()
                })
                .eq('id', company.id);
        } catch (err) {
            console.error('Error updating stock:', err);
        }
    };

    // Order validation state
    const [tokenInput, setTokenInput] = useState('');
    const [searchingOrder, setSearchingOrder] = useState(false);
    const [validatedOrder, setValidatedOrder] = useState<any | null>(null);
    const [confirmingDelivery, setConfirmingDelivery] = useState(false);

    // List of pending pickup orders for simulation
    const [pendingPickups, setPendingPickups] = useState<any[]>([]);
    const [loadingPickups, setLoadingPickups] = useState(false);
    
    // Stats
    const [withdrawalsToday, setWithdrawalsToday] = useState(0);
    const [commissionEarned, setCommissionEarned] = useState(0);

    const mockCompany: Company = {
        id: 999,
        nome_fantasia: 'Empório Ponta D\'Faca - Savassi (Demonstração)',
        endereco: 'Rua Sergipe, 1200 - Savassi, Belo Horizonte - MG',
        cnpj: '12.345.678/0001-90',
        email: user?.email || 'savassi@emporioparc.com',
        telefone: '(31) 98765-4321',
        billing_model: 'centralized'
    };

    // Load company profile and stats
    useEffect(() => {
        const loadCompanyData = async () => {
            if (!user) return;
            setLoadingCompany(true);
            try {
                // Find company where email matches
                const { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('email', user.email)
                    .maybeSingle();

                if (data && !error) {
                    setCompany(data);
                    setStockCount(data.stock_quantity ?? 15);
                    setMinStockLimit(data.min_stock_limit ?? 5);
                } else {
                    // Fallback to mock for testing
                    setCompany(mockCompany);
                    setStockCount(mockCompany.stock_quantity ?? 15);
                    setMinStockLimit(mockCompany.min_stock_limit ?? 5);
                }
            } catch (err) {
                console.error('Error loading company:', err);
                setCompany(mockCompany);
            } finally {
                setLoadingCompany(false);
            }
        };

        loadCompanyData();
    }, [user]);

    // Fetch pending pickups for validation and simulation
    const fetchPendingPickups = async () => {
        setLoadingPickups(true);
        try {
            // Find orders where status is 'Enviado' (ready for pickup) and shipping_method is 'Retirada em PDV'
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items:order_items(*)')
                .eq('shipping_method', 'Retirada em PDV')
                .eq('status', 'Enviado')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setPendingPickups(data);
            } else {
                setPendingPickups([]);
            }
        } catch (err) {
            console.error('Error fetching pickups:', err);
        } finally {
            setLoadingPickups(false);
        }
    };

    useEffect(() => {
        fetchPendingPickups();
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Sessão encerrada com sucesso!');
            navigate('/pdv/login');
        } catch (e) {
            toast.error('Erro ao sair do sistema.');
        }
    };

    // Verify token/code entered
    const handleVerifyToken = async (e?: React.FormEvent, customToken?: string) => {
        if (e) e.preventDefault();
        const token = customToken || tokenInput;
        if (!token.trim()) {
            toast.error('Por favor, informe o Token ou ID do pedido.');
            return;
        }

        setSearchingOrder(true);
        setValidatedOrder(null);
        try {
            // We search by order ID
            const cleanToken = token.trim().toUpperCase().replace(/^#/, '');
            
            // Query by ID in the database
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items:order_items(*)')
                .ilike('id', `%${cleanToken}%`)
                .single();

            if (error || !data) {
                toast.error('Pedido não encontrado no sistema.');
            } else {
                // Verify status and delivery method
                if (data.shipping_method !== 'Retirada em PDV') {
                    toast.error(`Este pedido está marcado para: ${data.shipping_method}. Não é elegível para retirada local.`);
                } else if (data.status === 'Entregue' || data.status === 'completed') {
                    toast.error('Este pedido já foi retirado anteriormente pelo cliente.');
                } else if (data.status !== 'Enviado' && data.status !== 'Pago') {
                    toast.error(`O pagamento deste pedido ainda não foi confirmado (Status: ${data.status}).`);
                } else {
                    setValidatedOrder(data);
                    toast.success('Pedido validado e pronto para entrega!');
                }
            }
        } catch (err) {
            console.error('Error verifying token:', err);
            toast.error('Erro ao buscar pedido.');
        } finally {
            setSearchingOrder(false);
        }
    };

    // Confirm delivery/withdrawal
    const handleConfirmDelivery = async () => {
        if (!validatedOrder) return;
        setConfirmingDelivery(true);
        try {
            // Update order status in Supabase to 'Entregue'
            const { error } = await supabase
                .from('orders')
                .update({ 
                    status: 'Entregue',
                    updated_at: new Date().toISOString()
                })
                .eq('id', validatedOrder.id);

            if (error) throw error;

            // Reduce local stock by 1
            const newStock = Math.max(0, stockCount - 1);
            handleUpdateStock(newStock);
            if (company) {
                setCompany({ ...company, stock_quantity: newStock });
            }
            // Add withdrawal stats
            setWithdrawalsToday(prev => prev + 1);
            setCommissionEarned(prev => prev + 30.00); // PDV earns R$ 30,00 per pickup handling

            toast.success('Retirada confirmada e registrada com sucesso!', {
                style: {
                    background: '#0a0a0a',
                    color: '#e5e2e1',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                },
                iconTheme: {
                    primary: '#10b981',
                    secondary: '#0a0a0a'
                }
            });

            setValidatedOrder(null);
            setTokenInput('');
            fetchPendingPickups(); // Refresh lists
        } catch (err) {
            console.error('Error confirming delivery:', err);
            toast.error('Erro ao confirmar entrega.');
        } finally {
            setConfirmingDelivery(false);
        }
    };

    // Trigger stock replenishment request
    const handleRequestReplenishment = async () => {
        if (!company) return;
        setRequestingReplenishment(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({ 
                    reorder_status: 'pending',
                    updated_at: new Date().toISOString()
                })
                .eq('id', company.id);

            if (error) throw error;

            toast.success('Pedido de reposição enviado à central Ponta D\'Faca! Em breve um agente logístico fará a entrega.', {
                duration: 5000
            });
            
            setCompany({ ...company, reorder_status: 'pending' });
        } catch (err) {
            console.error('Error requesting replenishment:', err);
            toast.error('Erro ao enviar pedido de reposição.');
        } finally {
            setRequestingReplenishment(false);
        }
    };

    if (loadingCompany) {
        return (
            <div className="bg-[#050505] text-[#e5e2e1] min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a61d24]"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#050505] text-[#e5e2e1] min-h-screen font-sans flex flex-col lg:flex-row overflow-x-hidden">
            {/* Sidebar */}
            <aside className="w-full lg:w-72 bg-black border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col p-6 shrink-0">
                <div className="mb-10 px-2 flex items-center justify-center lg:justify-start">
                    <img src="/assets/logo-ponta.png" alt="Ponta D'Faca" className="h-20 w-auto object-contain" />
                </div>

                <div className="flex-grow space-y-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-[#a61d24]">
                            <Store className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Estabelecimento</span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-tight truncate">
                            {company?.nome_fantasia || 'Empório Parceiro'}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-normal">
                            {company?.endereco}
                        </p>
                    </div>

                    <div className="p-4 bg-[#121212] border border-white/5 rounded-2xl">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Modelo de Operação</p>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            company?.billing_model === 'consigned' 
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-900/20' 
                                : 'bg-red-950/40 text-red-400 border border-red-900/20'
                        }`}>
                            {company?.billing_model === 'consigned' ? 'Estoque Consignado' : 'Faturamento Direto'}
                        </span>
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-3.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        SAIR DO PORTAL
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow p-6 md:p-10 space-y-8 overflow-y-auto">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 pb-6 border-b border-white/5">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-display-lg text-white font-bold">Painel do Empório</h1>
                        <p className="text-on-surface-variant font-medium mt-1">
                            Valide as entregas mensais do Clube de Assinaturas Ponta D'Faca.
                        </p>
                    </div>
                    
                    <button 
                        onClick={fetchPendingPickups}
                        className="p-3 bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 rounded-xl flex items-center justify-center transition-all text-on-surface-variant hover:text-white shrink-0 self-start md:self-center"
                        title="Atualizar Pedidos"
                    >
                        {loadingPickups ? <Loader2 className="w-5 h-5 animate-spin text-[#a61d24]" /> : <RefreshCw className="w-5 h-5" />}
                    </button>
                </header>

                {/* Dashboard Metrics (KPI Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Stock Card */}
                    <div className="bg-[#0d0d0d] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="w-12 h-12 bg-[#a61d24]/10 border border-[#a61d24]/20 rounded-2xl flex items-center justify-center text-[#a61d24]">
                                <Package className="w-6 h-6" />
                            </div>
                            {stockCount <= minStockLimit && (
                                <span className="bg-amber-950/40 text-amber-400 border border-amber-900/30 text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> CRÍTICO
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-2">Estoque Local de Combos</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-white leading-none">{stockCount}</h3>
                                <span className="text-xs text-on-surface-variant font-medium">unidades</span>
                            </div>
                        </div>
                        {/* Stock Controls */}
                        <div className="flex gap-2 pt-2 border-t border-white/5 justify-between items-center">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleUpdateStock(Math.max(0, stockCount - 1))}
                                    className="w-8 h-8 rounded-lg bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-white"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleUpdateStock(stockCount + 1)}
                                    className="w-8 h-8 rounded-lg bg-[#121212] hover:bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-white"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={handleRequestReplenishment}
                                disabled={requestingReplenishment || company?.reorder_status === 'pending'}
                                className="px-3 py-1.5 bg-[#a61d24]/10 hover:bg-[#a61d24]/20 text-[#a61d24] border border-[#a61d24]/20 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 disabled:opacity-50"
                            >
                                {requestingReplenishment ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                                 company?.reorder_status === 'pending' ? 'AGUARDANDO' : 'REPOR'}
                            </button>
                        </div>
                    </div>

                    {/* Withdrawals Card */}
                    <div className="bg-[#0d0d0d] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
                        <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-400">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-2">Retiradas Hoje</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-white leading-none">{withdrawalsToday}</h3>
                                <span className="text-xs text-on-surface-variant font-medium">validações</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
                            Última atualização: agora mesmo
                        </div>
                    </div>

                    {/* Commissions Card */}
                    <div className="bg-[#0d0d0d] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
                        <div className="w-12 h-12 bg-purple-950/40 border border-purple-900/30 rounded-2xl flex items-center justify-center text-purple-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-2">Comissões PDV Acumuladas</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-white leading-none">{formatCurrency(commissionEarned)}</h3>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-[9px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Ganhos por ponto de entrega
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Validador de Tokens */}
                    <div className="xl:col-span-7 bg-[#0d0d0d] rounded-[2rem] border border-white/5 p-8 shadow-2xl space-y-6">
                        <h3 className="text-lg font-display-lg text-white font-bold flex items-center gap-2">
                            <QrCode className="w-6 h-6 text-[#a61d24]" />
                            Validar Retirada de Combo
                        </h3>
                        <p className="text-on-surface-variant text-xs font-medium leading-relaxed">
                            Insira o Token do pedido gerado no painel do assinante para confirmar a entrega e dar baixa automática no estoque local.
                        </p>

                        <form onSubmit={(e) => handleVerifyToken(e)} className="flex gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                                <input
                                    type="text"
                                    placeholder="Ex: ORD-17798..."
                                    value={tokenInput}
                                    onChange={(e) => setTokenInput(e.target.value)}
                                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-[#a61d24] transition-all uppercase placeholder-on-surface-variant/40"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={searchingOrder}
                                className="px-6 bg-[#a61d24] text-white hover:bg-[#8d181e] rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 wine-glow"
                            >
                                {searchingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'VERIFICAR'}
                            </button>
                        </form>

                        {/* Order Details after validation */}
                        {validatedOrder && (
                            <div className="bg-[#121212] border border-[#a61d24]/20 rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center text-[#a61d24]">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{validatedOrder.customer_name}</h4>
                                            <p className="text-[10px] font-bold text-on-surface-variant uppercase mt-1">Pedido: #{validatedOrder.id.slice(0, 16).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/20 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                        PAGO &amp; AUTORIZADO
                                    </span>
                                </div>

                                <div className="border-t border-white/5 pt-4 space-y-3">
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Produtos a Entregar:</p>
                                    {validatedOrder.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center text-xs font-bold bg-black/20 p-3 rounded-xl border border-white/5">
                                            <span className="text-white">{item.product_name}</span>
                                            <span className="text-primary font-bold">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleConfirmDelivery}
                                    disabled={confirmingDelivery}
                                    className="w-full py-4 bg-[#a61d24] text-white hover:bg-[#8d181e] rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 wine-glow"
                                >
                                    {confirmingDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    CONFIRMAR RETIRADA E DAR BAIXA
                                </button>
                            </div>
                        )}
                    </div>

                    {/* QR Code de Balcão e Simulação */}
                    <div className="xl:col-span-5 space-y-8">
                        {/* QR Code Balcão Card */}
                        <div className="bg-[#0d0d0d] rounded-[2rem] border border-white/5 p-8 shadow-2xl text-center space-y-4">
                            <QrCode className="w-8 h-8 text-[#a61d24] mx-auto" />
                            <div>
                                <h3 className="text-base font-display-lg text-white font-bold tracking-wide">QR Code de Balcão</h3>
                                <p className="text-on-surface-variant text-[10px] leading-relaxed mt-1">
                                    Exponha em seu balcão físico. Clientes que escanearem este QR Code e assinarem o clube comissionam seu estabelecimento automaticamente!
                                </p>
                            </div>
                            <div className="w-36 h-36 bg-[#050505] border border-white/15 rounded-2xl overflow-hidden flex items-center justify-center p-2 mx-auto">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://pontadefaca.com.br/register?ref=pdv-${company?.id || '999'}&color=e5e2e1&bgcolor=050505`} 
                                    alt="Referral QR Code" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                                Código de Ref: <span className="text-[#a61d24] ml-1">PDV-{company?.id || '999'}</span>
                            </span>
                        </div>

                        {/* Sandbox Simulator for Testings */}
                        <div className="bg-[#121212]/40 border border-dashed border-white/10 rounded-[2rem] p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Simulador de Leitura QR (Sandbox)</h4>
                                <span className="bg-amber-950/40 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Homologação</span>
                            </div>
                            <p className="text-[10px] text-on-surface-variant leading-relaxed">
                                Selecione um pedido na fila de retiradas pendentes do clube para simular o escaneamento do QR Code no leitor físico do balcão:
                              </p>
                              
                            <div className="space-y-2">
                                {loadingPickups ? (
                                    <div className="text-center py-2 flex items-center justify-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a61d24]" />
                                        <span className="text-[10px] text-on-surface-variant">Buscando pendentes...</span>
                                    </div>
                                ) : pendingPickups.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                                        {pendingPickups.map((o) => (
                                            <button
                                                key={o.id}
                                                onClick={() => {
                                                    setTokenInput(o.id);
                                                    handleVerifyToken(undefined, o.id);
                                                }}
                                                className="w-full text-left bg-black/40 border border-white/5 hover:border-[#a61d24]/50 p-2.5 rounded-xl flex justify-between items-center transition-all group"
                                            >
                                                <div>
                                                    <p className="text-[10px] font-bold text-white group-hover:text-[#a61d24] transition-colors">{o.customer_name}</p>
                                                    <p className="text-[8px] text-on-surface-variant font-medium mt-0.5">ID: #{o.id.slice(0, 10).toUpperCase()}...</p>
                                                </div>
                                                <span className="text-[9px] font-bold text-[#a61d24] uppercase tracking-wider flex items-center gap-0.5">
                                                    Escancear
                                                    <ArrowUpRight className="w-3 h-3" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-on-surface-variant italic py-2 text-center">Nenhum pedido pendente de retirada no clube no momento.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PdvDashboard;
