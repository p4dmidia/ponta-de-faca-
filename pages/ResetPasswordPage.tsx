import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Key, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { toast } from 'react-hot-toast';

const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { updatePassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await updatePassword(password);
            if (error) throw error;

            toast.success('Senha atualizada com sucesso!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar senha.');
            console.error('Erro no reset de senha:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-[#e5e2e1] flex flex-col justify-center items-center pt-28 md:pt-36 pb-20 px-4 relative overflow-hidden font-sans">
            {/* Background Blur Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#a61d24]/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 z-0"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-black/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 z-0"></div>

            <div className="max-w-md w-full relative z-10 space-y-8">
                <div className="text-center">
                    <div className="inline-block mb-6 hover:opacity-90 transition-opacity">
                        <img src="/assets/logo-ponta.png" alt="Ponta D'Faca" className="h-28 mx-auto object-contain" />
                    </div>
                    <h1 className="text-3xl font-display-lg text-white font-bold tracking-wide mb-2">Nova Senha</h1>
                    <p className="text-on-surface-variant text-sm font-medium">Crie uma nova senha segura para sua conta.</p>
                </div>

                <div className="bg-[#0d0d0d] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a61d24]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#a61d24] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-[#a61d24] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">Confirmar Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a61d24]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#a61d24] transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#a61d24] hover:bg-[#8d181e] text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#a61d24]/10 group uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? 'ATUALIZANDO...' : 'REDEFINIR SENHA'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
