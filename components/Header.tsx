import React, { useState } from 'react';
import { Menu, X, User, ShoppingBag, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, setIsCartOpen } = useCart();
  const isHome = location.pathname === '/' || location.pathname === '';

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, selector: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (isHome) {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = `/${selector}`;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/shop?q=${encodeURIComponent(headerSearch.trim())}`);
      setHeaderSearch('');
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-2 md:py-1 w-full max-w-7xl mx-auto">
        
        {/* Desktop Left Navigation & Search */}
        <div className="hidden md:flex items-center gap-6">
          <a 
            onClick={(e) => handleScroll(e, '#clube')} 
            className="font-label-lg text-label-lg text-primary border-b-2 border-primary pb-1 cursor-pointer transition-colors duration-300"
            href="#clube"
          >
            Clube
          </a>
          <a 
            onClick={(e) => handleScroll(e, '#planos')} 
            className="font-label-lg text-label-lg text-on-surface hover:text-primary cursor-pointer transition-colors duration-300"
            href="#planos"
          >
            Planos
          </a>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#a61d24] focus:ring-1 focus:ring-[#a61d24] w-36 transition-all duration-300 focus:w-48"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          </form>
        </div>

        {/* Central Logo (PNG Image) */}
        <Link 
          className="flex items-center justify-center hover:opacity-90 transition-opacity" 
          to="/"
          onClick={() => setIsMenuOpen(false)}
        >
          <img 
            src="/assets/logo-ponta.png" 
            alt="PONTA D'FACA" 
            className="h-14 md:h-18 w-auto object-contain" 
          />
        </Link>

        {/* Right Navigation & Red Button */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:flex items-center gap-6">
            <a 
              onClick={(e) => handleScroll(e, '#combos')} 
              className="font-label-lg text-label-lg text-on-surface hover:text-primary cursor-pointer transition-colors duration-300"
              href="#combos"
            >
              Combos
            </a>
            <Link 
              className="font-label-lg text-label-lg text-on-surface hover:text-primary transition-colors duration-300" 
              to="/register?type=affiliate"
            >
              Afiliados
            </Link>
          </div>
          
          <a 
            onClick={(e) => handleScroll(e, '#planos')}
            className="bg-[#a61d24] text-white px-4 py-2.5 font-label-lg text-label-lg rounded-DEFAULT hover:bg-[#8d181e] transition-all active:scale-95 wine-glow cursor-pointer font-semibold uppercase tracking-wider text-xs"
            href="#planos"
          >
            Assinar Agora
          </a>

          {/* Cart Icon */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="text-on-surface hover:text-primary transition-colors duration-300 flex items-center justify-center w-10 h-10 border border-white/10 hover:border-[#a61d24]/50 rounded-full bg-white/[0.02] relative shrink-0"
            title="Ver carrinho"
          >
            <ShoppingBag className="w-5 h-5 text-white hover:text-[#a61d24]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#a61d24] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center wine-glow shadow-md">
                {cartCount}
              </span>
            )}
          </button>

          {/* Entrar Button with User Icon (Hidden on mobile) */}
          <Link 
            to="/login"
            className="hidden sm:flex text-on-surface hover:text-primary transition-colors duration-300 items-center justify-center w-10 h-10 border border-white/10 hover:border-[#a61d24]/50 rounded-full bg-white/[0.02] shrink-0"
            title="Entrar na minha conta"
          >
            <User className="w-5 h-5 text-[#a61d24]" />
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-on-surface hover:text-primary transition-colors focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/5 px-margin-mobile py-6 space-y-4 shadow-2xl flex flex-col items-center">
          {/* Mobile Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full mb-2">
            <input
              type="text"
              placeholder="Pesquisar na loja..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#a61d24]"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </form>

          <a 
            onClick={(e) => handleScroll(e, '#clube')} 
            className="w-full text-center py-2 font-label-lg text-label-lg text-on-surface hover:text-primary transition-colors duration-300"
            href="#clube"
          >
            Clube
          </a>
          <a 
            onClick={(e) => handleScroll(e, '#planos')} 
            className="w-full text-center py-2 font-label-lg text-label-lg text-on-surface hover:text-primary transition-colors duration-300"
            href="#planos"
          >
            Planos
          </a>
          <a 
            onClick={(e) => handleScroll(e, '#combos')} 
            className="w-full text-center py-2 font-label-lg text-label-lg text-on-surface hover:text-primary transition-colors duration-300"
            href="#combos"
          >
            Combos
          </a>
          <Link 
            to="/register?type=affiliate"
            onClick={() => setIsMenuOpen(false)}
            className="w-full text-center py-2 font-label-lg text-label-lg text-on-surface hover:text-primary transition-colors duration-300"
          >
            Afiliados
          </Link>
          <Link 
            to="/login"
            onClick={() => setIsMenuOpen(false)}
            className="w-full text-center py-2 font-label-lg text-label-lg text-on-surface hover:text-primary transition-colors duration-300"
          >
            Entrar (Cliente)
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
