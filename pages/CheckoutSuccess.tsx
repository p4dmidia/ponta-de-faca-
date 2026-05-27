
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck,
  QrCode,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const CheckoutSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Determinar o ID do pedido (limpo, via params)
  const effectiveOrderId = orderId;

  useEffect(() => {
    if (!effectiveOrderId) {
        setLoading(false);
        return;
    };

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', effectiveOrderId)
          .single();

        if (error) throw error;
        
        // Merge with session state if available for better experience
        const state = location.state as any;
        if (state && data) {
          data.pix_qr_code = state.qrCode || data.pix_qr_code;
          data.pix_qr_code_base64 = state.qrCodeBase64 || data.pix_qr_code_base64;
          data.pix_copy_paste = state.copyPaste || data.pix_copy_paste;
        }
        
        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError('Não foi possível carregar os detalhes do pedido.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (data) {
            setUserRole(data.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    };

    fetchOrder();
    fetchUserRole();

    // Inscrição Realtime para mudanças no status do pedido
    const subscription = supabase
      .channel(`order_status_${effectiveOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${effectiveOrderId}`
        },
        (payload) => {
          console.log('Order updated in realtime:', payload.new);
          setOrder(payload.new);
          if (payload.new.status === 'Pago') {
            toast.success('Pagamento confirmado com sucesso!', {
              icon: '🚀',
              duration: 5000
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [effectiveOrderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#a61d24] animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">Ops! Algo deu errado</h2>
        <p className="text-on-surface-variant mb-8">{error || 'Pedido não encontrado.'}</p>
        <Link to="/shop" className="bg-[#a61d24] hover:bg-[#8d181e] text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest wine-glow">
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  const isPaid = order.status === 'Pago' || order.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e2e1] font-sans pb-20 relative overflow-hidden">
      {/* Premium Header Decoration */}
      <div className="h-64 bg-black w-full absolute top-0 left-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#a61d24_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <div className="container mx-auto px-4 pt-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Main Success/Pending Card */}
          <div className="bg-[#0d0d0d] rounded-[3rem] shadow-2xl overflow-hidden border border-white/5">
            <div className="p-8 md:p-12 text-center">
              <div className="mb-8 flex justify-center">
                {isPaid ? (
                  <div className="w-24 h-24 bg-green-950/40 border border-green-900/30 rounded-full flex items-center justify-center text-green-400 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-amber-950/40 border border-amber-900/30 rounded-full flex items-center justify-center relative text-[#a61d24]">
                    <Clock className="w-12 h-12 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-[#a61d24] border-t-transparent animate-spin"></div>
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-display-lg text-white font-bold mb-4">
                {isPaid ? 'Pagamento Aprovado!' : 'Aguardando Pagamento'}
              </h1>
              <p className="text-on-surface-variant text-lg font-medium max-w-md mx-auto">
                {isPaid 
                  ? (userRole === 'client' 
                      ? 'Parabéns! Seu plano foi ativado com sucesso. Faça o login abaixo para acessar o painel e sua carteirinha.' 
                      : 'Parabéns! Sua compra foi confirmada com sucesso e já estamos processando seu pedido.')
                  : 'Sua reserva foi garantida! Agora, basta concluir o pagamento para liberar seu pedido.'}
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="px-4 py-2 bg-[#121212] rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border border-white/5">
                  Pedido: #{order.id.replace(/^#/, '')}
                </span>
                <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  isPaid ? 'bg-green-950/40 text-green-400 border-green-900/20' : 'bg-amber-950/40 text-amber-400 border-amber-900/20'
                }`}>
                  Status: {order.status}
                </span>
              </div>
            </div>

            {/* PIX Section (Only if Pending and PIX) */}
            {!isPaid && order.payment_method?.toLowerCase().includes('pix') && (
              <div className="bg-black/40 border-t border-white/5 p-8 md:p-12">
                <div className="bg-[#121212] rounded-[2rem] p-8 shadow-sm border border-white/5">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    {order.pix_qr_code_base64 ? (
                      <div className="flex-shrink-0 bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner text-center">
                        <img 
                          src={`data:image/jpeg;base64,${order.pix_qr_code_base64}`} 
                          alt="QR Code PIX" 
                          className="w-48 h-48"
                        />
                        <div className="mt-3 text-center">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Escaneie o QR Code</span>
                        </div>
                      </div>
                    ) : (
                       <div className="w-48 h-48 bg-black/40 rounded-2xl flex items-center justify-center text-on-surface-variant border border-dashed border-white/5">
                         <QrCode className="w-12 h-12" />
                       </div>
                    )}

                    <div className="flex-grow space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Copia e Cola</h3>
                        <div className="flex gap-2">
                          <input 
                            readOnly 
                            value={order.pix_copy_paste || ''} 
                            className="bg-[#050505] border border-white/5 rounded-xl p-4 text-xs font-mono flex-grow outline-none truncate text-white"
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(order.pix_copy_paste || '');
                              toast.success('Chave PIX copiada!');
                            }}
                            className="bg-[#a61d24] text-white p-4 rounded-xl hover:bg-[#8d181e] transition-all wine-glow"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-amber-950/40 border border-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400 font-bold">
                            <span>!</span>
                          </div>
                          <p className="text-[11px] font-bold text-on-surface-variant leading-relaxed uppercase tracking-wider">
                            Após o pagamento, o sistema identificará automaticamente em até 2 minutos e esta tela se atualizará.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps / Info */}
            <div className="p-8 md:p-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#a61d24]" />
                  Informações úteis
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-on-surface-variant text-sm font-medium">
                    <div className="w-2 h-2 bg-[#a61d24] rounded-full"></div>
                    Um recibo foi enviado para seu e-mail
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant text-sm font-medium">
                    <div className="w-2 h-2 bg-[#a61d24] rounded-full"></div>
                    Acompanhe o status no seu painel
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant text-sm font-medium">
                    <div className="w-2 h-2 bg-[#a61d24] rounded-full"></div>
                    Suporte VIP liberado para seu pedido
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 justify-center">
                {userRole === 'client' ? (
                  <Link 
                    to="/login" 
                    className="w-full bg-[#a61d24] text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-center shadow-xl shadow-[#a61d24]/10 flex items-center justify-center gap-2 hover:-translate-y-1 transition-all wine-glow"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Fazer Login no Painel
                  </Link>
                ) : (
                  <Link 
                    to="/dashboard" 
                    className="w-full bg-black/40 border border-white/10 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-center shadow-xl flex items-center justify-center gap-2 hover:-translate-y-1 transition-all hover:bg-white/5"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#a61d24]" />
                    Ir para o Virtual Office
                  </Link>
                )}
                <Link 
                  to="/shop" 
                  className="w-full bg-[#0d0d0d] text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-center border border-white/5 flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                >
                  Continuar Comprando
                  <ArrowRight className="w-4 h-4 text-[#a61d24]" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-on-surface-variant/40 font-bold text-[10px] uppercase tracking-[0.3em]">
              Ponta D'Faca Charcutaria • Checkout Seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
