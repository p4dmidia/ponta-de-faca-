import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-lowest border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-section-gap w-full max-w-7xl mx-auto gap-12">
        <div className="flex flex-col items-center md:items-start gap-4">
          <span className="font-headline-md text-headline-md text-primary">Ponta D'Faca</span>
          <p className="font-body-md text-body-md text-on-surface-variant text-center md:text-left max-w-xs">
            © 2026 Ponta D'Faca Charcutaria. A Arte da Cura Lenta.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-12">
          <div className="flex flex-col gap-4">
            <h4 className="font-label-lg text-label-lg text-primary">INSTITUCIONAL</h4>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 hover:underline decoration-primary decoration-1 underline-offset-4" href="#">
              Termos de Uso
            </a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 hover:underline decoration-primary decoration-1 underline-offset-4" href="#">
              Política de Privacidade
            </a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-label-lg text-label-lg text-primary">SUPORTE</h4>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 hover:underline decoration-primary decoration-1 underline-offset-4" href="#">
              Envio e Devoluções
            </a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 hover:underline decoration-primary decoration-1 underline-offset-4" href="#">
              FAQ
            </a>
          </div>
        </div>

        <div className="flex gap-6">
          <a className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full hover:border-primary transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">photo_camera</span>
          </a>
          <a className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full hover:border-primary transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">video_library</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
