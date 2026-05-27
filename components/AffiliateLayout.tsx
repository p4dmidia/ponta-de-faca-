import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Wallet,
    TrendingUp,
    LogOut,
    Library,
    Menu,
    X,
    Settings,
    ShoppingBag,
    Trophy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { ORGANIZATION_ID } from '../lib/config';
import toast from 'react-hot-toast';

interface AffiliateLayoutProps {
    children: React.ReactNode;
}

const AffiliateLayout: React.FC<AffiliateLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user, profile } = useAuth();
    const { clearCart } = useCart();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [affiliate, setAffiliate] = React.useState<any>(null);
    const [loadingAff, setLoadingAff] = React.useState(true);

    React.useEffect(() => {
        if (!user) {
            setLoadingAff(false);
            return;
        }

        const fetchAffStatus = async () => {
            try {
                const { data } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('organization_id', ORGANIZATION_ID)
                    .maybeSingle();
                if (data) {
                    setAffiliate(data);
                }
            } catch (err) {
                console.error('Error fetching affiliate status:', err);
            } finally {
                setLoadingAff(false);
            }
        };

        fetchAffStatus();
    }, [user]);

    // Affiliate accounts are free to access, no blocks are active
    const isBlocked = false;

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success('Sessão encerrada com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao sair do sistema.');
        }
    };

    const menuItems = [];
    if (profile?.role === 'affiliate' || profile?.role === 'admin_master' || profile?.role === 'admin_op') {
        menuItems.push(
            { label: 'Dashboard', icon: LayoutDashboard, path: '/afiliado/dashboard' },
            { label: 'Área do Cliente', icon: ShoppingBag, path: '/cliente/compras' },
            { label: 'Indicações', icon: Users, path: '/afiliado/referrals' },
            { label: 'Financeiro', icon: Wallet, path: '/afiliado/financial' },
            { label: 'Ranking & Conquistas', icon: Trophy, path: '/afiliado/ranking' },
            { label: 'Relatórios', icon: TrendingUp, path: '/afiliado/reports' },
            { label: 'Materiais', icon: Library, path: '/afiliado/materials' },
            { label: 'Configurações', icon: Settings, path: '/afiliado/settings' },
        );
    } else {
        menuItems.push(
            { label: 'Área do Cliente', icon: ShoppingBag, path: '/cliente/compras' },
            { label: 'Configurações', icon: Settings, path: '/afiliado/settings' },
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-[#e5e2e1] flex flex-col lg:flex-row overflow-x-hidden">
            {/* Mobile Header */}
            <header className="lg:hidden h-20 bg-black px-4 flex items-center justify-between sticky top-0 z-30 border-b border-white/5">
                <Link to="/" onClick={() => setIsSidebarOpen(false)}>
                    <div className="flex items-center justify-center py-2">
                        <img src="/assets/logo-ponta.png" alt="Ponta D'Faca" className="h-14 w-auto object-contain" />
                    </div>
                </Link>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-white hover:text-[#a61d24] transition-colors"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-72 bg-black border-r border-white/5 flex flex-col p-6 text-white shrink-0 fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-auto
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="mb-12 px-2 flex items-center justify-between">
                    <Link to="/">
                        <div className="flex items-center justify-center py-1">
                            <img src="/assets/logo-ponta.png" alt="Ponta D'Faca" className="h-20 w-auto object-contain" />
                        </div>
                    </Link>
                </div>

                <nav className="flex-grow space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all group ${isActive
                                    ? 'bg-[#a61d24]/10 text-[#a61d24]'
                                    : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#a61d24]' : 'group-hover:text-[#a61d24]'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-2">Usuário</p>
                        <p className="text-sm font-medium truncate mb-4 text-[#e5e2e1]">{user?.email}</p>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            SAIR DO SISTEMA
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto bg-[#050505]">
                {loadingAff ? (
                    <div className="min-h-[60vh] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a61d24]"></div>
                    </div>
                ) : (
                    children
                )}
            </main>
        </div>
    );
};

export default AffiliateLayout;
