import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Filter } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
}

interface CategorySidebarProps {
  categories: Category[];
  activeCategoryId: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeCategoryId,
  onCategorySelect
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Build the tree structure
  const buildTree = (cats: Category[]): CategoryNode[] => {
    const map = new Map<number | null, CategoryNode[]>();
    cats.forEach(cat => {
      const node = { ...cat, children: [] };
      if (!map.has(cat.parent_id)) map.set(cat.parent_id, []);
      map.get(cat.parent_id)!.push(node);
    });

    const resolveChildren = (parentId: number | null): CategoryNode[] => {
      const children = map.get(parentId) || [];
      return children.map(child => ({
        ...child,
        children: resolveChildren(child.id)
      }));
    };

    return resolveChildren(null);
  };

  const tree = buildTree(categories);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedIds(newExpanded);
  };

  const renderNodes = (nodes: CategoryNode[], level = 0) => {
    return (
      <ul className={`space-y-1 ${level > 0 ? 'pl-4 border-l border-white/5 mt-1' : ''}`}>
        {nodes.map(node => {
          const isActive = activeCategoryId === node.id;
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = expandedIds.has(node.id);

          return (
            <li key={node.id}>
              <div
                className={`flex items-center justify-between text-sm py-2 px-2 rounded-lg cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-[#a61d24]/10 text-[#a61d24] font-bold' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                onClick={(e) => {
                  onCategorySelect(node.id);
                  if (hasChildren) {
                    const newExpanded = new Set(expandedIds);
                    if (newExpanded.has(node.id)) newExpanded.delete(node.id);
                    else newExpanded.add(node.id);
                    setExpandedIds(newExpanded);
                  }
                }}
              >
                <span className="text-sm truncate font-medium">{node.name}</span>
                {hasChildren && (
                  <div className={`p-1 rounded-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className={`w-4 h-4 ${isActive ? 'text-[#a61d24]' : 'text-slate-500'}`} />
                  </div>
                )}
              </div>
              {hasChildren && isExpanded && (
                <div className="overflow-hidden animate-in slide-in-from-top-1 duration-200">
                  {renderNodes(node.children, level + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#a61d24]" />
          Categorias
        </h3>
        <div className="h-1 w-12 bg-[#a61d24] rounded-full"></div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onCategorySelect(null)}
          className={`text-sm w-full text-left py-2 px-2 rounded-lg transition-colors ${activeCategoryId === null ? 'bg-[#a61d24]/10 text-[#a61d24] font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
        >
          Todos os Produtos
        </button>
        {renderNodes(tree)}
      </div>
    </div>
  );
};

export default CategorySidebar;
