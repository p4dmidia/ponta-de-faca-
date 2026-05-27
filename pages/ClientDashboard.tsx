import React, { useState, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { ORGANIZATION_ID } from '../lib/config';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AffiliateLayout from '../components/AffiliateLayout';
import { 
  ShoppingBag, 
  CreditCard, 
  FileText, 
  Download, 
  Compass, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ShieldCheck, 
  Wallet,
  QrCode,
  MapPin,
  PackageCheck
} from 'lucide-react';

// Error Boundary to prevent runtime crashes from making the entire screen black
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-3xl text-red-200">
          <h2 className="text-xl font-bold mb-2">Ops, algo deu errado nesta seção!</h2>
          <pre className="text-xs overflow-auto bg-black/40 p-4 rounded-xl max-h-60 mb-4 whitespace-pre-wrap">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            className="px-4 py-2 bg-[#a61d24] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8d181e] transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ClientDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'compras' | 'assinaturas' | 'documentos' | 'servicos' | 'pagamentos'>('compras');
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [clientBalance, setClientBalance] = useState<number>(profile?.balance || 0);

  // Subscription Action States
  const [selectedSubToChangePlan, setSelectedSubToChangePlan] = useState<any | null>(null);
  const [selectedNewPlanSlug, setSelectedNewPlanSlug] = useState<string>('');
  const [selectedSubToPause, setSelectedSubToPause] = useState<any | null>(null);
  const [selectedSubToReactivate, setSelectedSubToReactivate] = useState<any | null>(null);
  const [selectedSubToCancel, setSelectedSubToCancel] = useState<any | null>(null);
  const [selectedRewardToRedeem, setSelectedRewardToRedeem] = useState<any | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const rewardsList = [
    {
      id: 'reward-bacon',
      name: 'Bacon Extra (150g)',
      description: 'Bacon artesanal defumado lentamente em lenha de macieira.',
      cost: 30.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH6E0Fn48revggD_q3l0qtzADvGANYWeY1aS_0y7qZB57Pq9KsVehQTwzrFtAdRDawDhh3GHzMPFvpXOcIjzcgWdz9kYi1mtOpFZFQyyZCGurfXr9JlTi2ihZ8BZbOOlMclJ8URofOwvFr46XikSMeZznvtbeY4n9D_WsM32TJPpTSIyZDde1pT8DC1t56KpHYdKYYgWhfYiEsNZPXXmDzv0uFD6TTOSc6GHpYrEb5on31oUCeFA3E5432KO5Ub6pGcfLqGLMwTrG_'
    },
    {
      id: 'reward-faca',
      name: 'Faca Artesanal Ponta D\'Faca',
      description: 'Faca de aço carbono com cabo de madeira nobre e bainha de couro.',
      cost: 150.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAWOHRDnFzh42oPreaT2pFr8qPNkbBTw4MYjoHMyEuSyVkUVYVYUmvf6lO3O-FUKIH_ojOzchVGzfFSN7-qltaFc4W0hoSp-Sfdam-mGhzRimga0z_3pA5bXNtrm-GY7uzr9L8drTBWcjw_eW-YnwsVCUieO9eBykfesWggHupXRaxmZm0FnJ1NvSI9KwX6HMQWuJ5lUyC8Vk2173Rgb6bLaffLUQ7T5cVfFvdpyWY4PGmFlnyzHEpqSTt2L5XZUeFgA0zUClVggjO'
    },
    {
      id: 'reward-bone',
      name: 'Boné Exclusivo Ponta D\'Faca',
      description: 'Boné premium com logo bordada e ajuste traseiro de couro.',
      cost: 80.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfDByUepKlzOdgsMXUfl-owCjpSasMwTEr-ie3YjnxPXId6seqNcchzJqkE34wx1nxtAwwsOnz0CzaPNGRIdtVNfC9WUl5K4FLtGWSjc7EfYNrje5avkkYgyCJVUjHK_ou_tp0LdSMH_WjPSqpoGNeqV6H82rzxF44ZWW7rYQMo_5Gy8Jz-K-ykfOrS4eaMk6hsY4cX4TcsgFuDLmkVPlQzvyuiKS-fgq7H44rJYsXEdtHC7ryhykhZjYRYPUPmB8lVE32YOwh2NSb'
    }
  ];

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          payment_method,
          shipping_method,
          shipping_address,
          shipping_cost,
          order_items:order_items(id, product_name, unit_price, quantity, product_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchBalance = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setClientBalance(data.balance || 0);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBalance();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setClientBalance(profile.balance || 0);
    }
  }, [profile]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDownloadMock = (docName: string) => {
    const content = `PONTA D'FACA CHARCUTARIA\n\nDocumento: ${docName}\n\nEste documento representa a cópia digitalizada e autenticada do seu ${docName}.\nEmitido para: ${profile?.full_name || 'Cliente'} (${user?.email})\nData de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n\nEm conformidade com as regras do Clube de Assinaturas Ponta D'Faca e os regulamentos de consumo vigentes no Brasil.\n\nCódigo de Autenticação: PDF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Download de "${docName}" iniciado!`);
  };

  const handlePlanChange = async () => {
    if (!selectedSubToChangePlan || !selectedNewPlanSlug) return;
    
    const planDetails: { [key: string]: { name: string; price: number } } = {
      'trimestral': { name: "Clube Ponta D'Faca - Trimestral", price: 280.00 },
      'semestral': { name: "Clube Ponta D'Faca - Semestral", price: 250.00 },
      'anual': { name: "Clube Ponta D'Faca - Anual", price: 230.00 }
    };
    
    const newPlan = planDetails[selectedNewPlanSlug];
    if (!newPlan) return;
    
    setIsActionLoading(true);
    try {
      const { error: itemError } = await supabase
        .from('order_items')
        .update({
          product_id: selectedNewPlanSlug,
          product_name: newPlan.name,
          unit_price: newPlan.price
        })
        .eq('order_id', selectedSubToChangePlan.id);

      if (itemError) throw itemError;

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          total_amount: newPlan.price
        })
        .eq('id', selectedSubToChangePlan.id);

      if (orderError) throw orderError;

      toast.success(`Plano alterado para ${newPlan.name} com sucesso!`);
      setSelectedSubToChangePlan(null);
      fetchOrders();
    } catch (err) {
      console.error('Error changing plan:', err);
      toast.error('Erro ao alterar plano. Tente novamente.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePauseSubscription = async () => {
    if (!selectedSubToPause) return;
    
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'Pausado',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubToPause.id);

      if (error) throw error;

      toast.success('Assinatura pausada com sucesso!');
      setSelectedSubToPause(null);
      fetchOrders();
    } catch (err) {
      console.error('Error pausing subscription:', err);
      toast.error('Erro ao pausar assinatura.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!selectedSubToReactivate) return;
    
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'Pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubToReactivate.id);

      if (error) throw error;

      toast.success('Assinatura reativada com sucesso!');
      setSelectedSubToReactivate(null);
      fetchOrders();
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      toast.error('Erro ao reativar assinatura.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubToCancel) return;
    
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'Cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubToCancel.id);

      if (error) throw error;

      toast.success('Assinatura cancelada com sucesso!');
      setSelectedSubToCancel(null);
      fetchOrders();
    } catch (err) {
      console.error('Error canceling subscription:', err);
      toast.error('Erro ao cancelar assinatura.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!selectedRewardToRedeem || !user || !profile) return;
    
    if (clientBalance < selectedRewardToRedeem.cost) {
      toast.error('Saldo de créditos insuficiente.');
      return;
    }
    
    setIsActionLoading(true);
    try {
      const { data: freshProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('balance, full_name, email, phone, cpf, street, number, complement, neighborhood, city, state, cep')
        .eq('id', user.id)
        .single();
        
      if (profileError || !freshProfile) throw new Error('Não foi possível obter os dados do perfil.');
      
      const currentBalance = freshProfile.balance || 0;
      if (currentBalance < selectedRewardToRedeem.cost) {
        toast.error('Saldo de créditos insuficiente.');
        setIsActionLoading(false);
        setSelectedRewardToRedeem(null);
        return;
      }
      
      const newBalance = currentBalance - selectedRewardToRedeem.cost;
      const orderId = `ORD-RESG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const addressString = freshProfile.street 
        ? `${freshProfile.street}, nº ${freshProfile.number} ${freshProfile.complement ? '- ' + freshProfile.complement : ''}, ${freshProfile.neighborhood}, ${freshProfile.city} - ${freshProfile.state}, CEP: ${freshProfile.cep}`
        : 'Retirada no Empório Parceiro (A combinar)';

      const { error: balanceError } = await supabase
        .from('user_profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);
        
      if (balanceError) throw balanceError;
      
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          organization_id: ORGANIZATION_ID,
          user_id: user.id,
          customer_name: freshProfile.full_name || 'Cliente',
          customer_email: freshProfile.email || user.email,
          customer_phone: freshProfile.phone || '',
          customer_cpf: freshProfile.cpf || '',
          shipping_address: addressString,
          total_amount: 0,
          shipping_cost: 0,
          shipping_method: freshProfile.street ? 'Entrega em Casa' : 'Retirada em PDV',
          status: 'Pago',
          payment_method: 'Resgate de Créditos'
        }]);
        
      if (orderError) throw orderError;
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert([{
          order_id: orderId,
          organization_id: ORGANIZATION_ID,
          product_id: selectedRewardToRedeem.id,
          product_name: `[Resgate] ${selectedRewardToRedeem.name}`,
          quantity: 1,
          unit_price: 0
        }]);
        
      if (itemError) throw itemError;
      
      toast.success(`Resgate de "${selectedRewardToRedeem.name}" efetuado com sucesso!`);
      setClientBalance(newBalance);
      setSelectedRewardToRedeem(null);
      fetchOrders();
    } catch (err) {
      console.error('Error redeeming reward:', err);
      toast.error('Erro ao efetuar resgate. Tente novamente.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter orders to identify active or paused club subscriptions
  const activeSubscriptions = orders.filter(order => {
    const statusLower = order.status?.toLowerCase() || '';
    const isValidStatus = ['pago', 'paid', 'completed', 'aprovado', 'enviado', 'shipped', 'entregue', 'pausado'].includes(statusLower);
    const hasSubProduct = order.order_items?.some((item: any) => 
      item.product_name?.toLowerCase().includes('clube') || 
      item.product_name?.toLowerCase().includes('assinatura')
    );
    return isValidStatus && hasSubProduct;
  });


  return (
    <AffiliateLayout>
      <div className="max-w-4xl mx-auto pb-20 font-sans">
        
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-display-lg text-white font-bold">Área do Cliente</h1>
            <p className="text-on-surface-variant font-medium mt-1">
              Bem-vindo(a), {profile?.full_name || 'Cliente'}! Acompanhe suas assinaturas e pedidos de defumados.
            </p>
          </div>
          
          {/* Wallet Credits Card */}
          <div className="bg-gradient-to-br from-[#1c1c1c] to-[#0d0d0d] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl min-w-[240px]">
            <div className="w-12 h-12 rounded-xl bg-[#a61d24]/10 border border-[#a61d24]/20 flex items-center justify-center text-[#a61d24]">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-1.5">Créditos de Compras</p>
              <h3 className="text-xl font-bold text-white leading-none">
                {formatCurrency(clientBalance)}
              </h3>
            </div>
          </div>
        </header>

        {/* Tab Sub-Navigation */}
        <div className="flex flex-wrap gap-2 bg-[#0d0d0d] p-1.5 rounded-2xl mb-8 border border-white/5">
          <button
            onClick={() => setActiveSubTab('compras')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'compras'
                ? 'bg-[#a61d24]/10 text-white border border-[#a61d24]/20'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Compras
          </button>
          <button
            onClick={() => setActiveSubTab('assinaturas')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'assinaturas'
                ? 'bg-[#a61d24]/10 text-white border border-[#a61d24]/20'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Assinaturas
          </button>
          <button
            onClick={() => setActiveSubTab('pagamentos')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'pagamentos'
                ? 'bg-[#a61d24]/10 text-white border border-[#a61d24]/20'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Pagamentos
          </button>
          <button
            onClick={() => setActiveSubTab('servicos')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'servicos'
                ? 'bg-[#a61d24]/10 text-white border border-[#a61d24]/20'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            Serviços
          </button>
          <button
            onClick={() => setActiveSubTab('documentos')}
            className={`flex-grow py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-[130px] ${
              activeSubTab === 'documentos'
                ? 'bg-[#a61d24]/10 text-white border border-[#a61d24]/20'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentos
          </button>
        </div>

        {/* Tab Contents */}
        <ErrorBoundary>
          <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* 1. COMPRAS TAB */}
          {activeSubTab === 'compras' && (
            <div className="bg-[#0d0d0d] rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden">
              <div className="p-8 md:p-10 border-b border-white/5">
                <h3 className="text-xl font-display-lg text-white font-bold">Histórico de Compras</h3>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest mt-1">
                  Pedidos e transações registrados em seu nome
                </p>
              </div>

              {loadingOrders ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#a61d24] mx-auto mb-4"></div>
                  <p className="text-on-surface-variant font-bold text-xs uppercase">Carregando compras...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-black/30 text-left border-b border-white/5">
                        <th className="py-5 px-8 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Pedido / Data</th>
                        <th className="py-5 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Itens Adquiridos</th>
                        <th className="py-5 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Logística / Pagamento</th>
                        <th className="py-5 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Valor Total</th>
                        <th className="py-5 px-8 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((order) => {
                        const statusLower = order.status?.toLowerCase() || '';
                        const isPaid = ['pago', 'paid', 'completed', 'aprovado', 'enviado', 'shipped', 'entregue'].includes(statusLower);
                        const isPending = ['pendente', 'pending', 'aguardando'].includes(statusLower);
                        
                        return (
                          <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-6 px-8">
                              <span className="font-bold text-white block text-sm">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-on-surface-variant font-semibold block mt-1 uppercase">
                                {formatDate(order.created_at)}
                              </span>
                            </td>
                            <td className="py-6 px-4">
                              {order.order_items && order.order_items.length > 0 ? (
                                <div className="space-y-1">
                                  {order.order_items.map((item: any) => (
                                    <div key={item.id} className="text-xs font-semibold text-white/90">
                                      {item.product_name} <span className="text-on-surface-variant text-[10px]">x{item.quantity || 1}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-on-surface-variant italic">Itens não detalhados</span>
                              )}
                            </td>
                            <td className="py-6 px-4">
                              <span className="text-xs font-bold text-white/80 block">
                                {order.shipping_method || 'Entrega'}
                              </span>
                              <span className="text-[10px] text-[#a61d24] font-semibold block uppercase">
                                {order.payment_method || 'Pix/Cartão'}
                              </span>
                            </td>
                            <td className="py-6 px-4 text-right font-bold text-white text-sm">
                              {formatCurrency(order.total_amount)}
                            </td>
                            <td className="py-6 px-8 text-right">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isPaid ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                                isPending ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                                'bg-red-950/40 text-red-400 border border-red-900/30'
                              }`}>
                                {isPaid ? <CheckCircle2 className="w-3 h-3" /> :
                                 isPending ? <Clock className="w-3 h-3" /> :
                                 <XCircle className="w-3 h-3" />}
                                {order.status === 'pending' || order.status === 'Pendente' ? 'Pendente' :
                                 order.status === 'shipped' || order.status === 'Enviado' ? 'Enviado' :
                                 order.status === 'completed' || order.status === 'Pago' || order.status === 'Entregue' ? 'Concluído' : 'Cancelado'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-on-surface-variant opacity-45" />
                  </div>
                  <p className="font-bold text-white mb-2">Você ainda não realizou compras.</p>
                  <p className="text-on-surface-variant text-xs max-w-sm mx-auto mb-6">
                    Aproveite as vagas do clube ou confira nossos kits disponíveis de charcutaria artesanal.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[#a61d24] hover:bg-[#8d181e] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all wine-glow"
                  >
                    Ir para a Home
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. ASSINATURAS TAB */}
          {activeSubTab === 'assinaturas' && (
            <div className="bg-[#0d0d0d] rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden">
              <div className="p-8 md:p-10 border-b border-white/5">
                <h3 className="text-xl font-display-lg text-white font-bold">Minhas Assinaturas</h3>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest mt-1">
                  Planos e status de retirada de produtos ativos
                </p>
              </div>

              {loadingOrders ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#a61d24] mx-auto mb-4"></div>
                  <p className="text-on-surface-variant font-bold text-xs uppercase">Carregando assinaturas...</p>
                </div>
                            ) : activeSubscriptions.length > 0 ? (
                <div className="p-8 space-y-8">
                  {activeSubscriptions.map((subOrder) => {
                    const item = subOrder.order_items?.[0] || { product_name: 'Clube Ponta D\'Faca' };
                    const isPickup = subOrder.shipping_method === 'Retirada em PDV';
                    const statusLower = subOrder.status?.toLowerCase() || '';

                    // Logistics progress step calculation
                    // Pedido Realizado -> Pagamento Aprovado -> Em Produção (Cura) -> Saiu p/ Entrega ou Pronto p/ Retirada -> Entregue
                    let activeStep = 1; // Pedido Realizado
                    if (statusLower === 'pago' || statusLower === 'completed' || statusLower === 'aprovado') {
                      activeStep = 2; // Em Produção (Paid/Preparing)
                    } else if (statusLower === 'enviado' || statusLower === 'shipped') {
                      activeStep = 3; // Saiu para entrega / Pronto para retirada
                    } else if (statusLower === 'entregue') {
                      activeStep = 4; // Entregue / Retirado
                    }

                    return (
                      <div key={subOrder.id} className="bg-[#121212] border border-white/5 rounded-3xl p-6 relative overflow-hidden group space-y-6">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-[#a61d24]/5 rounded-full -mr-5 -mt-5 transition-transform group-hover:scale-110"></div>
                        
                        {/* Summary Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                              statusLower === 'pausado'
                                ? 'bg-amber-950/40 border border-amber-900/30 text-amber-400 animate-pulse'
                                : 'bg-[#a61d24]/10 border border-[#a61d24]/20 text-[#a61d24]'
                            }`}>
                              {statusLower === 'pausado' ? 'Assinatura Pausada' : 'Assinatura Ativa'}
                            </span>
                            <h4 className="text-lg font-display-lg text-white font-bold mt-2">
                              {item.product_name}
                            </h4>
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">
                              Pedido: #{subOrder.id.slice(0, 8).toUpperCase()} • Contratado em: {formatDate(subOrder.created_at)}
                            </p>
                          </div>
                          
                          <div className="text-right sm:items-end flex flex-col gap-1">
                            <span className="text-sm font-bold text-white">{formatCurrency(subOrder.total_amount)}</span>
                            <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">Ciclo Mensal</span>
                          </div>
                        </div>

                        {/* Logistics Tracker Stepper */}
                        <div className="border-t border-white/5 pt-6">
                          <h5 className="text-[10px] font-bold text-[#a61d24] uppercase tracking-widest mb-4">Etapa da Produção &amp; Entrega</h5>
                          {statusLower === 'pausado' ? (
                            <div className="bg-amber-950/20 border border-amber-900/20 rounded-2xl p-4 flex gap-3 items-center">
                              <Info className="w-5 h-5 text-amber-400 shrink-0" />
                              <p className="text-xs text-amber-300 font-semibold leading-relaxed">
                                Esta assinatura está suspensa temporariamente. Reative-a no painel abaixo para voltar a receber os lotes mensais de cura e entrega.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2 relative">
                              {/* Line connecting steps */}
                              <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10 z-0">
                                <div 
                                  className="h-full bg-[#a61d24] transition-all duration-700" 
                                  style={{ width: `${(activeStep - 1) * 33.3}%` }}
                                ></div>
                              </div>
                              
                              {[
                                { label: 'Realizado', desc: 'Aguardando' },
                                { label: 'Cura Lenta', desc: 'Em Produção' },
                                { label: isPickup ? 'Pronto p/ Retirada' : 'Em Rota', desc: isPickup ? 'No Empório' : 'Saiu para entrega' },
                                { label: isPickup ? 'Retirado' : 'Entregue', desc: 'Concluído' }
                              ].map((step, idx) => {
                                const stepNum = idx + 1;
                                const isCompleted = activeStep >= stepNum;
                                const isCurrent = activeStep === stepNum;
                                return (
                                  <div key={idx} className="flex flex-col items-center text-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                      isCompleted 
                                        ? 'bg-black border-[#a61d24] text-[#a61d24] shadow-[0_0_8px_rgba(166,29,36,0.3)]' 
                                        : 'bg-[#121212] border-white/10 text-on-surface-variant'
                                    }`}>
                                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                                    </div>
                                    <span className={`text-[10px] font-bold mt-2 ${isCompleted ? 'text-white' : 'text-on-surface-variant'}`}>{step.label}</span>
                                    <span className="text-[8px] text-on-surface-variant/60 font-semibold uppercase tracking-wider">{step.desc}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Delivery Method details & QR code */}
                        <div className="border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          <div className={isPickup ? 'md:col-span-8 space-y-3' : 'md:col-span-12 space-y-3'}>
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-[#a61d24] shrink-0 mt-0.5" />
                              <div>
                                <h5 className="text-xs font-bold text-white uppercase tracking-wider">Modo de Recebimento</h5>
                                <p className="text-sm font-medium text-white/90 mt-1">{subOrder.shipping_method}</p>
                                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">{subOrder.shipping_address}</p>
                              </div>
                            </div>
                            
                            {isPickup && statusLower !== 'pausado' && (
                              <div className="bg-[#a61d24]/5 border border-[#a61d24]/10 rounded-2xl p-4 flex gap-3 items-start mt-2">
                                <Info className="w-5 h-5 text-[#a61d24] shrink-0 mt-0.5" />
                                <p className="text-xs text-[#e5e2e1] leading-relaxed">
                                  Apresente o QR Code ou Token ao atendente do Empório no momento da retirada para efetuar a validação e baixa física do seu combo.
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* QR Code generator for Pickups */}
                          {isPickup && statusLower !== 'pausado' && (
                            <div className="md:col-span-4 flex flex-col items-center bg-black/40 border border-white/5 rounded-3xl p-5 text-center shrink-0">
                              <QrCode className="w-5 h-5 text-[#a61d24] mb-2" />
                              <div className="w-36 h-36 bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center p-2">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${subOrder.id}&color=e5e2e1&bgcolor=0d0d0d`} 
                                  alt="Token QR Code" 
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-3">Token de Retirada</p>
                              <span className="text-xs font-bold text-white mt-1 uppercase tracking-wide">
                                #{subOrder.id.slice(4, 12).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Subscription Actions Control Panel */}
                        <div className="border-t border-white/5 pt-6 flex flex-wrap gap-4 items-center justify-between">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => {
                                setSelectedSubToChangePlan(subOrder);
                                const currentPlanId = item.product_id || 'trimestral';
                                setSelectedNewPlanSlug(currentPlanId);
                              }}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                            >
                              Alterar Plano
                            </button>

                            {statusLower === 'pausado' ? (
                              <button
                                onClick={() => setSelectedSubToReactivate(subOrder)}
                                className="px-4 py-2 bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-900/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                              >
                                Reativar Assinatura
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedSubToPause(subOrder)}
                                className="px-4 py-2 bg-amber-900/20 hover:bg-amber-900/30 text-amber-400 border border-amber-900/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                              >
                                Pausar Assinatura
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => setSelectedSubToCancel(subOrder)}
                            className="text-xs font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider"
                          >
                            Cancelar Assinatura
                          </button>
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-on-surface-variant opacity-45" />
                  </div>
                  <p className="font-bold text-white mb-2">Sem assinaturas ativas.</p>
                  <p className="text-on-surface-variant text-xs max-w-sm mx-auto mb-6">
                    Você ainda não possui nenhuma assinatura ativa ou plano recorrente contratado.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[#a61d24] hover:bg-[#8d181e] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all wine-glow"
                  >
                    Ver Assinaturas Disponíveis
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. PAGAMENTOS TAB */}
          {activeSubTab === 'pagamentos' && (
            <div className="bg-[#0d0d0d] rounded-[2rem] shadow-2xl border border-white/5 p-8 md:p-10">
              <h3 className="text-xl font-display-lg text-white mb-2 font-bold">Meios de Pagamento</h3>
              <p className="text-on-surface-variant font-medium text-sm mb-8 leading-relaxed">
                Toda a transacionalidade do Clube Ponta D'Faca é conduzida através de métodos blindados, garantindo a sua confidencialidade de dados.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
                  <div className="w-10 h-10 bg-red-950/40 rounded-2xl flex items-center justify-center text-[#a61d24] mb-4 shadow-sm border border-[#a61d24]/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Processamento de Cartões</h4>
                  <p className="text-on-surface-variant text-xs font-medium leading-relaxed">
                    Não armazenamos dados críticos do seu cartão de crédito (como número ou código CVV) em nossos servidores.
                    Os pagamentos recorrentes de assinatura são processados diretamente pelo Mercado Pago em ambiente criptografado PCI-DSS.
                  </p>
                </div>

                <div className="bg-[#121212] border border-white/5 rounded-3xl p-6">
                  <div className="w-10 h-10 bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-sm border border-emerald-900/20">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Pix Recorrente</h4>
                  <p className="text-on-surface-variant text-xs font-medium leading-relaxed">
                    As compras e renovações geradas via Pix possuem confirmação automática instantânea. O sistema atualiza o status de produção e libera as entregas em lote mensal do clube de imediato.
                  </p>
                </div>
              </div>

              <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex gap-4 items-start">
                <div className="p-2 bg-black/40 border border-white/5 rounded-xl text-amber-500 shadow-sm shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">Como atualizar seu meio de pagamento principal?</h4>
                  <p className="text-on-surface-variant text-xs font-medium leading-relaxed">
                    Para trocar o cartão cadastrado ou escolher outro meio de renovação, você poderá fazer isso diretamente no momento da renovação mensal ou entrando em contato com nossa equipe administrativa pelo chat do suporte.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. SERVICOS TAB */}
          {activeSubTab === 'servicos' && (
            <div className="bg-[#0d0d0d] rounded-[2rem] shadow-2xl border border-white/5 p-8 md:p-10">
              <h3 className="text-xl font-display-lg text-white mb-2 font-bold">Serviços Integrados</h3>
              <p className="text-on-surface-variant font-medium text-sm mb-8">
                Explore os canais de suporte e vantagens de indicação do Clube.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Servico 1 */}
                <div className="border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-white/10 transition-all bg-[#121212]">
                  <div>
                    <h4 className="text-base font-bold text-white mb-2">Loja de Defumados</h4>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-wider mb-4">Combos Extras</p>
                    <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
                      Assinantes ativos possuem descontos e cashbacks automáticos em todas as compras avulsas e combos extras de carne.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-[#a61d24] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#8d181e] transition-all wine-glow"
                  >
                    Acessar Loja
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                </div>

                {/* Servico 2 */}
                <div className="border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-white/10 transition-all bg-[#121212]">
                  <div>
                    <h4 className="text-base font-bold text-white mb-2">Suporte por WhatsApp</h4>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-wider mb-4">Atendimento Premium</p>
                    <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
                      Fale diretamente com nosso Mestre Defumador para sugerir novos kits de cura ou tirar dúvidas de retirada.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/5541996285667"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-black/40 border border-white/10 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-center"
                  >
                    WhatsApp
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#a61d24]"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                  </a>
                </div>

                {/* Servico 3 */}
                {profile?.role === 'client' && (
                  <div className="border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:shadow-2xl transition-all bg-[#121212]">
                    <div>
                      <h4 className="text-base font-bold mb-2 text-white">Programa de Afiliados</h4>
                      <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider mb-4">Ganhos em Rede</p>
                      <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
                        Indique novos membros para assinar o Clube Ponta D'Faca e ganhe comissão recorrente em 3 níveis.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/register?type=affiliate')}
                      className="w-full bg-emerald-900/20 text-emerald-400 border border-emerald-900/30 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-800/30 transition-all"
                    >
                      Seja um Afiliado
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Catálogo de Prêmios */}
              <div className="mt-12 pt-10 border-t border-white/5">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-display-lg text-white font-bold">Catálogo de Prêmios</h3>
                    <p className="text-on-surface-variant text-xs mt-1">
                      Troque seus créditos acumulados por produtos e brindes exclusivos Ponta D'Faca.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-4 py-2 border border-white/5 rounded-xl self-start md:self-auto">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Seu Saldo:</span>
                    <span className="text-sm font-bold text-emerald-400">{formatCurrency(clientBalance)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {rewardsList.map((reward) => {
                    const canRedeem = clientBalance >= reward.cost;
                    return (
                      <div key={reward.id} className="bg-[#121212] border border-white/5 rounded-3xl p-5 flex flex-col justify-between hover:border-white/10 transition-all group">
                        <div className="space-y-4">
                          <div className="aspect-square w-full rounded-2xl bg-black overflow-hidden border border-white/5">
                            <img 
                              src={reward.image} 
                              alt={reward.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#a61d24]/10 border border-[#a61d24]/20 text-[#a61d24] mb-2">
                              {formatCurrency(reward.cost)}
                            </span>
                            <h4 className="text-sm font-bold text-white mb-1.5">{reward.name}</h4>
                            <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-2">
                              {reward.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedRewardToRedeem(reward)}
                          disabled={!canRedeem}
                          className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider mt-5 transition-all flex items-center justify-center gap-2 ${
                            canRedeem
                              ? 'bg-[#a61d24] text-white hover:bg-[#8d181e] wine-glow shadow-sm'
                              : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                          }`}
                        >
                          {canRedeem ? 'Resgatar Prêmio' : 'Créditos Insuficientes'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* 5. DOCUMENTOS TAB */}
          {activeSubTab === 'documentos' && (
            <div className="bg-[#0d0d0d] rounded-[2rem] shadow-2xl border border-white/5 p-8 md:p-10">
              <h3 className="text-xl font-display-lg text-white mb-2 font-bold">Documentos e Contratos</h3>
              <p className="text-on-surface-variant font-medium text-sm mb-8">
                Baixe cópias digitais autenticadas de contratos e termos de uso da Ponta D'Faca.
              </p>

              <div className="divide-y divide-white/5">
                {/* Documento 1 */}
                <div className="py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-center text-on-surface-variant group-hover:text-[#a61d24] transition-colors shadow-sm shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Contrato de Adesão ao Clube Ponta D'Faca</h4>
                      <p className="text-on-surface-variant text-xs font-medium mt-1">Regras de recorrência, prazos de cura, logística de entrega e retirada física</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadMock('Contrato de Adesão ao Clube Ponta D\'Faca')}
                    className="flex items-center gap-2 px-5 py-3 bg-[#121212] border border-white/5 hover:bg-[#a61d24] text-white hover:border-[#a61d24] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Baixar (142 KB)
                  </button>
                </div>

                {/* Documento 2 */}
                <div className="py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-center text-on-surface-variant group-hover:text-[#a61d24] transition-colors shadow-sm shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Termos de Uso e Política de Privacidade (LGPD)</h4>
                      <p className="text-on-surface-variant text-xs font-medium mt-1">Conformidade legal sobre tratamento de dados e segurança do usuário</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadMock('Termos de Uso e Política de Privacidade (LGPD)')}
                    className="flex items-center gap-2 px-5 py-3 bg-[#121212] border border-white/5 hover:bg-[#a61d24] text-white hover:border-[#a61d24] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Baixar (76 KB)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
        </ErrorBoundary>

        {/* Modal: Pausar Assinatura */}
        {selectedSubToPause && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#a61d24] to-transparent"></div>
              
              <h3 className="text-xl font-display-lg text-white font-bold mb-2">Pausar Assinatura?</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
                Você tem certeza que deseja pausar sua assinatura do Clube Ponta D'Faca? Suas entregas mensais serão suspensas temporariamente até que você a reative no painel.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedSubToPause(null)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handlePauseSubscription}
                  disabled={isActionLoading}
                  className="px-5 py-3 bg-amber-900/20 hover:bg-amber-900/30 text-amber-400 border border-amber-900/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  {isActionLoading && <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-amber-400"></div>}
                  Confirmar Pausa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reativar Assinatura */}
        {selectedSubToReactivate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
              
              <h3 className="text-xl font-display-lg text-white font-bold mb-2">Reativar Assinatura?</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
                Deseja reativar sua assinatura agora? O ciclo mensal de produção e entrega dos lotes de cura será restabelecido.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedSubToReactivate(null)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReactivateSubscription}
                  disabled={isActionLoading}
                  className="px-5 py-3 bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-900/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  {isActionLoading && <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-emerald-400"></div>}
                  Reativar Clube
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cancelar Assinatura */}
        {selectedSubToCancel && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
              
              <h3 className="text-xl font-display-lg text-red-500 font-bold mb-2">Cancelar Assinatura?</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
                <strong>Atenção:</strong> O cancelamento é definitivo. Você perderá sua vaga reservada no Clube Ponta D'Faca e seus benefícios recorrentes. Para assinar novamente futuramente, poderá ser necessário entrar na fila de espera.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedSubToCancel(null)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isActionLoading}
                  className="px-5 py-3 bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  {isActionLoading && <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-red-400"></div>}
                  Cancelar Definitivamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Alterar Plano */}
        {selectedSubToChangePlan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] max-w-lg w-full p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#a61d24] to-transparent"></div>
              
              <h3 className="text-xl font-display-lg text-white font-bold mb-2">Alterar Plano de Assinatura</h3>
              <p className="text-on-surface-variant text-xs mb-6">
                Selecione o novo plano recorrente. A alteração será refletida no valor do seu próximo faturamento.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { slug: 'trimestral', name: "Clube Ponta D'Faca - Trimestral", price: 280, desc: "Cobrado a cada 3 meses, ideal para experimentar." },
                  { slug: 'semestral', name: "Clube Ponta D'Faca - Semestral", price: 250, desc: "Custo-benefício equilibrado com cura semestral." },
                  { slug: 'anual', name: "Clube Ponta D'Faca - Anual", price: 230, desc: "Nosso melhor plano, máxima economia e prioridade de lote.", highlight: true }
                ].map((plan) => {
                  const isSelected = selectedNewPlanSlug === plan.slug;
                  return (
                    <div 
                      key={plan.slug}
                      onClick={() => setSelectedNewPlanSlug(plan.slug)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                        isSelected 
                          ? 'bg-[#a61d24]/5 border-[#a61d24] shadow-[0_0_12px_rgba(166,29,36,0.15)]' 
                          : 'bg-[#121212] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{plan.name}</span>
                          {plan.highlight && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#a61d24] text-white uppercase tracking-wider">Melhor Valor</span>
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">{plan.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-white">{formatCurrency(plan.price)}</span>
                        <span className="text-[9px] text-on-surface-variant block uppercase">/mês</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedSubToChangePlan(null)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePlanChange}
                  disabled={isActionLoading}
                  className="px-5 py-3 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 wine-glow"
                >
                  {isActionLoading && <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-white"></div>}
                  Confirmar Plano
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Resgatar Prêmio */}
        {selectedRewardToRedeem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#a61d24] to-transparent"></div>
              
              <h3 className="text-xl font-display-lg text-white font-bold mb-2">Confirmar Resgate</h3>
              
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex gap-4 items-center my-5">
                <img 
                  src={selectedRewardToRedeem.image} 
                  alt={selectedRewardToRedeem.name} 
                  className="w-16 h-16 object-cover rounded-xl border border-white/5 bg-black"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedRewardToRedeem.name}</h4>
                  <span className="text-xs font-bold text-emerald-400 block mt-1">{formatCurrency(selectedRewardToRedeem.cost)} em créditos</span>
                </div>
              </div>

              <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
                Este resgate gerará um pedido com valor zerado no sistema e debitará o custo correspondente do seu saldo de créditos. 
                {profile?.street ? (
                  <span> O prêmio será enviado para: <strong className="text-white">{profile.street}, nº {profile.number}</strong>.</span>
                ) : (
                  <span> O prêmio ficará disponível para retirada no Empório Parceiro de sua escolha.</span>
                )}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedRewardToRedeem(null)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRedeemReward}
                  disabled={isActionLoading}
                  className="px-5 py-3 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 wine-glow"
                >
                  {isActionLoading && <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-white"></div>}
                  Confirmar Resgate
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AffiliateLayout>
  );
};

export default ClientDashboard;
