
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { toast } from 'react-hot-toast';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await resetPassword(email);
            if (error) throw error;
            setSubmitted(true);
            toast.success('E-mail de recuperação enviado!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao enviar e-mail de recuperação.');
            console.error('Erro na recuperação:', error);
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
                {/* Header/Logo Area */}
                <div className="text-center">
                    <Link to="/" className="inline-block mb-6 hover:opacity-90 transition-opacity">
                        <img src="/assets/logo-ponta.png" alt="Ponta D'Faca" className="h-28 mx-auto object-contain" />
                    </Link>
                    <h1 className="text-3xl font-display-lg text-white font-bold tracking-wide mb-2">Recuperar Senha</h1>
                    <p className="text-on-surface-variant text-sm font-medium">Enviaremos um link de redefinição para o seu e-mail.</p>
                </div>

                {/* Recovery Card */}
                <div className="bg-[#0d0d0d] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest pl-1">E-mail Cadastrado</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a61d24]" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-[#a61d24] transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#a61d24] hover:bg-[#8d181e] text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#a61d24]/10 group uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'ENVIANDO...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
                                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 pt-4">
                            <div className="w-20 h-20 bg-emerald-950/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-900/20">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">E-mail Enviado!</h3>
                                <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                                    Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link para criar uma nova senha em instantes.
                                </p>
                            </div>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-xs font-bold uppercase tracking-widest text-[#a61d24] hover:underline"
                            >
                                Tentar outro e-mail
                            </button>
                        </div>
                    )}

                    {/* Back to Login */}
                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-white font-bold hover:text-[#a61d24] transition-colors group text-xs uppercase tracking-widest">
                            <ArrowLeft className="w-4 h-4 text-[#a61d24] group-hover:-translate-x-1 transition-transform" />
                            VOLTAR PARA O LOGIN
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
