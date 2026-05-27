import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Store, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const PdvLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Por favor, preencha o e-mail e a senha.');
            return;
        }

        setLoading(true);
        try {
            // 1. Sign in using Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data?.user) {
                // 2. Fetch user profile role
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError || !profile) {
                    throw new Error('Perfil de usuário não encontrado.');
                }

                // Allow admins to access PDV dashboard for testing/operations
                const allowedRoles = ['pdv', 'admin_master', 'admin_op'];
                if (!allowedRoles.includes(profile.role)) {
                    await supabase.auth.signOut();
                    throw new Error('Acesso negado. Esta área é restrita a Empórios parceiros.');
                }

                toast.success('Login efetuado com sucesso! Bem-vindo ao Portal do PDV.', {
                    style: {
                        background: '#0a0a0a',
                        color: '#e5e2e1',
                        border: '1px solid rgba(166, 29, 36, 0.2)'
                    },
                    iconTheme: {
                        primary: '#a61d24',
                        secondary: '#0a0a0a'
                    }
                });

                navigate('/pdv/dashboard');
            }
        } catch (err: any) {
            console.error('PDV login error:', err);
            toast.error(err.message || 'Erro ao efetuar login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#050505] text-[#e5e2e1] min-h-screen font-sans flex flex-col justify-center items-center px-4 relative overflow-hidden">
            {/* Background Blur Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#a61d24]/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 z-0"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-black/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 z-0"></div>

            <div className="w-full max-w-md relative z-10 space-y-8">
                {/* Logo and Headings */}
                <div className="text-center space-y-4">
                    <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
                        <img src="/assets/logo-ponta.png" alt="Ponta D'Faca" className="h-28 mx-auto object-contain" />
                    </Link>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-display-lg text-white font-bold tracking-wide">Portal do Empório Parceiro</h2>
                        <p className="text-on-surface-variant text-sm font-medium">Faça login para gerenciar retiradas e estoques.</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-[#0d0d0d] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">E-mail Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a61d24]" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-[#a61d24] transition-all"
                                    placeholder="savassi@emporioparc.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Senha de Acesso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a61d24]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-[#a61d24] transition-all"
                                    placeholder="********"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-[#a61d24]"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-[#a61d24] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#a61d24]/10 hover:bg-[#8d181e] wine-glow transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    AUTENTICANDO...
                                </>
                            ) : (
                                <>
                                    ENTRAR NO PORTAL
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer notes */}
                <div className="text-center space-y-2">
                    <Link to="/" className="text-xs font-bold text-on-surface-variant hover:text-[#a61d24] uppercase tracking-wider transition-colors">
                        ← Voltar para a página pública
                    </Link>
                    <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-widest font-bold">
                        Ponta D'Faca Charcutaria • Área de Acesso Reservado
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PdvLoginPage;
