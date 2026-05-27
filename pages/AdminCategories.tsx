import React, { useState, useEffect } from 'react';
import {
    Layers,
    Plus,
    Edit,
    Trash2,
    X,
    Loader2,
    ChevronDown,
    ChevronUp,
    Tag,
    AlertCircle
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Category {
    id: number;
    name: string;
    parent_id?: number | null;
    created_at: string;
    children?: Category[];
}

// Helper Component for Recursive Rendering
const CategoryTreeList: React.FC<{
    nodes: Category[];
    onEdit: (cat: Category) => void;
    onDelete: (id: number) => void;
    onAddSub: (parentId: number) => void;
    level?: number;
}> = ({ nodes, onEdit, onDelete, onAddSub, level = 0 }) => {
    return (
        <div className={`space-y-4 ${level > 0 ? 'ml-8 mt-4 border-l-2 border-white/5 pl-6' : ''}`}>
            {nodes.map(node => (
                <div key={node.id} className="space-y-4">
                    <div className="bg-[#0d0d0d] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden transition-all hover:border-white/10">
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-[#a61d24]">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white font-playfair">{node.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        ID: {node.id} | {node.children?.length || 0} Subcategorias
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onAddSub(node.id)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                    title="Adicionar Subcategoria"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => onEdit(node)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => onDelete(node.id)}
                                    className="p-2 text-rose-400 hover:text-rose-500 hover:bg-rose-950/20 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {node.children && node.children.length > 0 && (
                        <CategoryTreeList
                            nodes={node.children}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSub={onAddSub}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

// Helper to flatten tree for select dropdown
const categoriesToSelect = (nodes: Category[], prefix = ''): { id: number, name: string }[] => {
    let list: { id: number, name: string }[] = [];
    nodes.forEach(node => {
        list.push({ id: node.id, name: prefix + node.name });
        if (node.children) {
            list = [...list, ...categoriesToSelect(node.children, prefix + node.name + ' > ')];
        }
    });
    return list;
};

const AdminCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);

    // Form States
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('product_categories')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .order('name');

            if (error) throw error;

            // Build hierarchical structure for display
            const buildTree = (cats: any[]): Category[] => {
                const map: { [key: number]: Category } = {};
                const tree: Category[] = [];

                cats.forEach(cat => {
                    map[cat.id] = { ...cat, children: [] };
                });

                cats.forEach(cat => {
                    const mapped = map[cat.id];
                    if (cat.parent_id) {
                        const parent = map[cat.parent_id];
                        if (parent) {
                            parent.children = parent.children || [];
                            parent.children.push(mapped);
                        } else {
                            tree.push(mapped);
                        }
                    } else {
                        tree.push(mapped);
                    }
                });

                return tree;
            };

            setCategories(buildTree(data || []));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erro ao carregar categorias.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);

        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('product_categories')
                    .update({ 
                        name,
                        parent_id: parentCategoryId
                    })
                    .eq('id', editingCategory.id)
                    .eq('organization_id', ORGANIZATION_ID);
                if (error) throw error;
                toast.success('Categoria atualizada!');
            } else {
                const { error } = await supabase
                    .from('product_categories')
                    .insert([{ 
                        name, 
                        parent_id: parentCategoryId,
                        organization_id: ORGANIZATION_ID 
                    }]);
                if (error) throw error;
                toast.success('Categoria criada!');
            }
            setIsModalOpen(false);
            setName('');
            setParentCategoryId(null);
            setEditingCategory(null);
            fetchData();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Erro ao salvar categoria.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white font-playfair">Categorias e Subcategorias</h1>
                        <p className="text-slate-400 font-medium font-inter">Organize seu catálogo de produtos em múltiplos níveis.</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setParentCategoryId(null);
                            setName('');
                            setIsModalOpen(true);
                        }}
                        className="bg-[#a61d24] hover:bg-[#8d181e] wine-glow text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-bold shadow-xl shadow-[#a61d24]/10 transition-all whitespace-nowrap uppercase text-xs tracking-widest"
                    >
                        <Plus className="w-4 h-4 text-white" />
                        Nova Categoria
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-[#a61d24] animate-spin" />
                            <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Carregando categorias...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="bg-[#0d0d0d] border border-white/5 p-20 rounded-[3rem] shadow-2xl text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                               <Layers className="w-10 h-10 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-black text-white font-playfair mb-1">Nenhuma categoria</h3>
                            <p className="text-slate-500 font-medium font-inter">Comece criando sua primeira categoria de produtos.</p>
                        </div>
                    ) : (
                        <CategoryTreeList
                            nodes={categories}
                            onEdit={(cat) => {
                                setEditingCategory(cat);
                                setName(cat.name);
                                setParentCategoryId(cat.parent_id);
                                setIsModalOpen(true);
                            }}
                            onDelete={async (id) => {
                                if (!window.confirm('Tem certeza? Isso excluirá todas as subcategorias vinculadas.')) return;
                                try {
                                    const { error } = await supabase
                                        .from('product_categories')
                                        .delete()
                                        .eq('id', id)
                                        .eq('organization_id', ORGANIZATION_ID);
                                    if (error) throw error;
                                    toast.success('Categoria excluída!');
                                    fetchData();
                                } catch (e) { 
                                    console.error('Error deleting category:', e);
                                    toast.error('Erro ao excluir categoria.'); 
                                }
                            }}
                            onAddSub={(parentId) => {
                                setEditingCategory(null);
                                setParentCategoryId(parentId);
                                setName('');
                                setIsModalOpen(true);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Premium Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-[#0d0d0d] border border-white/5 w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <form onSubmit={handleSaveCategory} className="flex flex-col h-full text-white">
                            <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#a61d24] tracking-widest mb-1">Catálogo</p>
                                    <h2 className="text-2xl md:text-3xl font-black text-white font-playfair">
                                        {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                                    </h2>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="p-3 bg-white/5 text-slate-400 rounded-2xl hover:text-white hover:bg-white/10 transition-all shadow-sm"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 md:p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1 flex items-center gap-2">
                                        <Tag className="w-3 h-3 text-[#a61d24]" /> Identificação da Categoria
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-6 font-bold text-white outline-none focus:border-[#a61d24] focus:bg-black/60 text-base md:text-lg transition-all shadow-sm"
                                        placeholder="Ex: Defumados Especiais"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1 flex items-center gap-2">
                                        <Layers className="w-3 h-3 text-[#a61d24]" /> Categoria Pai (Opcional)
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={parentCategoryId || ''}
                                            onChange={(e) => setParentCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-6 font-bold text-white outline-none focus:border-[#a61d24] focus:bg-black/60 text-base transition-all shadow-sm appearance-none"
                                        >
                                            <option value="" className="bg-[#0d0d0d] text-white">Nenhuma (Categoria Raiz)</option>
                                            {categoriesToSelect(categories)
                                                .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.id} className="bg-[#0d0d0d] text-white">
                                                        {cat.name}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:p-10 bg-black/20 border-t border-white/5 mt-auto">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full py-5 bg-[#a61d24] hover:bg-[#8d181e] wine-glow text-white rounded-[1.5rem] font-black text-sm md:text-base shadow-xl shadow-[#a61d24]/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-5 h-5" />
                                            <span>{editingCategory ? 'SALVAR ALTERAÇÕES' : 'CRIAR CATEGORIA'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminCategories;
