import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    ShoppingCart,
    CreditCard,
    Truck,
    Store,
    Lock,
    CheckCircle2,
    AlertCircle,
    FileText,
    ArrowRight,
    ChevronLeft,
    Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/AuthContext';
import { ORGANIZATION_ID } from '../lib/config';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const cityFees: { [key: string]: number } = {
    'Belo Horizonte': 15.00,
    'Nova Lima': 20.00,
    'Contagem': 20.00,
    'Betim': 25.00,
    'Sete Lagoas': 30.00,
    'Divinópolis': 30.00,
    'Juiz de Fora': 35.00,
    'Uberlândia': 40.00,
    'Outra Cidade - MG': 35.00,
    'Outros Estados': 49.00
};

const localPdvs = [
    { id: 'local-1', nome_fantasia: 'Empório Ponta D\'Faca - Savassi', endereco: 'Rua Sergipe, 1200 - Savassi, Belo Horizonte - MG', billing_model: 'centralized' },
    { id: 'local-2', nome_fantasia: 'Charcutaria de Minas - Lourdes', endereco: 'Av. Olegário Maciel, 1600 - Lourdes, Belo Horizonte - MG', billing_model: 'consigned' },
    { id: 'local-3', nome_fantasia: 'Armazém Gourmet - Vila da Serra', endereco: 'Alameda da Serra, 450 - Vila da Serra, Nova Lima - MG', billing_model: 'consigned' }
];

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { cart, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix'>('credit');
    const [isLoading, setIsLoading] = useState(false);
    
    // Logistics state
    const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('pickup');
    const [pdvs, setPdvs] = useState<any[]>([]);
    const [selectedPdvId, setSelectedPdvId] = useState<string>('');
    const [shippingFee, setShippingFee] = useState<number>(0);
    const [isLoadingPdvs, setIsLoadingPdvs] = useState<boolean>(false);

    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        address: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: 'MG'
    });

    const [isEditingProfile, setIsEditingProfile] = useState(true);

    // Fetch PDVs
    useEffect(() => {
        const fetchPdvs = async () => {
            setIsLoadingPdvs(true);
            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('id, nome_fantasia, endereco, billing_model')
                    .eq('is_active', true)
                    .eq('organization_id', ORGANIZATION_ID);
                
                if (data && !error && data.length > 0) {
                    setPdvs(data);
                    setSelectedPdvId(data[0].id.toString());
                } else {
                    setPdvs([]);
                }
            } catch (err) {
                console.error('Error fetching PDVs:', err);
            } finally {
                setIsLoadingPdvs(false);
            }
        };
        fetchPdvs();
    }, []);

    // Autofill user profile
    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                try {
                    const { data, error } = await supabase
                        .from('affiliates')
                        .select('full_name, email, whatsapp, cpf, cnpj, address, cep, street, number, complement, neighborhood, city, state')
                        .eq('user_id', user.id)
                        .single();

                    if (data) {
                        setCustomerInfo({
                            name: data.full_name || user.user_metadata?.full_name || user.user_metadata?.nome || '',
                            email: data.email || user.email || '',
                            phone: data.whatsapp || '',
                            cpf: data.cpf || data.cnpj || '',
                            address: data.address || '',
                            cep: data.cep || '',
                            street: data.street || '',
                            number: data.number || '',
                            complement: data.complement || '',
                            neighborhood: data.neighborhood || '',
                            city: data.city || '',
                            state: data.state || 'MG'
                        });
                        // If we have at least name and email, consider it identified
                        if (data.full_name || data.email) {
                            setIsEditingProfile(false);
                        }
                    }
                } catch (error) {
                    console.error('Error auto-filling profile:', error);
                }
            };
            fetchProfile();
        }

        // Handle direct buy link or plan parameter
        const params = new URLSearchParams(window.location.search);
        const buyId = params.get('buy') || params.get('plan');
        const varsEncoded = params.get('vars');

        if (buyId) {
            const processDirectBuy = async () => {
                try {
                    // Fallback local products (Ponta D'Faca plans)
                    const localPlans: { [key: string]: any } = {
                        'trimestral': {
                            id: 'trimestral',
                            name: 'Clube Ponta D\'Faca - Trimestral',
                            price: 280.00,
                            description: 'Assinatura Trimestral com seleção mensal premium de defumados artesanais.',
                            category: 'Clube de Assinatura',
                            image_url: '/assets/logo-ponta.png',
                            stock_quantity: 999
                        },
                        'semestral': {
                            id: 'semestral',
                            name: 'Clube Ponta D\'Faca - Semestral',
                            price: 250.00,
                            description: 'Assinatura Semestral com seleção mensal premium de defumados artesanais.',
                            category: 'Clube de Assinatura',
                            image_url: '/assets/logo-ponta.png',
                            stock_quantity: 999
                        },
                        'anual': {
                            id: 'anual',
                            name: 'Clube Ponta D\'Faca - Anual',
                            price: 230.00,
                            description: 'Assinatura Anual com seleção mensal premium de defumados artesanais.',
                            category: 'Clube de Assinatura',
                            image_url: '/assets/logo-ponta.png',
                            stock_quantity: 999
                        }
                    };

                    let product = localPlans[buyId];

                    if (!product) {
                        const { data: dbProduct, error } = await supabase
                            .from('products')
                            .select('*')
                            .eq('id', buyId)
                            .single();
                        
                        if (error || !dbProduct) return;
                        product = dbProduct;
                    }

                    let selectedVars = {};
                    if (varsEncoded) {
                        try {
                            selectedVars = JSON.parse(atob(varsEncoded));
                        } catch (e) {
                            console.error("Error parsing variations", e);
                        }
                    }

                    const images = (product.image_url || product.image || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                    const formattedProduct = {
                        ...product,
                        image: images[0] || '/assets/logo-ponta.png'
                    };

                    addToCart(formattedProduct, selectedVars);
                    
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                    
                    toast.success(`${product.name} adicionado ao carrinho!`, { icon: '🛒' });
                } catch (e) {
                    console.error('Error processing direct buy:', e);
                }
            };
            processDirectBuy();
        }
    }, [user]);

    // Handle city and shipping fee selection
    const handleCityChange = (cityVal: string) => {
        setCustomerInfo(prev => ({ ...prev, city: cityVal }));
        const fee = cityFees[cityVal] || 0;
        setShippingFee(fee);
    };

    const pdvsToRender = pdvs.length > 0 ? pdvs : localPdvs;
    const selectedPdv = pdvsToRender.find(p => p.id.toString() === selectedPdvId) || pdvsToRender[0];

    const subtotal = cartTotal;
    const shipping = deliveryMethod === 'shipping' ? shippingFee : 0;
    const total = subtotal + shipping;

    const handleConfirmOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.cpf) {
            toast.error('Por favor, preencha seus dados de cadastro (Nome, E-mail, Celular e CPF).');
            return;
        }

        // Address validation
        if (deliveryMethod === 'shipping') {
            if (!customerInfo.cep || !customerInfo.street || !customerInfo.number || !customerInfo.neighborhood || !customerInfo.city) {
                toast.error('Por favor, preencha todos os campos do endereço para entrega.');
                return;
            }
        } else {
            if (!selectedPdvId) {
                toast.error('Por favor, selecione um Empório para realizar a retirada do seu combo.');
                return;
            }
        }

        setIsLoading(true);

        try {
            // Setup delivery info variables
            const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const referralCode = Cookies.get('classea_ref');
            
            let fullAddressString = '';
            if (deliveryMethod === 'shipping') {
                fullAddressString = `${customerInfo.street}, nº ${customerInfo.number} ${customerInfo.complement ? '- ' + customerInfo.complement : ''}, ${customerInfo.neighborhood}, ${customerInfo.city} - ${customerInfo.state}, CEP: ${customerInfo.cep}`;
            } else {
                fullAddressString = `Retirada no PDV: ${selectedPdv.nome_fantasia} (ID: ${selectedPdv.id}) - Endereço: ${selectedPdv.endereco}`;
            }

            // 1. Create order in Supabase
            const { error: orderError } = await supabase
                .from('orders')
                .insert([{
                    id: orderId,
                    organization_id: ORGANIZATION_ID,
                    user_id: user?.id,
                    referral_code: referralCode,
                    customer_name: customerInfo.name,
                    customer_email: customerInfo.email,
                    customer_phone: customerInfo.phone,
                    customer_cpf: customerInfo.cpf,
                    shipping_address: fullAddressString,
                    total_amount: total,
                    shipping_cost: shipping,
                    shipping_method: deliveryMethod === 'shipping' ? 'Entrega em Casa' : 'Retirada em PDV',
                    status: 'Pendente',
                    payment_method: paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Pix'
                }]);

            if (orderError) throw orderError;

            // 1.5 Update user profile if logged in
            if (user) {
                await supabase
                    .from('user_profiles')
                    .update({
                        full_name: customerInfo.name,
                        whatsapp: customerInfo.phone,
                        cpf: customerInfo.cpf
                    })
                    .eq('id', user.id);
            }

            // 2. Add items
            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(cart.map(item => ({
                    order_id: orderId,
                    organization_id: ORGANIZATION_ID,
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price
                })));

            if (itemsError) throw itemsError;

            // 3. Process Payment via Edge Function
            console.log('Invoking process-payment with:', { orderId, paymentMethod });
            const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('process-payment', {
                body: { orderId, paymentMethod, customerCpf: customerInfo.cpf }
            });

            if (paymentError) {
                console.error('Edge Function Error Details:', paymentError);
                let detailedMessage = '';
                
                if ((paymentError as any).context?.data) {
                    const errorData = (paymentError as any).context.data;
                    detailedMessage = errorData.error || errorData.message || (typeof errorData === 'string' ? errorData : '');
                }
                
                if (!detailedMessage && paymentError.message) {
                    detailedMessage = paymentError.message;
                }
                
                throw new Error(detailedMessage || 'Erro ao processar pagamento via Mercado Pago.');
            }

            if (paymentResult && paymentResult.error) {
                throw new Error(paymentResult.message || 'Erro ao processar pagamento.');
            }

            if (paymentMethod === 'pix') {
                if (!paymentResult.ticket_url) {
                    throw new Error('Erro ao gerar link do PIX. Tente novamente.');
                }
                clearCart();
                window.location.href = paymentResult.ticket_url;
                toast.success('Redirecionando para o pagamento...');
            } else {
                if (!paymentResult.init_point) {
                    throw new Error('Link de pagamento não gerado. Verifique os dados do cartão.');
                }
                clearCart();
                window.location.href = paymentResult.init_point;
            }

        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error('Erro ao processar pedido: ' + (error.message || 'Tente novamente.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-[#050505] text-[#e5e2e1] min-h-screen font-sans pb-32">
            {/* Simple Header */}
            <header className="bg-black border-b border-white/5 py-6">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-[#e5e2e1] font-bold text-sm hover:text-[#a61d24] transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        VOLTAR PARA HOME
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-1">Checkout Seguro</p>
                            <p className="text-sm font-bold text-white">CLUBE PONTA D'FACA</p>
                        </div>
                        <ShieldCheck className="w-8 h-8 text-[#a61d24]" />
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">

                    {/* Left: Cart & Info */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Cart Summary */}
                        <div className="bg-[#0d0d0d] rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/5">
                            <h3 className="text-xl font-display-lg text-white mb-8 flex items-center gap-3">
                                <ShoppingCart className="w-6 h-6 text-[#a61d24]" />
                                Seu Carrinho
                            </h3>
                            <div className="space-y-6">
                                {cart.length > 0 ? cart.map((item, idx) => (
                                    <div key={`${item.id}-${JSON.stringify(item.selectedVariations)}`} className="flex justify-between items-center border-b border-white/5 pb-6 last:border-0 last:pb-0">
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 bg-[#121212] border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center text-[#e5e2e1]">
                                                {(item.image || (item as any).display_image || (item as any).image_url) ? (
                                                    <img 
                                                        src={(item.image || (item as any).display_image || (item as any).image_url).split(',')[0].trim()} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <ShoppingCart className="w-8 h-8 opacity-45" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white leading-tight line-clamp-1">{item.name}</h4>
                                                <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{item.category}</p>
                                                
                                                <div className="flex items-center gap-3 mt-3">
                                                    <div className="flex items-center bg-[#121212] rounded-lg p-1 border border-white/5">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.selectedVariations)}
                                                            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariations)}
                                                            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.id, item.selectedVariations)}
                                                        className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-white">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-on-surface-variant font-bold">Seu carrinho está vazio.</p>
                                        <Link to="/" className="text-[#a61d24] font-bold text-xs uppercase mt-4 inline-block tracking-widest hover:underline">Ir para a Home</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-[#0d0d0d] rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-display-lg text-white flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-[#a61d24]" />
                                    Dados de Cadastro
                                </h3>
                                {user && !isEditingProfile && (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-[10px] font-bold text-white uppercase tracking-widest bg-[#a61d24]/10 border border-[#a61d24]/20 px-4 py-2 rounded-xl hover:bg-[#a61d24]/20 transition-all"
                                    >
                                        Alterar Dados
                                    </button>
                                )}
                            </div>

                            {user && !isEditingProfile ? (
                                <div className="bg-[#121212] rounded-2xl p-6 border border-white/5 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center text-[#a61d24] shadow-sm">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] leading-none mb-1">Conta Identificada</p>
                                            <p className="text-lg font-bold text-white">{customerInfo.name}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">CPF / CNPJ</p>
                                            <p className="text-sm font-bold text-white">{customerInfo.cpf || 'Não informado'}</p>
                                        </div>
                                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Contato</p>
                                            <p className="text-sm font-bold text-white">{customerInfo.phone || customerInfo.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="Seu nome"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">E-mail</label>
                                        <input
                                            type="email"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="seu@email.com"
                                            value={customerInfo.email}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Telefone / WhatsApp</label>
                                        <input
                                            type="tel"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="(00) 00000-0000"
                                            value={customerInfo.phone}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">CPF (Pessoa Física)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="000.000.000-00"
                                            value={customerInfo.cpf}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, cpf: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logistics Selection */}
                        <div className="bg-[#0d0d0d] rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/5">
                            <h3 className="text-xl font-display-lg text-white mb-8 flex items-center gap-3">
                                <Truck className="w-6 h-6 text-[#a61d24]" />
                                Opção de Entrega
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => setDeliveryMethod('pickup')}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${deliveryMethod === 'pickup' ? 'border-[#a61d24] bg-[#a61d24]/5 text-white' : 'border-white/5 bg-[#121212] text-on-surface-variant hover:border-white/10'}`}
                                >
                                    <Store className={`w-8 h-8 ${deliveryMethod === 'pickup' ? 'text-[#a61d24]' : 'text-on-surface-variant'}`} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Retirar em Loja (Grátis)</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDeliveryMethod('shipping');
                                        // Default shipping fee if no city is set
                                        if (!customerInfo.city) {
                                            handleCityChange('Belo Horizonte');
                                        } else {
                                            setShippingFee(cityFees[customerInfo.city] || 35.00);
                                        }
                                    }}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${deliveryMethod === 'shipping' ? 'border-[#a61d24] bg-[#a61d24]/5 text-white' : 'border-white/5 bg-[#121212] text-on-surface-variant hover:border-white/10'}`}
                                >
                                    <Truck className={`w-8 h-8 ${deliveryMethod === 'shipping' ? 'text-[#a61d24]' : 'text-on-surface-variant'}`} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Receber em Casa</span>
                                </button>
                            </div>

                            {deliveryMethod === 'shipping' ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">CEP</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="30000-000"
                                            value={customerInfo.cep}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, cep: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Logradouro / Rua</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="Rua, Avenida..."
                                            value={customerInfo.street}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, street: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Número</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="123"
                                            value={customerInfo.number}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Complemento</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="Apto, Bloco..."
                                            value={customerInfo.complement}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, complement: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Bairro</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            placeholder="Bairro"
                                            value={customerInfo.neighborhood}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, neighborhood: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Cidade para Envio</label>
                                        <select
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                            value={customerInfo.city}
                                            onChange={(e) => handleCityChange(e.target.value)}
                                        >
                                            <option value="">Selecione uma Cidade...</option>
                                            {Object.keys(cityFees).map(city => (
                                                <option key={city} value={city}>{city} (Frete: R$ {cityFees[city].toFixed(2)})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Estado</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24] opacity-50"
                                            value="MG"
                                            disabled
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 pt-4 animate-in fade-in duration-300">
                                    <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Selecione o Empório de Retirada</label>
                                    <select
                                        className="w-full bg-[#121212] border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#a61d24]"
                                        value={selectedPdvId}
                                        onChange={(e) => setSelectedPdvId(e.target.value)}
                                    >
                                        {isLoadingPdvs && <option>Carregando empórios...</option>}
                                        {pdvsToRender.map(pdv => (
                                            <option key={pdv.id} value={pdv.id}>{pdv.nome_fantasia}</option>
                                        ))}
                                    </select>
                                    {selectedPdv && (
                                        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 mt-2">
                                            <p className="text-[10px] font-bold text-[#a61d24] uppercase tracking-widest mb-1">Endereço de Retirada</p>
                                            <p className="text-sm font-medium text-white">{selectedPdv.endereco}</p>
                                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-2">
                                                Modelo de Operação: {selectedPdv.billing_model === 'consigned' ? 'Estoque Consignado (Nota emitida pelo Empório)' : 'Faturamento Direto (Nota emitida pela Ponta D\'Faca)'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Selection */}
                        <div className="bg-[#0d0d0d] rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/5">
                            <h3 className="text-xl font-display-lg text-white mb-8 flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-[#a61d24]" />
                                Pagamento
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentMethod('credit')}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'credit' ? 'border-[#a61d24] bg-[#a61d24]/5 text-white' : 'border-white/5 bg-[#121212] text-on-surface-variant hover:border-white/10'}`}
                                >
                                    <CreditCard className={`w-8 h-8 ${paymentMethod === 'credit' ? 'text-[#a61d24]' : 'text-on-surface-variant'}`} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Cartão de Crédito</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('pix')}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'pix' ? 'border-[#a61d24] bg-[#a61d24]/5 text-white' : 'border-white/5 bg-[#121212] text-on-surface-variant hover:border-white/10'}`}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-lg ${paymentMethod === 'pix' ? 'bg-[#a61d24] text-white' : 'bg-[#121212] text-on-surface-variant'}`}>PIX</div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Pix</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary & Rules */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Totals */}
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                            <h3 className="text-xl font-display-lg mb-8">Resumo do Pedido</h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-on-surface-variant text-sm font-medium">
                                    <span>Subtotal</span>
                                    <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-on-surface-variant text-sm font-medium">
                                    <span>Frete ({deliveryMethod === 'shipping' ? 'Entrega' : 'Retirada'})</span>
                                    <span>{shipping > 0 ? `R$ ${shipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Grátis'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <span className="font-bold">TOTAL</span>
                                    <span className="text-2xl font-bold text-[#a61d24] wine-glow-text">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmOrder}
                                disabled={isLoading}
                                className="w-full mt-10 py-5 bg-[#a61d24] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#a61d24]/10 hover:bg-[#8d181e] wine-glow transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        PROCESSANDO...
                                    </>
                                ) : (
                                    <>
                                        FINALIZAR PAGAMENTO
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Security Badges */}
                        <div className="flex flex-col gap-4 px-4">
                            <div className="flex items-center gap-3 text-on-surface-variant">
                                <div className="w-10 h-10 bg-[#121212] border border-white/5 rounded-xl flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-[#a61d24]" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Pagamento Criptografado</span>
                            </div>
                            <div className="flex items-center gap-3 text-on-surface-variant">
                                <div className="w-10 h-10 bg-[#121212] border border-white/5 rounded-xl flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-[#a61d24]" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Garantia Ponta D'Faca</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
