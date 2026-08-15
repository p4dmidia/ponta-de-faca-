import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Vagas state
  const [activeCount, setActiveCount] = useState(37);
  const maxSlots = 50;

  // Lead Form state (Waitlist)
  const [leadForm, setLeadForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    city: ''
  });
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  // Scroll effect and member count fetch
  useEffect(() => {
    const fetchMemberCount = async () => {
      try {
        const { count, error } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        
        if (!error && count !== null) {
          // Clamp to max 50 for the scarcity feel
          setActiveCount(Math.min(count > 0 ? count : 37, maxSlots));
        }
      } catch (err) {
        console.error('Error fetching member count:', err);
      }
    };

    fetchMemberCount();

    // Parallax scroll effect
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const heroImg = document.getElementById('hero-bg-img');
      if (heroImg) {
        heroImg.style.transform = `translateY(${scrolled * 0.4}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setLeadForm(prev => ({
      ...prev,
      whatsapp: formatPhone(value)
    }));
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.whatsapp || !leadForm.email) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setSubmittingLead(true);
    try {
      const { error } = await supabase
        .from('waiting_list')
        .insert([
          {
            name: leadForm.name,
            whatsapp: leadForm.whatsapp,
            email: leadForm.email,
            city: leadForm.city
          }
        ]);
      if (error) throw error;
      setLeadSaved(true);
      toast.success('Você foi adicionado(a) à lista de espera! Entraremos em contato em breve.');
      setLeadForm({ name: '', whatsapp: '', email: '', city: '' });
    } catch (err) {
      console.error('Error saving waitlist lead:', err);
      toast.error('Erro ao se cadastrar na lista de espera. Tente novamente.');
    } finally {
      setSubmittingLead(false);
    }
  };

  const handlePlanSelect = (planSlug: string, price: number) => {
    // If club is full, scroll to waiting list
    if (activeCount >= maxSlots) {
      toast('O Clube está completo no momento. Cadastre-se na lista de espera!', {
        icon: '⏳'
      });
      const element = document.getElementById('lista-espera');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Redirect to register/checkout
    if (user) {
      navigate(`/checkout?plan=${planSlug}`);
    } else {
      navigate(`/register?type=client&plan=${planSlug}`);
    }
  };

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Percentage of slots filled
  const occupancyPercentage = (activeCount / maxSlots) * 100;

  return (
    <div className="font-body-md text-body-md text-on-surface bg-background overflow-x-hidden min-h-screen">
      
      {/* Hero Section */}
      <section id="clube" className="relative min-h-screen flex items-center justify-center pt-28 md:pt-36 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            id="hero-bg-img"
            alt="Hero Image" 
            className="w-full h-full object-cover object-center opacity-60 grayscale-[0.2] transition-transform duration-100 ease-out" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmgVPq3Jq2Rp5cFO07XZOS9wjIFJzXdC0aDlqnCUnMzVTtUvtKy1cacuo0VRSoMph4cKee6b-rXfwKH4a3IxB0FRVqnfbPfqzf77543kYC8umUqDMU2PhWah7rNt5vFZqvLEJhmKm6WfE5h8OJoeVvh9b3wUy1RV51aNXRONuz9Lpvo6wss_bxkr35dV44Fhcpm0UDgrAQH-1dnTQ8mECIuj_bOLugd8fIxBU9IjwNlWLtutwPCep1x1NSn1T2rUDctxBdXa6ohIYV"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60"></div>
          <div className="smoke-overlay"></div>
        </div>
        
        <div className="relative z-20 text-center max-w-4xl px-margin-mobile">
          <span className="inline-block font-label-lg text-label-lg text-primary tracking-[0.2em] uppercase mb-6 wine-glow-text">
            Herança &amp; Tradição Mineira
          </span>
          <h1 className="font-display-lg text-4xl sm:text-5xl md:text-[80px] leading-tight mb-8">
            Os melhores defumados artesanais de Minas, todos os meses na sua casa.
          </h1>
          <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10 px-4">
            Clube exclusivo limitado para apenas {maxSlots} membros. Uma jornada sensorial através da cura lenta e do fogo real.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={() => handleScrollTo(activeCount >= maxSlots ? 'lista-espera' : 'planos')}
              className="bg-primary-container text-white px-10 py-5 font-label-lg text-label-lg rounded-DEFAULT wine-glow hover:scale-105 transition-transform duration-300 uppercase"
            >
              {activeCount >= maxSlots ? 'ENTRAR NA LISTA DE ESPERA' : 'QUERO FAZER PARTE DO CLUBE'}
            </button>
            
            <div className="w-full max-w-sm mt-4">
              <div className="flex justify-between font-label-md text-label-md mb-2">
                <span>OCUPAÇÃO DO CLUBE</span>
                <span className="text-primary font-bold">{activeCount}/{maxSlots} VAGAS</span>
              </div>
              <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-container wine-glow transition-all duration-1000 ease-out" 
                  style={{ width: `${occupancyPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto scroll-mt-20" id="planos">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-3xl md:text-headline-lg mb-4">Escolha sua Jornada</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Planos pensados para os verdadeiros apreciadores da alta charcutaria.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Plan 1 */}
          <div className="glass-card p-10 rounded-lg flex flex-col border border-white/5 hover:border-primary/30 transition-all duration-500">
            <span className="font-label-lg text-label-lg text-on-surface-variant mb-4">MENSAL</span>
            <h3 className="font-headline-md text-2xl md:text-headline-md mb-2">Trimestral</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-body-md text-body-md text-on-surface-variant">R$</span>
              <span className="font-display-lg text-5xl md:text-display-lg leading-none">280</span>
              <span className="font-body-md text-body-md text-on-surface-variant">/mês</span>
            </div>
            <ul className="flex-grow space-y-4 mb-10">
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Entrega Mensal Garantida
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Seleção do Curador
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                5% de Cashback
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md text-emerald-400 font-medium">
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                Troque seus produtos todo mês!
              </li>
            </ul>
            <button 
              onClick={() => handlePlanSelect('trimestral', 280)}
              className="w-full py-4 border border-white/20 font-label-lg text-label-lg hover:bg-white hover:text-black transition-colors"
            >
              SELECIONAR
            </button>
          </div>
          
          {/* Plan 2 (Anual - Featured) */}
          <div className="relative glass-card p-10 rounded-lg flex flex-col border border-primary/50 wine-glow transform md:scale-105 z-10 bg-surface-container-low">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-container text-white px-4 py-1 rounded-full font-label-md text-label-md">
              MELHOR VALOR
            </div>
            <span className="font-label-lg text-label-lg text-primary mb-4">ANUAL</span>
            <h3 className="font-headline-md text-2xl md:text-headline-md mb-2">Plano Anual</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-body-md text-body-md text-on-surface-variant">R$</span>
              <span className="font-display-lg text-5xl md:text-display-lg leading-none text-primary">230</span>
              <span className="font-body-md text-body-md text-on-surface-variant">/mês</span>
            </div>
            <ul className="flex-grow space-y-4 mb-10">
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                Prioridade Máxima em Cortes Raros
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                15% de Cashback Permanente
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                Kit de Boas-vindas (Faca Ponta D'Faca)
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                Frete Grátis em toda a Loja
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md text-amber-400 font-bold">
                <span className="material-symbols-outlined text-[20px]">cake</span>
                Brinde: 1 Doce Especial!
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md text-emerald-400 font-medium">
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                Troque seus produtos todo mês!
              </li>
            </ul>
            <button 
              onClick={() => handlePlanSelect('anual', 230)}
              className="w-full py-4 bg-primary-container text-white font-label-lg text-label-lg wine-glow hover:opacity-90 transition-opacity"
            >
              ASSINAR AGORA
            </button>
          </div>
          
          {/* Plan 3 */}
          <div className="glass-card p-10 rounded-lg flex flex-col border border-white/5 hover:border-primary/30 transition-all duration-500">
            <span className="font-label-lg text-label-lg text-on-surface-variant mb-4">SEMESTRAL</span>
            <h3 className="font-headline-md text-2xl md:text-headline-md mb-2">Semestral</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-body-md text-body-md text-on-surface-variant">R$</span>
              <span className="font-display-lg text-5xl md:text-display-lg leading-none">250</span>
              <span className="font-body-md text-body-md text-on-surface-variant">/mês</span>
            </div>
            <ul className="flex-grow space-y-4 mb-10">
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Lançamentos Antecipados
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                10% de Cashback
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Acesso ao Fórum do Clube
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md text-amber-400 font-bold">
                <span className="material-symbols-outlined text-[20px]">liquor</span>
                Brinde: Cachaça Premiada!
              </li>
              <li className="flex items-center gap-3 font-body-md text-body-md text-emerald-400 font-medium">
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                Troque seus produtos todo mês!
              </li>
            </ul>
            <button 
              onClick={() => handlePlanSelect('semestral', 250)}
              className="w-full py-4 border border-white/20 font-label-lg text-label-lg hover:bg-white hover:text-black transition-colors"
            >
              SELECIONAR
            </button>
          </div>
        </div>
      </section>

      {/* Combos Section (Bento Grid Style) */}
      <section className="bg-surface-container-lowest py-section-gap scroll-mt-20" id="combos">
        <div className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="font-label-lg text-label-lg text-primary uppercase tracking-widest">AS CURADORIAS</span>
              <h2 className="font-display-lg text-3xl md:text-headline-lg mt-2">Nossas Experiências de Sabor</h2>
            </div>
            <div className="max-w-md">
              <p className="font-body-md text-body-md text-on-surface-variant text-left md:text-right">
                Cada box é uma composição única. <br/>
                <span className="text-tertiary">Peso aproximado entre 450g e 550g por item.</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Combo 1 */}
            <div className="md:col-span-8 group relative h-[350px] md:h-[500px] overflow-hidden rounded-lg">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="Tábua de charcutaria artesanal Ponta D'Faca"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfDByUepKlzOdgsMXUfl-owCjpSasMwTEr-ie3YjnxPXId6seqNcchzJqkE34wx1nxtAwwsOnz0CzaPNGRIdtVNfC9WUl5K4FLtGWSjc7EfYNrje5avkkYgyCJVUjHK_ou_tp0LdSMH_WjPSqpoGNeqV6H82rzxF44ZWW7rYQMo_5Gy8Jz-K-ykfOrS4eaMk6hsY4cX4TcsgFuDLmkVPlQzvyuiKS-fgq7H44rJYsXEdtHC7ryhykhZjYRYPUPmB8lVE32YOwh2NSb"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 max-w-md">
                <h3 className="font-headline-lg text-2xl md:text-headline-lg mb-2">Combo 1 — Clássico Mineiro</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">Linguiça Artesanal, Bacon Defumado em Lenha de Macieira, Copa Lombo e Costelinha Maturada.</p>
                <span className="font-label-md text-label-md px-3 py-1 bg-surface-container-high rounded-full border border-white/10 italic opacity-80 block w-fit">
                  * Variação de peso de 10-15% devido ao processo de cura e desidratação.
                </span>
              </div>
            </div>
            
            {/* Combo 2 */}
            <div className="md:col-span-4 group relative h-[300px] md:h-[500px] overflow-hidden rounded-lg">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="Defumados de churrasco premium"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCH6E0Fn48revggD_q3l0qtzADvGANYWeY1aS_0y7qZB57Pq9KsVehQTwzrFtAdRDawDhh3GHzMPFvpXOcIjzcgWdz9kYi1mtOpFZFQyyZCGurfXr9JlTi2ihZ8BZbOOlMclJ8URofOwvFr46XikSMeZznvtbeY4n9D_WsM32TJPpTSIyZDde1pT8DC1t56KpHYdKYYgWhfYiEsNZPXXmDzv0uFD6TTOSc6GHpYrEb5on31oUCeFA3E5432KO5Ub6pGcfLqGLMwTrG_"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10">
                <h3 className="font-headline-md text-2xl md:text-headline-md mb-2">Churrasco Premium</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Brisket, Pastrami, Cupim e Linguiça Especial de autoria.</p>
              </div>
            </div>
            
            {/* Combo 3 */}
            <div className="md:col-span-12 group relative h-auto md:h-[400px] overflow-hidden rounded-lg bg-[#0a0a0a]">
              <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                <div className="p-8 sm:p-12 flex flex-col justify-center">
                  <span className="font-label-lg text-label-lg text-tertiary mb-4 tracking-widest">EDIÇÃO LIMITADA</span>
                  <h3 className="font-display-lg text-2xl md:text-headline-lg mb-4 text-white">Combo 3 — Experiência Chef</h3>
                  <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant mb-8">Itens sazonais, edições limitadas e cortes exclusivos que você não encontrará em nenhum outro lugar.</p>
                  <a className="text-white font-label-lg text-label-lg border-b border-primary w-fit pb-1 hover:text-primary transition-colors" href="#">VER DETALHES DA PRÓXIMA EDIÇÃO</a>
                </div>
                <div className="relative h-64 md:h-full overflow-hidden">
                  <img 
                    className="w-full h-full object-cover opacity-80" 
                    alt="Experiência gourmet com charcutaria artesanal"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAWOHRDnFzh42oPreaT2pFr8qPNkbBTw4MYjoHMyEuSyVkUVYVYUmvf6lO3O-FUKIH_ojOzchVGzfFSN7-qltaFc4W0hoSp-Sfdam-mGhzRimga0z_3pA5bXNtrm-GY7uzr9L8drTBWcjw_eW-YnwsVCUieO9eBykfesWggHupXRaxmZm0FnJ1NvSI9KwX6HMQWuJ5lUyC8Vk2173Rgb6bLaffLUQ7T5cVfFvdpyWY4PGmFlnyzHEpqSTt2L5XZUeFgA0zUClVggjO"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logistics Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(#A61D24_1px,transparent_1px)] [background-size:40px_40px]"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center px-margin-mobile relative z-10">
          <div className="inline-flex items-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-primary"></div>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
            <div className="h-[1px] w-12 bg-primary"></div>
          </div>
          <h2 className="font-headline-md text-2xl md:text-headline-md mb-6 italic">O Ritmo da Excelência</h2>
          <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant leading-relaxed">
            Trabalhamos sob demanda para garantir o frescor absoluto de cada defumado. <br/>
            <span className="text-on-surface font-semibold">Prazo de até 7 dias úteis para produção e entrega.</span>
          </p>
        </div>
      </section>

      {/* Waiting List (Fila de Espera) Section */}
      <section id="lista-espera" className="py-24 bg-surface-container-low border-t border-white/5 scroll-mt-20">
        <div className="max-w-xl mx-auto px-margin-mobile">
          <div className="text-center mb-10">
            <span className="inline-block font-label-lg text-label-lg text-primary tracking-[0.1em] uppercase mb-4">
              Vagas Esgotadas?
            </span>
            <h2 className="font-headline-md text-2xl md:text-headline-md mb-4">Fila de Espera Oficial</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Inscreva-se na lista abaixo. Quando surgir uma vaga no Clube, nossa equipe notificará você de imediato.
            </p>
          </div>

          {leadSaved ? (
            <div className="glass-card p-8 rounded-lg border border-emerald-500/30 text-center space-y-4 wine-glow">
              <span className="material-symbols-outlined text-emerald-400 text-5xl">check_circle</span>
              <h3 className="font-headline-md text-lg text-white">Inscrição Confirmada!</h3>
              <p className="text-slate-300 text-sm">
                Seus dados foram registrados com sucesso em nossa lista. Fique atento(a) ao seu e-mail e WhatsApp.
              </p>
              <button 
                onClick={() => setLeadSaved(false)}
                className="text-xs font-bold text-primary underline hover:text-white transition-colors"
              >
                Cadastrar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: João Silva de Souza"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#0e0e0e] border-0 border-b border-white/30 p-4 text-white placeholder-white/20 focus:border-primary focus:ring-0 outline-none text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">WhatsApp</label>
                  <input 
                    type="tel"
                    required
                    placeholder="Ex: (31) 99999-9999"
                    value={leadForm.whatsapp}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#0e0e0e] border-0 border-b border-white/30 p-4 text-white placeholder-white/20 focus:border-primary focus:ring-0 outline-none text-sm transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Cidade (Minas Gerais)</label>
                  <input 
                    type="text"
                    placeholder="Ex: Belo Horizonte"
                    value={leadForm.city}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-[#0e0e0e] border-0 border-b border-white/30 p-4 text-white placeholder-white/20 focus:border-primary focus:ring-0 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">E-mail</label>
                <input 
                  type="email"
                  required
                  placeholder="Ex: joao@gmail.com"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[#0e0e0e] border-0 border-b border-white/30 p-4 text-white placeholder-white/20 focus:border-primary focus:ring-0 outline-none text-sm transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={submittingLead}
                className="w-full bg-primary-container text-white py-5 font-label-lg text-label-lg rounded-DEFAULT wine-glow hover:scale-[1.01] transition-transform duration-300 disabled:opacity-50 uppercase"
              >
                {submittingLead ? 'ENVIANDO...' : 'INSCREVER-SE NA FILA DE ESPERA'}
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
};

export default HomePage;
