import React, { useState, useEffect } from 'react';
import {
    Download,
    Copy,
    Check,
    Video,
    Image as ImageIcon,
    FileText,
    Search,
    PlayCircle,
    FileVideo,
    Share2,
    Library,
    ChevronRight,
    RefreshCcw,
    File as FileIcon
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AffiliateLayout from '../components/AffiliateLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Material {
    id: string;
    title: string;
    description: string;
    type: 'all' | 'video' | 'banner' | 'script' | 'pdf';
    thumbnail_url?: string;
    file_url?: string;
    content?: string; // For scripts
}

const AffiliateMaterials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'video' | 'banner' | 'script' | 'pdf'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('marketing_materials')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching materials:', error);
                setMaterials([]);
            } else if (data && data.length > 0) {
                setMaterials(data as any);
            } else {
                setMaterials([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = materials.filter(m => {
        const matchesTab = activeTab === 'all' || m.type === activeTab;
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Texto copiado!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDownload = async (url?: string, fileName?: string) => {
        if (!url || url.startsWith('#')) {
            toast.error('Link de material temporariamente indisponível.');
            return;
        }

        // Se for vídeo, apenas abre em nova aba para assistir
        if (url.includes('.mp4') || url.includes('youtube.com') || url.includes('vimeo.com')) {
            window.open(url, '_blank');
            return;
        }

        try {
            toast.loading('Iniciando download...', { id: 'download' });
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'material-pontadefaca';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            toast.success('Download concluído!', { id: 'download' });
        } catch (err) {
            console.error('Download error:', err);
            // Fallback: abre em nova aba se o download forçado falhar (CORS etc)
            window.open(url, '_blank');
            toast.success('Abrindo material...', { id: 'download' });
        }
    };

    return (
        <AffiliateLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-white">Materiais de Apoio</h1>
                        <p className="text-slate-400 font-medium font-inter">Conteúdos oficiais Ponta D'Faca Charcutaria para sua divulgação.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar material..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0d0d0d] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-[#a61d24] transition-all font-bold"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-[#0d0d0d] rounded-2xl w-fit border border-white/5">
                    {[
                        { id: 'all', label: 'Todos', icon: Library },
                        { id: 'video', label: 'Vídeos', icon: Video },
                        { id: 'banner', label: 'Imagens', icon: ImageIcon },
                        { id: 'pdf', label: 'PDFs', icon: FileIcon },
                        { id: 'script', label: 'Scripts', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-[#a61d24] text-white shadow-lg shadow-[#a61d24]/10' 
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                    <button
                        onClick={fetchMaterials}
                        className="p-2.5 text-slate-500 hover:text-white transition-all"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] h-80 animate-pulse"></div>
                        ))
                    ) : filteredMaterials.length > 0 ? (
                        filteredMaterials.map(item => (
                            <div key={item.id} className="group bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl hover:border-[#a61d24]/20 transition-all duration-500 flex flex-col">
                                {/* Material Preview */}
                                <div className="aspect-video relative overflow-hidden bg-black/60">
                                    {item.thumbnail_url ? (
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement?.classList.add('bg-black/60');
                                            }}
                                        />
                                    ) : item.type === 'script' ? (
                                        <div className="w-full h-full flex items-center justify-center p-8 bg-red-950/10 border border-red-900/5 group-hover:bg-red-950/20 transition-colors">
                                            <FileText className="w-16 h-16 text-[#a61d24] opacity-10" />
                                            <div className="absolute inset-0 p-8 flex flex-col justify-center overflow-hidden">
                                                <p className="text-[10px] font-black text-[#a61d24] uppercase tracking-[0.2em] mb-3">Roteiro de Venda</p>
                                                <p className="text-xs text-slate-300 font-bold leading-relaxed line-clamp-4 italic">"{item.content}"</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {item.type === 'video' ? (
                                                <Video className="w-16 h-16 text-[#a61d24] opacity-20" />
                                            ) : item.type === 'pdf' ? (
                                                <FileIcon className="w-16 h-16 text-slate-500 opacity-20" />
                                            ) : (
                                                <ImageIcon className="w-16 h-16 text-slate-500 opacity-20" />
                                            )}
                                        </div>
                                    )}

                                    {/* Hover Overlay - only for non-scripts or things with thumbnails */}
                                    {(item.thumbnail_url || item.type !== 'script') && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {item.type === 'video' ? (
                                                <PlayCircle className="w-16 h-16 text-white" />
                                            ) : item.type === 'pdf' ? (
                                                <FileIcon className="w-16 h-16 text-white" />
                                            ) : (
                                                <ImageIcon className="w-16 h-16 text-white" />
                                            )}
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="px-3 py-1.5 bg-black/85 border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-md">
                                            {item.type === 'script' ? 'Script' : item.type === 'banner' ? 'Imagem' : item.type === 'pdf' ? 'PDF' : 'Vídeo'}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-8 space-y-3 flex-grow">
                                    <h3 className="text-lg font-black text-white leading-tight group-hover:text-[#a61d24] transition-colors">{item.title}</h3>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="p-8 pt-0 mt-auto">
                                    {item.type === 'script' ? (
                                        <button
                                            onClick={() => handleCopy(item.id, item.content || '')}
                                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${
                                                copiedId === item.id 
                                                    ? 'bg-emerald-600 text-white shadow-emerald-200/25 shadow-lg' 
                                                    : 'bg-[#a61d24] text-white hover:bg-[#8d181e] wine-glow'
                                            }`}
                                        >
                                            {copiedId === item.id ? (
                                                <>
                                                    <Check className="w-4 h-4" /> TEXTO COPIADO!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" /> COPIAR SCRIPT
                                                </>
                                            )}
                                        </button>
                                    ) : item.type === 'video' ? (
                                        <button
                                            onClick={() => window.open(item.file_url, '_blank')}
                                            className="w-full py-4 bg-[#a61d24] text-white hover:bg-[#8d181e] wine-glow rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            <PlayCircle className="w-4 h-4" /> ASSISTIR AGORA
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDownload(item.file_url, item.title)}
                                            className="w-full py-4 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/10 transition-all"
                                        >
                                            <Download className="w-4 h-4" /> BAIXAR AGORA
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <Library className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Nenhum material encontrado</p>
                        </div>
                    )}
                </div>

                {/* Share Tips */}
                <div className="bg-[#0d0d0d] border border-white/5 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-[#a61d24]/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-[#a61d24]">
                                <Share2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black leading-tight text-white">Dicas de Divulgação</h3>
                            <p className="text-slate-400 font-bold leading-relaxed">
                                Use o seu link de afiliado em cada postagem. Lembre-se: o segredo da divulgação na Ponta D'Faca Charcutaria é destacar a cura artesanal e o sabor inigualável dos defumados.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-950/20 border border-emerald-900/10 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></div>
                                    <span className="text-xs font-bold text-slate-300">Foque na exclusividade dos combos.</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-950/20 border border-emerald-900/10 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></div>
                                    <span className="text-xs font-bold text-slate-300">Explique o processo de cura lenta.</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-6">
                            <FileVideo className="w-12 h-12 text-[#a61d24] mb-4" />
                            <h4 className="text-xl font-black text-white">Quer materiais personalizados?</h4>
                            <p className="text-sm font-medium text-slate-400 leading-relaxed">Fale com o suporte no WhatsApp para solicitar artes exclusivas com sua foto ou logomarca.</p>
                            <button className="text-[#a61d24] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all hover:underline">
                                SOLICITAR AGORA <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AffiliateLayout>
    );
};

export default AffiliateMaterials;
