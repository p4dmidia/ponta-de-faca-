import React, { useEffect, useState, useCallback } from 'react';
import Tree from 'react-d3-tree';
import { ORGANIZATION_ID } from '../lib/config';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface AffiliateNode {
    name: string;
    attributes?: {
        email?: string;
        level?: number;
        id?: string;
    };
    children?: AffiliateNode[];
}

interface AffiliateNetworkProps {
    rootAffiliateId?: string;
}

export const AffiliateNetwork: React.FC<AffiliateNetworkProps> = ({ rootAffiliateId }) => {
    const [treeData, setTreeData] = useState<AffiliateNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(0.8);

    const containerRef = useCallback((containerElem: HTMLDivElement | null) => {
        if (containerElem !== null) {
            const { width, height } = containerElem.getBoundingClientRect();
            setTranslate({ x: width / 2, y: height / 5 });
        }
    }, []);

    const pruneTree = (node: AffiliateNode, depth: number): AffiliateNode => {
        if (depth >= 3) {
            return {
                ...node,
                children: [] // Limita estritamente a 3 gerações
            };
        }
        return {
            ...node,
            children: (node.children || []).map(child => pruneTree(child, depth + 1))
        };
    };

    const buildTree = async (rootId: string): Promise<AffiliateNode | null> => {
        try {
            console.log('DEBUG: Buscando rede para org:', ORGANIZATION_ID);

            // Fetch all relevant affiliates for this organization
            const { data: allAffiliates, error } = await supabase
                .from('affiliates')
                .select('id, full_name, email, sponsor_id')
                .eq('organization_id', ORGANIZATION_ID);
            
            console.log('DEBUG: Afiliados encontrados na rede:', allAffiliates?.length);

            if (error) throw error;

            const affiliateMap = new Map<string, AffiliateNode>();

            // First pass: Create all nodes
            allAffiliates.forEach(aff => {
                affiliateMap.set(aff.id, {
                    name: aff.full_name || 'Sem nome',
                    attributes: {
                        email: aff.email,
                        id: aff.id
                    },
                    children: []
                });
            });

            // Second pass: Build hierarchy
            let rootNode: AffiliateNode | null = null;

            allAffiliates.forEach(aff => {
                const node = affiliateMap.get(aff.id)!;
                if (aff.id === rootId) {
                    rootNode = node;
                } else if (aff.sponsor_id && affiliateMap.has(aff.sponsor_id)) {
                    affiliateMap.get(aff.sponsor_id)!.children!.push(node);
                }
            });

            if (!rootNode) {
                const { data: specificRoot } = await supabase
                    .from('affiliates')
                    .select('id, full_name, email')
                    .eq('id', rootId)
                    .single();

                if (specificRoot) {
                    rootNode = {
                        name: specificRoot.full_name || 'Sem nome',
                        attributes: {
                            email: specificRoot.email,
                            id: specificRoot.id
                        },
                        children: []
                    };
                    // Add children that have this root as sponsor
                    allAffiliates.forEach(aff => {
                        if (aff.sponsor_id === rootId) {
                            rootNode?.children?.push(affiliateMap.get(aff.id)!);
                        }
                    });
                }
            }

            // Pruning: Limit tree strictly to 3 levels (Geração 1, 2 e 3)
            if (rootNode) {
                rootNode = pruneTree(rootNode, 0);
            }

            return rootNode;
        } catch (err: any) {
            console.error('Error building tree:', err);
            return null;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            let id = rootAffiliateId;

            if (!id) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('affiliates')
                        .select('id')
                        .eq('user_id', user.id)
                        .single();
                    if (profile) id = profile.id;
                }
            }

            if (id) {
                const data = await buildTree(id);
                if (data) {
                    setTreeData(data);
                } else {
                    setError('Não foi possível carregar os dados da rede.');
                }
            } else {
                setError('Usuário não identificado.');
            }

            setLoading(false);
        };

        loadData();
    }, [rootAffiliateId]);

    const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
        const isRoot = nodeDatum.attributes?.id === rootAffiliateId;
        const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;

        return (
            <g>
                <foreignObject
                    width="160"
                    height="160"
                    x="-80"
                    y="-40"
                    className="overflow-visible"
                >
                    <div className="flex flex-col items-center justify-center cursor-pointer group" onClick={toggleNode}>
                        {/* Avatar Container */}
                        <div className={`
                            relative w-20 h-20 rounded-full p-1 transition-all duration-300
                            ${isRoot ? 'bg-gradient-to-tr from-[#a61d24] to-[#f43f5e]' : 'bg-white/10 border border-white/5'}
                            group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(166,29,36,0.3)]
                        `}>
                            <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-white/10 flex items-center justify-center">
                                <img
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${nodeDatum.attributes?.email || nodeDatum.name}`}
                                    alt={nodeDatum.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            {/* Expand/Collapse Indicator */}
                            {hasChildren && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#a61d24] text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0d0d0d] text-[10px] font-black">
                                    {nodeDatum.__rd3t.collapsed ? '+' : '-'}
                                </div>
                            )}
                        </div>

                        {/* Name Label */}
                        <div className="mt-3 text-center">
                            <p className="text-sm font-black text-white leading-none mb-1 group-hover:text-[#a61d24] transition-colors">
                                {nodeDatum.name.split(' ')[0]}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 px-2 py-0.5 bg-white/[0.02] rounded-full border border-white/5 uppercase tracking-wider">
                                {nodeDatum.attributes?.email?.split('@')[0] || 'Afiliado'}
                            </p>
                        </div>
                    </div>
                </foreignObject>
            </g>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] shadow-2xl">
                <Loader2 className="w-10 h-10 text-[#a61d24] animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Construindo sua rede...</p>
            </div>
        );
    }

    if (error || !treeData) {
        return (
            <div className="flex items-center justify-center h-[500px] bg-[#0d0d0d] border border-red-950/20 rounded-[2.5rem] shadow-2xl">
                <p className="text-red-400 font-bold">{error || 'Dados indisponíveis'}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[600px] bg-black border border-white/5 rounded-[2.5rem] overflow-hidden" ref={containerRef}>
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                <div className="bg-[#0d0d0d]/85 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#a61d24]"></div>
                        <span>Arraste para mover</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                        <span>Scroll para zoom</span>
                    </div>
                </div>
            </div>

            <Tree
                data={treeData}
                translate={translate}
                scaleExtent={{ min: 0.2, max: 1.5 }}
                zoom={zoom}
                orientation="vertical"
                pathFunc="step"
                renderCustomNodeElement={renderCustomNode}
                separation={{ siblings: 1.5, nonSiblings: 2 }}
                nodeSize={{ x: 220, y: 180 }}
                styles={{
                    links: {
                        stroke: 'rgba(255, 255, 255, 0.1)',
                        strokeWidth: 2,
                        strokeDasharray: '4,4'
                    }
                }}
            />
        </div>
    );
};
