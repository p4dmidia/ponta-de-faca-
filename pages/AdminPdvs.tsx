import React, { useState, useEffect } from 'react';
import {
    Store,
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    X,
    Phone,
    MapPin,
    FileText,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import { ORGANIZATION_ID } from '../lib/config';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Company {
    id: number;
    nome_fantasia: string;
    razao_social: string;
    responsavel: string;
    endereco: string;
    cnpj: string;
    email: string;
    telefone: string;
    billing_model: 'centralized' | 'consigned';
    stock_quantity: number;
    min_stock_limit: number;
    reorder_status: 'none' | 'pending' | 'completed';
    is_active?: boolean;
}

const AdminPdvs: React.FC = () => {
    const [pdvs, setPdvs] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form & Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPdv, setEditingPdv] = useState<Company | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    // Restock Modal
    const [selectedPdvToRestock, setSelectedPdvToRestock] = useState<Company | null>(null);
    const [restockAmount, setRestockAmount] = useState(15);
    
    // Delete Confirmation
    const [selectedPdvToDelete, setSelectedPdvToDelete] = useState<Company | null>(null);

    // Form fields
    const [nomeFantasia, setNomeFantasia] = useState('');
    const [razaoSocial, setRazaoSocial] = useState('');
    const [responsavel, setResponsavel] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [billingModel, setBillingModel] = useState<'centralized' | 'consigned'>('centralized');
    const [stockQuantity, setStockQuantity] = useState(15);
    const [minStockLimit, setMinStockLimit] = useState(5);

    useEffect(() => {
        fetchPdvs();
    }, []);

    const fetchPdvs = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .eq('is_active', true)
                .order('nome_fantasia', { ascending: true });

            if (error) throw error;
            setPdvs(data || []);
        } catch (error) {
            console.error('Error fetching PDVs:', error);
            toast.error('Erro ao carregar PDVs.');
        } finally {
            setIsLoading(false);
        }
    };

    // Open form for creating new PDV
    const handleOpenCreate = () => {
        setEditingPdv(null);
        setNomeFantasia('');
        setRazaoSocial('');
        setResponsavel('');
        setCnpj('');
        setEmail('');
        setTelefone('');
        setEndereco('');
        setBillingModel('centralized');
        setStockQuantity(15);
        setMinStockLimit(5);
        setIsFormOpen(true);
    };

    // Open form for editing existing PDV
    const handleOpenEdit = (pdv: Company) => {
        setEditingPdv(pdv);
        setNomeFantasia(pdv.nome_fantasia);
        setRazaoSocial(pdv.razao_social || pdv.nome_fantasia);
        setResponsavel(pdv.responsavel || '');
        setCnpj(pdv.cnpj);
        setEmail(pdv.email);
        setTelefone(pdv.telefone);
        setEndereco(pdv.endereco);
        setBillingModel(pdv.billing_model);
        setStockQuantity(pdv.stock_quantity);
        setMinStockLimit(pdv.min_stock_limit);
        setIsFormOpen(true);
    };

    // Save Form (Create or Edit)
    const handleSavePdv = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nomeFantasia || !razaoSocial || !responsavel || !cnpj || !email || !endereco) {
            toast.error('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsActionLoading(true);
        try {
            if (editingPdv) {
                // Edit
                const { error } = await supabase
                    .from('companies')
                    .update({
                        nome_fantasia: nomeFantasia,
                        razao_social: razaoSocial,
                        responsavel: responsavel,
                        cnpj: cnpj,
                        email: email,
                        telefone: telefone,
                        endereco: endereco,
                        billing_model: billingModel,
                        stock_quantity: stockQuantity,
                        min_stock_limit: minStockLimit,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingPdv.id);

                if (error) throw error;
                toast.success('PDV atualizado com sucesso!');
            } else {
                // Create
                const { error } = await supabase
                    .from('companies')
                    .insert([{
                        organization_id: ORGANIZATION_ID,
                        nome_fantasia: nomeFantasia,
                        razao_social: razaoSocial,
                        responsavel: responsavel,
                        senha_hash: 'not_used', // A autenticação real do portal do PDV é via Supabase Auth
                        cnpj: cnpj,
                        email: email,
                        telefone: telefone,
                        endereco: endereco,
                        billing_model: billingModel,
                        stock_quantity: stockQuantity,
                        min_stock_limit: minStockLimit,
                        reorder_status: 'none',
                        is_active: true
                    }]);

                if (error) throw error;
                toast.success('PDV cadastrado com sucesso!');
            }

            setIsFormOpen(false);
            fetchPdvs();
        } catch (error) {
            console.error('Error saving PDV:', error);
            toast.error('Erro ao salvar PDV.');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Fulfill Restock Request
    const handleRestock = async () => {
        if (!selectedPdvToRestock) return;
        setIsActionLoading(true);
        try {
            const newStock = (selectedPdvToRestock.stock_quantity || 0) + restockAmount;
            const { error } = await supabase
                .from('companies')
                .update({
                    stock_quantity: newStock,
                    reorder_status: 'none',
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedPdvToRestock.id);

            if (error) throw error;
            toast.success(`Estoque reabastecido com +${restockAmount} combos!`);
            setSelectedPdvToRestock(null);
            fetchPdvs();
        } catch (error) {
            console.error('Error restocking PDV:', error);
            toast.error('Erro ao reabastecer estoque.');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Soft Delete (Deactivate PDV)
    const handleDeletePdv = async () => {
        if (!selectedPdvToDelete) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedPdvToDelete.id);

            if (error) throw error;
            toast.success('PDV removido com sucesso!');
            setSelectedPdvToDelete(null);
            fetchPdvs();
        } catch (error) {
            console.error('Error deleting PDV:', error);
            toast.error('Erro ao remover PDV.');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Filtering logic
    const filteredPdvs = pdvs.filter(pdv =>
        pdv.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdv.cnpj.includes(searchTerm) ||
        pdv.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calc overall stats
    const totalPdvsCount = pdvs.length;
    const alertPdvsCount = pdvs.filter(pdv => pdv.stock_quantity <= pdv.min_stock_limit).length;
    const pendingReordersCount = pdvs.filter(pdv => pdv.reorder_status === 'pending').length;

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto pb-20 font-sans">
                
                {/* Header */}
                <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-display-lg text-white font-bold">Gestão de PDVs</h1>
                        <p className="text-on-surface-variant font-medium mt-1">
                            Cadastre Empórios parceiros e gerencie estoques descentralizados de combos defumados.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="bg-[#a61d24] hover:bg-[#8d181e] text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 wine-glow"
                    >
                        <Plus className="w-4 h-4" />
                        Cadastrar PDV
                    </button>
                </header>

                {/* Stats Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 flex items-center gap-4 shadow-md">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-white">
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total de PDVs</p>
                            <h3 className="text-2xl font-bold text-white leading-none">{totalPdvsCount}</h3>
                        </div>
                    </div>

                    <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 flex items-center gap-4 shadow-md">
                        <div className="w-12 h-12 rounded-2xl bg-amber-950/20 border border-amber-900/30 flex items-center justify-center text-amber-400">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Estoques Baixos</p>
                            <h3 className="text-2xl font-bold text-amber-400 leading-none">{alertPdvsCount}</h3>
                        </div>
                    </div>

                    <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 flex items-center gap-4 shadow-md">
                        <div className="w-12 h-12 rounded-2xl bg-[#a61d24]/10 border border-[#a61d24]/20 flex items-center justify-center text-[#a61d24]">
                            <RefreshCw className="w-6 h-6 animate-spin-slow" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Reposições Solicitadas</p>
                            <h3 className="text-2xl font-bold text-[#a61d24] leading-none">{pendingReordersCount}</h3>
                        </div>
                    </div>
                </div>

                {/* Filter and Table Container */}
                <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:max-w-md">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar PDV por nome, CNPJ ou e-mail..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-on-surface-variant/50 focus:border-[#a61d24] focus:outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={fetchPdvs}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Atualizar
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="w-10 h-10 border-t-2 border-[#a61d24] rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Carregando parceiros...</p>
                        </div>
                    ) : filteredPdvs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/30 border-b border-white/5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                        <th className="py-5 px-6">Empório / Contato</th>
                                        <th className="py-5 px-4">Endereço</th>
                                        <th className="py-5 px-4">Faturamento</th>
                                        <th className="py-5 px-4 text-center">Estoque Atual</th>
                                        <th className="py-5 px-4 text-center">Solicitação</th>
                                        <th className="py-5 px-6 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredPdvs.map((pdv) => {
                                        const isStockLow = pdv.stock_quantity <= pdv.min_stock_limit;
                                        const isReorderPending = pdv.reorder_status === 'pending';
                                        
                                        return (
                                            <tr key={pdv.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="py-6 px-6">
                                                    <span className="font-bold text-white block text-sm">{pdv.nome_fantasia}</span>
                                                    <span className="text-[10px] text-on-surface-variant block mt-1">CNPJ: {pdv.cnpj}</span>
                                                    <span className="text-[10px] text-on-surface-variant block mt-0.5">{pdv.email} • {pdv.telefone || 'Sem fone'}</span>
                                                </td>
                                                <td className="py-6 px-4 max-w-[200px]">
                                                    <div className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                                                        <MapPin className="w-3.5 h-3.5 text-[#a61d24] shrink-0 mt-0.5" />
                                                        <span className="line-clamp-2">{pdv.endereco}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                        pdv.billing_model === 'centralized'
                                                            ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30'
                                                            : 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30'
                                                    }`}>
                                                        {pdv.billing_model === 'centralized' ? 'Centralizado (Ponta D\'Faca)' : 'Consignado (PDV)'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className={`text-base font-bold ${
                                                            isStockLow ? 'text-amber-500 font-extrabold animate-pulse' : 'text-white'
                                                        }`}>
                                                            {pdv.stock_quantity}
                                                        </span>
                                                        <span className="text-[8px] text-on-surface-variant uppercase tracking-wider font-semibold">Min: {pdv.min_stock_limit}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    {isReorderPending ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-bold bg-[#a61d24]/10 border border-[#a61d24]/20 text-[#a61d24] uppercase tracking-wider animate-pulse">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Pendente
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-on-surface-variant font-semibold">Regular</span>
                                                    )}
                                                </td>
                                                <td className="py-6 px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {isReorderPending && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPdvToRestock(pdv);
                                                                    setRestockAmount(15);
                                                                }}
                                                                className="px-3 py-1.5 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                                                            >
                                                                Atender Reposição
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenEdit(pdv)}
                                                            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/5 transition-all"
                                                            title="Editar PDV"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedPdvToDelete(pdv)}
                                                            className="p-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded-lg transition-all"
                                                            title="Excluir PDV"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <Store className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
                            <h4 className="text-white font-bold mb-1">Nenhum PDV Encontrado</h4>
                            <p className="text-on-surface-variant text-xs max-w-xs mx-auto">
                                Não há parceiros comerciais cadastrados com esses filtros de busca.
                            </p>
                        </div>
                    )}
                </div>

                {/* MODAL: CREATE / EDIT FORM */}
                {isFormOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] max-w-xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="absolute right-6 top-6 text-on-surface-variant hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#a61d24] to-transparent"></div>

                            <h3 className="text-xl font-display-lg text-white font-bold mb-6">
                                {editingPdv ? 'Editar Empório Parceiro' : 'Cadastrar Novo Empório'}
                            </h3>

                            <form onSubmit={handleSavePdv} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Razão Social *</label>
                                        <input
                                            type="text"
                                            value={razaoSocial}
                                            onChange={(e) => setRazaoSocial(e.target.value)}
                                            placeholder="Ex: Empório Savassi LTDA"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Responsável *</label>
                                        <input
                                            type="text"
                                            value={responsavel}
                                            onChange={(e) => setResponsavel(e.target.value)}
                                            placeholder="Ex: Carlos Silva"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nome Fantasia *</label>
                                        <input
                                            type="text"
                                            value={nomeFantasia}
                                            onChange={(e) => setNomeFantasia(e.target.value)}
                                            placeholder="Ex: Empório Central"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">CNPJ *</label>
                                        <input
                                            type="text"
                                            value={cnpj}
                                            onChange={(e) => setCnpj(e.target.value)}
                                            placeholder="00.000.000/0001-00"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">E-mail de Contrato *</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="pdv@parceiro.com"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Telefone</label>
                                        <input
                                            type="text"
                                            value={telefone}
                                            onChange={(e) => setTelefone(e.target.value)}
                                            placeholder="(31) 99999-9999"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Endereço Completo *</label>
                                    <input
                                        type="text"
                                        value={endereco}
                                        onChange={(e) => setEndereco(e.target.value)}
                                        placeholder="Rua Sergipe, 1200 - Savassi, Belo Horizonte - MG"
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Regime de Faturamento *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                            onClick={() => setBillingModel('centralized')}
                                            className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${
                                                billingModel === 'centralized'
                                                    ? 'bg-[#a61d24]/5 border-[#a61d24] text-white font-bold'
                                                    : 'bg-black/40 border-white/5 text-on-surface-variant hover:border-white/10'
                                            }`}
                                        >
                                            <span className="block text-xs">Centralizado</span>
                                            <span className="text-[8px] opacity-70 block mt-0.5">Ponta D'Faca emite NFe</span>
                                        </div>
                                        <div
                                            onClick={() => setBillingModel('consigned')}
                                            className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${
                                                billingModel === 'consigned'
                                                    ? 'bg-[#a61d24]/5 border-[#a61d24] text-white font-bold'
                                                    : 'bg-black/40 border-white/5 text-on-surface-variant hover:border-white/10'
                                            }`}
                                        >
                                            <span className="block text-xs">Consignado</span>
                                            <span className="text-[8px] opacity-70 block mt-0.5">PDV emite NFe</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Quantidade em Estoque</label>
                                        <input
                                            type="number"
                                            value={stockQuantity}
                                            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                                            min="0"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Limite Mínimo de Alerta</label>
                                        <input
                                            type="number"
                                            value={minStockLimit}
                                            onChange={(e) => setMinStockLimit(parseInt(e.target.value) || 0)}
                                            min="0"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isActionLoading}
                                        className="px-5 py-3 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 wine-glow"
                                    >
                                        {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Salvar PDV
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: RESTOCK REQUEST */}
                {selectedPdvToRestock && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#a61d24] to-transparent"></div>
                            
                            <h3 className="text-xl font-display-lg text-white font-bold mb-2">Atender Reposição de Estoque</h3>
                            <p className="text-on-surface-variant text-xs leading-relaxed mb-5">
                                O empório <strong>{selectedPdvToRestock.nome_fantasia}</strong> solicitou reposição de combos. Informe a quantidade de combos a ser enviada fisicamente:
                            </p>

                            <div className="space-y-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Quantidade à Adicionar</label>
                                    <input
                                        type="number"
                                        value={restockAmount}
                                        onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                                        min="1"
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-[#a61d24] focus:outline-none font-bold text-center text-lg"
                                    />
                                </div>
                                <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex justify-between items-center text-xs">
                                    <span className="text-on-surface-variant">Novo estoque estimado:</span>
                                    <span className="font-bold text-white">{(selectedPdvToRestock.stock_quantity || 0) + restockAmount} combos</span>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setSelectedPdvToRestock(null)}
                                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleRestock}
                                    disabled={isActionLoading}
                                    className="px-5 py-3 bg-[#a61d24] hover:bg-[#8d181e] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 wine-glow"
                                >
                                    {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Confirmar Envio
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: DELETE CONFIRMATION */}
                {selectedPdvToDelete && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] max-w-md w-full p-8 shadow-2xl relative">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
                            
                            <h3 className="text-xl font-display-lg text-red-500 font-bold mb-2">Excluir Parceiro Comercial?</h3>
                            <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
                                Tem certeza de que deseja remover o parceiro <strong>{selectedPdvToDelete.nome_fantasia}</strong> do sistema? Esta ação é definitiva e ele não aparecerá mais como opção de retirada de lotes de cura para os clientes.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setSelectedPdvToDelete(null)}
                                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeletePdv}
                                    disabled={isActionLoading}
                                    className="px-5 py-3 bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                                >
                                    {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Excluir PDV
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
};

export default AdminPdvs;
