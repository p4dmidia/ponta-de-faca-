import React, { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Search,
    Filter,
    Calendar,
    ChevronRight,
    Loader2,
    Eye,
    CheckCircle2,
    Truck,
    Package,
    XCircle,
    User,
    CreditCard,
    ArrowUpRight,
    Clock,
    DollarSign,
    Grid,
    List,
    Store,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_cpf?: string;
    total_amount: number;
    status: 'Pendente' | 'Pago' | 'Enviado' | 'Entregue' | 'Cancelado' | 'pending' | 'shipped' | 'completed' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'failed';
    created_at: string;
    items_count: number;
    payment_method: string;
    shipping_address?: string;
    shipping_method?: string;
}

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'shipped' | 'cancelled'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
    const ordersPerPage = 10;

    useEffect(() => {
        fetchOrders();
    }, []);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Erro ao carregar pedidos.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: Order['status'], paymentStatus?: Order['payment_status']) => {
        try {
            const updateData: any = { 
                status: newStatus,
                updated_at: new Date().toISOString()
            };
            
            if (paymentStatus) {
                updateData.payment_status = paymentStatus;
                if (paymentStatus === 'paid') {
                    updateData.payment_status_detail = 'Accreditated Manual';
                }
            }

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;
            toast.success(`Pedido atualizado para ${newStatus}!`);
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Erro ao atualizar status.');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            (order.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.shipping_address?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            if (statusFilter === 'pending') {
                matchesStatus = order.status === 'pending' || order.status === 'Pendente';
            } else if (statusFilter === 'shipped') {
                matchesStatus = order.status === 'shipped' || order.status === 'Enviado';
            } else if (statusFilter === 'completed') {
                matchesStatus = order.status === 'completed' || order.status === 'Pago' || order.status === 'Entregue';
            } else if (statusFilter === 'cancelled') {
                matchesStatus = order.status === 'cancelled' || order.status === 'Cancelado';
            }
        }
        
        return matchesSearch && matchesStatus;
    });

    // Pagination calculations
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const paginatedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending' || o.status === 'Pendente').length,
        revenue: orders.filter(o => o.status === 'completed' || o.status === 'Pago' || o.status === 'Entregue').reduce((acc, curr) => acc + curr.total_amount, 0),
        shipped: orders.filter(o => o.status === 'shipped' || o.status === 'Enviado').length
    };

    // Kanban categorizations
    const getKanbanOrders = (statusGroup: 'pending' | 'curing' | 'ready' | 'delivered') => {
        return orders.filter(order => {
            const matchesSearch = 
                (order.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                order.id.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;

            if (statusGroup === 'pending') {
                return order.status === 'pending' || order.status === 'Pendente';
            }
            if (statusGroup === 'curing') {
                return order.status === 'Pago' || order.status === 'completed';
            }
            if (statusGroup === 'ready') {
                return order.status === 'Enviado' || order.status === 'shipped';
            }
            if (statusGroup === 'delivered') {
                return order.status === 'Entregue';
            }
            return false;
        });
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="w-10 h-10 text-[#a61d24] animate-spin" />
                    <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Carregando pedidos...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white font-playfair">Logística de Produção & Pedidos</h1>
                        <p className="text-slate-400 font-medium text-sm md:text-base font-inter">
                            Gerencie o processo de cura lenta e as retiradas/entregas dos combos defumados.
                        </p>
                    </div>
                    {/* View Switcher Toggle */}
                    <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-full sm:w-auto shadow-2xl">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                viewMode === 'kanban'
                                    ? 'bg-[#a61d24] text-white shadow-md'
                                    : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            <Grid className="w-4 h-4" />
                            Quadro Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                viewMode === 'list'
                                    ? 'bg-[#a61d24] text-white shadow-md'
                                    : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            <List className="w-4 h-4" />
                            Tabela Simples
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Pedidos', value: stats.total, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/10' },
                        { label: 'Cura Lenta (Em Produção)', value: orders.filter(o => o.status === 'Pago' || o.status === 'completed').length, icon: Package, color: 'text-[#a61d24]', bg: 'bg-[#a61d24]/10 border-[#a61d24]/20' },
                        { label: 'Prontos p/ Retirada', value: stats.shipped, icon: Truck, color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/10' },
                        { label: 'Receita Operacional', value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/10' },
                    ].map((card, i) => (
                        <div key={i} className="bg-[#0d0d0d] p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-white/10 transition-all">
                            <div className={`w-12 h-12 ${card.bg} border rounded-2xl flex items-center justify-center mb-4`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{card.label}</p>
                            <h3 className="text-xl font-black text-white">{card.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Search Bar (Shared) */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, ID do pedido ou endereço de entrega..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 text-white placeholder-slate-500 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-[#a61d24] transition-all font-medium shadow-2xl"
                    />
                </div>

                {/* Kanban View */}
                {viewMode === 'kanban' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                        {/* 1. Pendente Column */}
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-5 shadow-2xl">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Pendente</h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-amber-950/20 border border-amber-900/10 text-amber-400 text-[10px] font-black">
                                    {getKanbanOrders('pending').length}
                                </span>
                            </div>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide pr-1">
                                {getKanbanOrders('pending').map(order => (
                                    <KanbanCard key={order.id} order={order} onUpdate={updateOrderStatus} />
                                ))}
                                {getKanbanOrders('pending').length === 0 && <EmptyLaneState />}
                            </div>
                        </div>

                        {/* 2. Cura Lenta Column */}
                        <div className="bg-[#0d0d0d] border border-[#a61d24]/20 rounded-[2.5rem] p-5 shadow-2xl">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#a61d24]/10">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#a61d24]" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Cura Lenta</h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-[#a61d24]/10 border border-[#a61d24]/20 text-[#a61d24] text-[10px] font-black">
                                    {getKanbanOrders('curing').length}
                                </span>
                            </div>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide pr-1">
                                {getKanbanOrders('curing').map(order => (
                                    <KanbanCard key={order.id} order={order} onUpdate={updateOrderStatus} />
                                ))}
                                {getKanbanOrders('curing').length === 0 && <EmptyLaneState />}
                            </div>
                        </div>

                        {/* 3. Pronto para Retirada Column */}
                        <div className="bg-[#0d0d0d] border border-purple-950/40 rounded-[2.5rem] p-5 shadow-2xl">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-purple-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Pronto p/ Retirada</h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-purple-950/20 border border-purple-900/10 text-purple-400 text-[10px] font-black">
                                    {getKanbanOrders('ready').length}
                                </span>
                            </div>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide pr-1">
                                {getKanbanOrders('ready').map(order => (
                                    <KanbanCard key={order.id} order={order} onUpdate={updateOrderStatus} />
                                ))}
                                {getKanbanOrders('ready').length === 0 && <EmptyLaneState />}
                            </div>
                        </div>

                        {/* 4. Entregue Column */}
                        <div className="bg-[#0d0d0d] border border-emerald-950/20 rounded-[2.5rem] p-5 shadow-2xl">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Entregue</h4>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950/20 border border-emerald-900/10 text-emerald-400 text-[10px] font-black">
                                    {getKanbanOrders('delivered').length}
                                </span>
                            </div>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide pr-1">
                                {getKanbanOrders('delivered').map(order => (
                                    <KanbanCard key={order.id} order={order} onUpdate={updateOrderStatus} />
                                ))}
                                {getKanbanOrders('delivered').length === 0 && <EmptyLaneState />}
                            </div>
                        </div>
                    </div>
                )}

                {/* Table List View */}
                {viewMode === 'list' && (
                    <div className="bg-[#0d0d0d] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-lg md:text-xl font-black text-white font-playfair">Fila de Pedidos</h3>
                            <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl">
                                {(['all', 'pending', 'shipped', 'completed', 'cancelled'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setStatusFilter(f)}
                                        className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-[#a61d24] text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        {f === 'all' ? 'Ver Todos' : f === 'pending' ? 'Pendentes' : f === 'shipped' ? 'Enviados/Prontos' : f === 'completed' ? 'Finalizados' : 'Cancelados'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="bg-white/[0.01] border-b border-white/5">
                                        <th className="text-left py-6 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID / Cliente</th>
                                        <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                                        <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pagamento</th>
                                        <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Total</th>
                                        <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Logística / Status</th>
                                        <th className="text-right py-6 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
                                        <tr key={order.id} className="group hover:bg-white/[0.01] transition-all">
                                            <td className="py-6 px-6">
                                                <div>
                                                    <p className="font-black text-white text-sm">{order.customer_name || 'Cliente'}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">#{order.id.replace(/^#/, '').slice(0, 8)}</p>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <p className="text-slate-400 font-bold text-xs">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="py-6 px-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase ${order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {order.payment_status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                        {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                                                    </span>
                                                    <p className="text-[10px] font-bold text-slate-500">{order.payment_method}</p>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <p className="font-black text-white">R$ {order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[10px] font-bold text-slate-500">{order.items_count || 1} Itens</p>
                                            </td>
                                            <td className="py-6 px-4">
                                                <div className="space-y-1.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                        order.status === 'completed' || order.status === 'Pago' ? 'bg-[#a61d24]/10 border border-[#a61d24]/20 text-[#a61d24]' :
                                                        order.status === 'Enviado' || order.status === 'shipped' ? 'bg-purple-950/20 border border-purple-900/10 text-purple-400' :
                                                        order.status === 'Entregue' ? 'bg-emerald-950/20 border border-emerald-900/10 text-emerald-400' :
                                                        order.status === 'Cancelado' || order.status === 'cancelled' ? 'bg-rose-950/20 border border-rose-900/10 text-rose-400' : 
                                                        'bg-amber-950/20 border border-amber-900/10 text-amber-400'
                                                    }`}>
                                                        {order.status === 'pending' || order.status === 'Pendente' ? 'Pendente' :
                                                         order.status === 'shipped' || order.status === 'Enviado' ? 'Pronto p/ Retirada' :
                                                         order.status === 'Pago' || order.status === 'completed' ? 'Cura Lenta' :
                                                         order.status === 'Entregue' ? 'Concluído' : 'Cancelado'}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                        {order.shipping_method === 'Entrega em Casa' ? (
                                                            <Truck className="w-3.5 h-3.5 text-[#a61d24] shrink-0" />
                                                        ) : (
                                                            <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                                        )}
                                                        <span className="truncate max-w-[150px]">{order.shipping_method || 'Não definido'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6 text-right">
                                                <div className="flex flex-col gap-2 max-w-[140px] ml-auto">
                                                    {(order.status === 'Pendente' || order.status === 'pending') && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateOrderStatus(order.id, 'Pago', 'paid')}
                                                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                                                title="Marcar como Pago"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Aprovar Pago
                                                            </button>
                                                            <button 
                                                                onClick={() => updateOrderStatus(order.id, 'Cancelado')}
                                                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-950/20 border border-rose-900/10 hover:bg-rose-900 text-rose-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                                                title="Cancelar Pedido"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                Cancelar
                                                            </button>
                                                        </>
                                                    )}
                                                    {(order.status === 'Pago' || order.status === 'completed') && (
                                                        <button 
                                                            onClick={() => updateOrderStatus(order.id, 'Enviado')}
                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md shadow-[#a61d24]/10"
                                                            title="Pronto para Retirada/Envio"
                                                        >
                                                            <Truck className="w-3.5 h-3.5" />
                                                            Finalizar Cura
                                                        </button>
                                                    )}
                                                    {(order.status === 'Enviado' || order.status === 'shipped') && (
                                                        <button 
                                                            onClick={() => updateOrderStatus(order.id, 'Entregue')}
                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                                            title="Marcar como Entregue"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Confirmar Entrega
                                                        </button>
                                                    )}
                                                    <button className="flex items-center justify-center p-2 bg-white/5 border border-white/10 text-slate-400 rounded-xl hover:text-white transition-all">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Ver Detalhes</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-500">
                                                    <ShoppingBag className="w-12 h-12 opacity-20" />
                                                    <p className="font-bold text-xs uppercase tracking-widest">Nenhum pedido encontrado.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Control */}
                        {totalPages > 1 && (
                            <div className="p-6 md:p-8 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Página {currentPage} de {totalPages} — {filteredOrders.length} Pedidos
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest bg-white/5 disabled:opacity-30 transition-all hover:bg-white/10"
                                    >
                                        Anterior
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-[#a61d24] text-white shadow-md' : 'hover:bg-white/5 text-slate-400'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest bg-white/5 disabled:opacity-30 transition-all hover:bg-white/10"
                                    >
                                        Próximo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

// Kanban Card Component
interface KanbanCardProps {
    order: Order;
    onUpdate: (orderId: string, newStatus: Order['status'], paymentStatus?: Order['payment_status']) => Promise<void>;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ order, onUpdate }) => {
    const isPdv = order.shipping_method === 'Retirada em PDV';
    const cleanAddress = order.shipping_address ? order.shipping_address.replace(/Retirada no PDV: /, '') : '';

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 shadow-lg hover:border-white/10 transition-all space-y-3.5 group">
            {/* Header info */}
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-[#a61d24] tracking-widest">
                    #{order.id.replace(/^#/, '').slice(0, 8).toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
            </div>

            {/* Customer & Price */}
            <div>
                <h5 className="text-xs font-black text-white leading-tight truncate">{order.customer_name || 'Cliente'}</h5>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xs font-black text-slate-300">R$ {order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] font-bold text-slate-500">{order.items_count || 1} Itens</p>
                </div>
            </div>

            {/* Delivery Method Badge & Address */}
            <div className="space-y-1.5 pt-2.5 border-t border-white/[0.03]">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider">
                    {isPdv ? (
                        <>
                            <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-purple-400">Retirada em Loja</span>
                        </>
                    ) : (
                        <>
                            <Truck className="w-3.5 h-3.5 text-[#a61d24] shrink-0" />
                            <span className="text-[#a61d24]">Receber em Casa</span>
                        </>
                    )}
                </div>
                {order.shipping_address && (
                    <div className="flex items-start gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-400 transition-colors leading-relaxed">
                        <MapPin className="w-3 h-3 text-slate-700 shrink-0 mt-0.5" />
                        <span className="line-clamp-2" title={order.shipping_address}>{cleanAddress}</span>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-white/[0.03] flex flex-col gap-1.5">
                {(order.status === 'Pendente' || order.status === 'pending') && (
                    <button
                        onClick={() => onUpdate(order.id, 'Pago', 'paid')}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                        <CheckCircle2 className="w-3 h-3" />
                        Confirmar Pago
                    </button>
                )}
                {(order.status === 'Pago' || order.status === 'completed') && (
                    <button
                        onClick={() => onUpdate(order.id, 'Enviado')}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-[#a61d24]/10 animate-pulse hover:animate-none"
                    >
                        <Package className="w-3 h-3" />
                        Concluir Cura <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                )}
                {(order.status === 'Enviado' || order.status === 'shipped') && (
                    <button
                        onClick={() => onUpdate(order.id, 'Entregue')}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                        <CheckCircle2 className="w-3 h-3" />
                        Entregar Pedido
                    </button>
                )}
                {order.status !== 'Entregue' && order.status !== 'Cancelado' && order.status !== 'cancelled' && (
                    <button
                        onClick={() => onUpdate(order.id, 'Cancelado')}
                        className="w-full py-1 text-[8px] font-black uppercase text-slate-600 hover:text-rose-400 transition-colors tracking-widest text-center"
                    >
                        Cancelar Pedido
                    </button>
                )}
                {order.status === 'Entregue' && (
                    <div className="flex items-center justify-center gap-1 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Concluído
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyLaneState: React.FC = () => (
    <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
        <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Sem pedidos nesta fase</p>
    </div>
);

export default AdminOrders;
