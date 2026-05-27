import React, { useState, useEffect } from 'react';
import {
    Trophy,
    Award,
    Shield,
    Star,
    Flame,
    Users,
    TrendingUp,
    ChevronRight,
    Loader2,
    Lock,
    CheckCircle,
    User,
    Sparkles
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import toast from 'react-hot-toast';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    progress: number;
    required: number;
    current: number;
    unit: string;
    unlocked: boolean;
}

interface RankingEntry {
    name: string;
    earnings: number;
    referralsCount: number;
    status: string;
    isCurrentUser: boolean;
    rank?: number;
}

const AffiliateRanking: React.FC = () => {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'achievements' | 'ranking'>('achievements');
    const [loading, setLoading] = useState(true);
    
    // User Stats
    const [totalReferrals, setTotalReferrals] = useState(0);
    const [activeReferralsCount, setActiveReferralsCount] = useState(0);
    const [indirectReferralsCount, setIndirectReferralsCount] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [affiliateName, setAffiliateName] = useState('');

    // Leaderboard
    const [leaderboard, setLeaderboard] = useState<RankingEntry[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

    useEffect(() => {
        const fetchStatsAndRankings = async () => {
            if (!user) return;
            try {
                setLoading(true);

                // 1. Fetch affiliate identity
                const { data: affDataList, error: affError } = await supabase
                    .from('affiliates')
                    .select('id, full_name')
                    .eq('user_id', user.id)
                    .eq('organization_id', ORGANIZATION_ID)
                    .limit(1);

                if (affError) throw affError;
                const affData = affDataList?.[0] || null;
                const name = affData?.full_name || profile?.full_name || 'Você';
                setAffiliateName(name);

                let affId = affData?.id;
                let earnings = 0;
                let referralsList: any[] = [];

                // 2. Fetch total earnings from user_settings
                const { data: settingsData } = await supabase
                    .from('user_settings')
                    .select('total_earnings')
                    .eq('user_id', user.id)
                    .eq('organization_id', ORGANIZATION_ID)
                    .maybeSingle();
                
                if (settingsData) {
                    earnings = settingsData.total_earnings || 0;
                }
                setTotalEarnings(earnings);

                // 3. Fetch referrals downline (Up to 3 levels)
                if (affId) {
                    const { data: g1 } = await supabase
                        .from('affiliates')
                        .select('id, is_active, created_at')
                        .eq('sponsor_id', affId)
                        .eq('organization_id', ORGANIZATION_ID);

                    if (g1 && g1.length > 0) {
                        referralsList = g1.map(r => ({ ...r, level: 1 }));
                        const g1Ids = g1.map(r => r.id);

                        const { data: g2 } = await supabase
                            .from('affiliates')
                            .select('id, is_active, created_at')
                            .in('sponsor_id', g1Ids)
                            .eq('organization_id', ORGANIZATION_ID);

                        if (g2 && g2.length > 0) {
                            referralsList = [...referralsList, ...g2.map(r => ({ ...r, level: 2 }))];
                            const g2Ids = g2.map(r => r.id);

                            const { data: g3 } = await supabase
                                .from('affiliates')
                                .select('id, is_active, created_at')
                                .in('sponsor_id', g2Ids)
                                .eq('organization_id', ORGANIZATION_ID);

                            if (g3 && g3.length > 0) {
                                referralsList = [...referralsList, ...g3.map(r => ({ ...r, level: 3 }))];
                            }
                        }
                    }
                }

                // Calculate metrics
                const totalRefs = referralsList.length;
                const activeRefs = referralsList.filter(r => r.is_active).length;
                const indirectRefs = referralsList.filter(r => r.level > 1).length;

                setTotalReferrals(totalRefs);
                setActiveReferralsCount(activeRefs);
                setIndirectReferralsCount(indirectRefs);

                // 4. Build hybrid leaderboard ranking
                // Mock top performers for premium appearance
                const mockEntries: RankingEntry[] = [
                    { name: 'Arthur "Bacon" Silva', earnings: 12450, referralsCount: 124, status: 'Embaixador', isCurrentUser: false },
                    { name: 'Bruno "Churras" Oliveira', earnings: 8920, referralsCount: 82, status: 'Sommelier', isCurrentUser: false },
                    { name: 'Carla "Defumada" Santos', earnings: 6300, referralsCount: 54, status: 'Mestre', isCurrentUser: false },
                    { name: 'Diego "Costela" Lima', earnings: 4200, referralsCount: 39, status: 'Mestre', isCurrentUser: false },
                    { name: 'Eduarda "Salames" Costa', earnings: 2800, referralsCount: 22, status: 'Mestre', isCurrentUser: false },
                    { name: 'Fernanda "Copa" Araujo', earnings: 1900, referralsCount: 15, status: 'Iniciante', isCurrentUser: false },
                    { name: 'Gabriel "Lombo" Pires', earnings: 1200, referralsCount: 9, status: 'Iniciante', isCurrentUser: false },
                    { name: 'Helena "Pancetta" Martins', earnings: 850, referralsCount: 6, status: 'Iniciante', isCurrentUser: false },
                    { name: 'Igor "Chorizo" Souza', earnings: 450, referralsCount: 3, status: 'Iniciante', isCurrentUser: false },
                    { name: 'Julia "Pastrami" Dias', earnings: 150, referralsCount: 1, status: 'Iniciante', isCurrentUser: false }
                ];

                // Determine user badge status
                let userStatus = 'Iniciante';
                if (totalRefs >= 15) userStatus = 'Embaixador';
                else if (indirectRefs >= 3) userStatus = 'Sommelier';
                else if (earnings >= 1000) userStatus = 'Mestre';

                // Add current user entry
                const userEntry: RankingEntry = {
                    name: `${name} (Você)`,
                    earnings: earnings,
                    referralsCount: totalRefs,
                    status: userStatus,
                    isCurrentUser: true
                };

                // Merge and sort
                const combined = [...mockEntries, userEntry];
                combined.sort((a, b) => b.earnings - a.earnings);

                // Assign ranks
                const ranked = combined.map((entry, idx) => ({
                    ...entry,
                    rank: idx + 1
                }));

                setLeaderboard(ranked);

                // Find current user's rank
                const userRankIdx = ranked.findIndex(r => r.isCurrentUser);
                if (userRankIdx !== -1) {
                    setCurrentUserRank(userRankIdx + 1);
                }

            } catch (err) {
                console.error('Error fetching rankings and stats:', err);
                toast.error('Erro ao buscar dados do ranking.');
            } finally {
                setLoading(false);
            }
        };

        fetchStatsAndRankings();
    }, [user, profile]);

    // Achievements details mapping
    const achievements: Achievement[] = [
        {
            id: 'initiate',
            title: 'Iniciante da Defumação',
            description: 'Deu o primeiro passo na arte da charcutaria premium indicando o seu primeiro parceiro.',
            icon: Flame,
            current: totalReferrals,
            required: 1,
            unit: 'indicação',
            progress: Math.min(totalReferrals, 1) / 1 * 100,
            unlocked: totalReferrals >= 1
        },
        {
            id: 'coal_master',
            title: 'Mestre da Brasa',
            description: 'Mostrou consistência e construiu um pequeno grupo de apreciadores ativos da brasa.',
            icon: Award,
            current: activeReferralsCount,
            required: 5,
            unit: 'ativos',
            progress: Math.min(activeReferralsCount, 5) / 5 * 100,
            unlocked: activeReferralsCount >= 5
        },
        {
            id: 'cleaver_legend',
            title: 'Lenda do Cutelo',
            description: 'Sua rede atingiu um volume de vendas digno de mestre, ultrapassando R$ 1.000 em comissões acumuladas.',
            icon: Shield,
            current: totalEarnings,
            required: 1000,
            unit: 'ganhos',
            progress: Math.min(totalEarnings, 1000) / 1000 * 100,
            unlocked: totalEarnings >= 1000
        },
        {
            id: 'smoke_sommelier',
            title: 'Sommelier do Fumo',
            description: 'Sua rede de patrocinados começou a se multiplicar por conta própria em gerações secundárias (níveis 2 e 3).',
            icon: Star,
            current: indirectReferralsCount,
            required: 3,
            unit: 'indicações indiretas',
            progress: Math.min(indirectReferralsCount, 3) / 3 * 100,
            unlocked: indirectReferralsCount >= 3
        },
        {
            id: 'charcuterie_ambassador',
            title: 'Embaixador da Charcutaria',
            description: 'O nível definitivo do Clube Ponta D\'Faca. Referência absoluta na disseminação da marca artesanal.',
            icon: Trophy,
            current: totalReferrals,
            required: 15,
            unit: 'indicações totais',
            progress: Math.min(totalReferrals, 15) / 15 * 100,
            unlocked: totalReferrals >= 15
        }
    ];

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    if (loading) {
        return (
            <AffiliateLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-[#a61d24] animate-spin" />
                    <p className="font-bold text-slate-400">Carregando conquistas e rankings...</p>
                </div>
            </AffiliateLayout>
        );
    }

    // Top 3 for Podio
    const top3 = leaderboard.slice(0, 3);
    const restOfLeaderboard = leaderboard.slice(3, 10);

    return (
        <AffiliateLayout>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white">Ranking & Conquistas</h1>
                    <p className="text-slate-400 font-medium font-inter">Suba de nível indicando novos membros e ganhando comissões.</p>
                </div>
                <div className="flex bg-[#0d0d0d] p-1 border border-white/5 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('achievements')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                            activeTab === 'achievements'
                            ? 'bg-[#a61d24] text-white shadow-lg shadow-[#a61d24]/10'
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Conquistas
                    </button>
                    <button
                        onClick={() => setActiveTab('ranking')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                            activeTab === 'ranking'
                            ? 'bg-[#a61d24] text-white shadow-lg shadow-[#a61d24]/10'
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Ranking Geral
                    </button>
                </div>
            </header>

            {activeTab === 'achievements' ? (
                <div className="space-y-8 pb-20">
                    <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-48 h-48 bg-[#a61d24]/5 blur-3xl rounded-full"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-20 h-20 rounded-2xl bg-[#a61d24]/10 border border-[#a61d24]/20 flex items-center justify-center text-[#a61d24] shrink-0">
                                <Sparkles className="w-10 h-10" />
                            </div>
                            <div className="flex-grow text-center md:text-left">
                                <h2 className="text-xl font-black text-white mb-2">Seu Progresso de Conquistas</h2>
                                <p className="text-slate-400 text-sm font-medium">
                                    Você desbloqueou <span className="text-[#a61d24] font-black">{achievements.filter(a => a.unlocked).length} de {achievements.length}</span> medalhas da Ponta D'Faca. continue indicando para alcançar o nível de Embaixador!
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {achievements.map((ach) => {
                            const IconComponent = ach.icon;
                            return (
                                <div
                                    key={ach.id}
                                    className={`bg-[#0d0d0d] border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-300 group flex flex-col justify-between h-[320px] ${
                                        ach.unlocked 
                                        ? 'border-yellow-500/20 hover:border-yellow-500/40 shadow-yellow-500/[0.02]' 
                                        : 'border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.01] rounded-full"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                                                ach.unlocked
                                                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 group-hover:scale-110'
                                                : 'bg-white/5 border-white/5 text-slate-500'
                                            }`}>
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                            {ach.unlocked ? (
                                                <span className="bg-yellow-500/10 text-yellow-500 px-3.5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border border-yellow-500/10 flex items-center gap-1 shadow-md shadow-yellow-500/5">
                                                    Desbloqueado
                                                </span>
                                            ) : (
                                                <span className="bg-white/5 text-slate-500 px-3.5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border border-white/5 flex items-center gap-1">
                                                    <Lock className="w-3 h-3" /> Bloqueado
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-black text-white mb-2 leading-tight">{ach.title}</h3>
                                        <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-3">{ach.description}</p>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 leading-none">
                                            <span>Progresso</span>
                                            <span>
                                                {ach.id === 'cleaver_legend' 
                                                    ? `${formatCurrency(ach.current)} / ${formatCurrency(ach.required)}`
                                                    : `${ach.current} / ${ach.required} ${ach.unit}`
                                                }
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full transition-all duration-1000 ${ach.unlocked ? 'bg-yellow-500' : 'bg-[#a61d24]'}`}
                                                style={{ width: `${ach.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-10 pb-20">
                    {/* Podio Destaque */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-end pt-10">
                        {/* 2º Lugar */}
                        {top3[1] && (
                            <div className="bg-[#0d0d0d]/80 border border-white/5 rounded-[2.5rem] p-6 text-center order-2 md:order-1 h-[280px] flex flex-col justify-between relative shadow-xl">
                                <div className="absolute top-4 left-4 text-slate-500 font-black text-xl font-mono">#2</div>
                                <div>
                                    <div className="w-20 h-20 rounded-full bg-slate-700/20 border-2 border-slate-400/40 p-1 mx-auto mb-4 overflow-hidden flex items-center justify-center">
                                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${top3[1].name}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                    </div>
                                    <h3 className="font-black text-white text-base truncate">{top3[1].name}</h3>
                                    <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 bg-slate-500/10 px-3 py-1 rounded-full border border-slate-500/10">{top3[1].status}</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 font-black text-emerald-400 text-lg">
                                    {formatCurrency(top3[1].earnings)}
                                </div>
                            </div>
                        )}

                        {/* 1º Lugar */}
                        {top3[0] && (
                            <div className="bg-[#0d0d0d] border border-yellow-500/20 rounded-[2.5rem] p-8 text-center order-1 md:order-2 h-[340px] flex flex-col justify-between relative shadow-2xl scale-100 md:scale-[1.05] z-10">
                                <div className="absolute top-4 left-4 text-yellow-500 font-black text-2xl font-mono">#1</div>
                                <div className="absolute right-4 top-4">
                                    <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
                                </div>
                                <div>
                                    <div className="w-24 h-24 rounded-full bg-yellow-500/10 border-4 border-yellow-500/50 p-1 mx-auto mb-4 overflow-hidden flex items-center justify-center shadow-lg shadow-yellow-500/10 animate-bounce duration-[3000ms]">
                                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${top3[0].name}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                    </div>
                                    <h3 className="font-black text-white text-lg truncate mb-1">{top3[0].name}</h3>
                                    <span className="text-[10px] uppercase tracking-widest font-black text-yellow-500 bg-yellow-500/10 px-3.5 py-1.5 rounded-full border border-yellow-500/20 shadow-sm">{top3[0].status}</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 font-black text-emerald-400 text-xl">
                                    {formatCurrency(top3[0].earnings)}
                                </div>
                            </div>
                        )}

                        {/* 3º Lugar */}
                        {top3[2] && (
                            <div className="bg-[#0d0d0d]/80 border border-white/5 rounded-[2.5rem] p-6 text-center order-3 md:order-3 h-[250px] flex flex-col justify-between relative shadow-xl">
                                <div className="absolute top-4 left-4 text-amber-600/70 font-black text-xl font-mono">#3</div>
                                <div>
                                    <div className="w-16 h-16 rounded-full bg-amber-900/20 border-2 border-amber-700/40 p-1 mx-auto mb-4 overflow-hidden flex items-center justify-center">
                                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${top3[2].name}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                    </div>
                                    <h3 className="font-black text-white text-base truncate">{top3[2].name}</h3>
                                    <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 bg-slate-500/10 px-3 py-1 rounded-full border border-slate-500/10">{top3[2].status}</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 font-black text-emerald-400 text-base">
                                    {formatCurrency(top3[2].earnings)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabela de Posições 4-10 */}
                    <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden max-w-4xl mx-auto">
                        <div className="p-8 border-b border-white/5">
                            <h3 className="text-xl font-black text-white">Quadro de Líderes</h3>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Classificação do 4º ao 10º colocado</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white/[0.01] text-left">
                                        <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">Posição</th>
                                        <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Afiliado</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Time (N1-N3)</th>
                                        <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Rendimentos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {restOfLeaderboard.map((entry) => (
                                        <tr key={entry.rank} className={`group transition-all hover:bg-white/[0.01] ${entry.isCurrentUser ? 'bg-[#a61d24]/5 hover:bg-[#a61d24]/10' : ''}`}>
                                            <td className="py-5 px-8 text-center">
                                                <span className={`font-mono font-black text-sm ${entry.isCurrentUser ? 'text-[#a61d24]' : 'text-slate-400'}`}>
                                                    #{entry.rank}
                                                </span>
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center text-xs shrink-0 border border-white/5">
                                                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.name}`} alt="Avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className={`font-black text-sm ${entry.isCurrentUser ? 'text-[#a61d24]' : 'text-white'}`}>
                                                            {entry.name}
                                                        </div>
                                                        <span className="text-[8px] uppercase tracking-widest font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                            {entry.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center font-black text-slate-300 text-sm">
                                                {entry.referralsCount}
                                            </td>
                                            <td className="py-5 px-8 text-right font-black text-emerald-400 text-base">
                                                {formatCurrency(entry.earnings)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Exibição Rank do Usuário Fixo Inferior se estiver fora do Top 10 */}
                    {currentUserRank && currentUserRank > 10 && (
                        <div className="max-w-4xl mx-auto bg-[#a61d24]/10 border border-[#a61d24]/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-[#a61d24]/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#a61d24] text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md shadow-[#a61d24]/20">
                                    #{currentUserRank}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h4 className="font-black text-white text-base">Sua Posição no Ranking</h4>
                                    <p className="text-xs text-slate-400 font-medium">Continue indicando para subir no quadro de líderes do clube.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Time</p>
                                    <p className="text-base font-black text-white">{totalReferrals}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Seus Ganhos</p>
                                    <p className="text-base font-black text-emerald-400">{formatCurrency(totalEarnings)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AffiliateLayout>
    );
};

export default AffiliateRanking;
