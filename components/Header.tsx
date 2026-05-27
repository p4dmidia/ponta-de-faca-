import React, { useState } from 'react';
import { Menu, X, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-2 md:py-1 w-full max-w-7xl mx-auto">
        
        {/* Desktop Left Navigation */}
        <div className="hidden md:flex items-center gap-8">
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
            className="h-24 md:h-28 w-auto object-contain" 
          />
        </Link>

        {/* Right Navigation & Red Button */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-8">
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
            className="bg-[#a61d24] text-white px-5 py-2.5 font-label-lg text-label-lg rounded-DEFAULT hover:bg-[#8d181e] transition-all active:scale-95 wine-glow cursor-pointer font-semibold uppercase tracking-wider text-xs md:text-sm"
            href="#planos"
          >
            Assinar Agora
          </a>

          {/* Entrar Button with User Icon */}
          <Link 
            to="/login"
            className="text-on-surface hover:text-primary transition-colors duration-300 flex items-center justify-center w-10 h-10 border border-white/10 hover:border-[#a61d24]/50 rounded-full bg-white/[0.02] shrink-0"
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
