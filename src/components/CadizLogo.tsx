import React from 'react';

interface CadizLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showText?: boolean;
  variant?: 'full' | 'symbol' | 'badge';
  monochromeWhite?: boolean;
}

export const CadizLogo: React.FC<CadizLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  showText = true,
  variant = 'badge',
  monochromeWhite = false
}) => {
  const heightClass =
    size === 'xs'
      ? 'h-6'
      : size === 'sm'
      ? 'h-7 sm:h-8'
      : size === 'lg'
      ? 'h-11 sm:h-12'
      : size === 'xl'
      ? 'h-14 sm:h-16'
      : 'h-9 sm:h-10';

  // Si se solicita únicamente el símbolo / escudo de la Diputación
  if (variant === 'symbol' || !showText) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <img
          src="/icon.svg"
          alt="Diputación de Cádiz"
          className={`${heightClass} w-auto object-contain flex-shrink-0 ${
            monochromeWhite ? 'brightness-0 invert' : ''
          }`}
        />
      </div>
    );
  }

  // Si se solicita únicamente el logo completo (Símbolo + Texto oficial Diputación de Cádiz)
  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="bg-white p-1 rounded-lg">
          <img
            src="/logo-dipucadiz.svg"
            alt="Diputación de Cádiz"
            className={`${heightClass} w-auto object-contain flex-shrink-0`}
          />
        </div>
      </div>
    );
  }

  // Variante badge completa: Logo Oficial + Separador + Área de Desarrollo Local
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Logotipo Oficial Diputación Provincial de Cádiz */}
      <div className="bg-white p-1 rounded-lg shrink-0">
        <img
          src="/logo-dipucadiz.svg"
          alt="Diputación de Cádiz"
          className={`${heightClass} w-auto object-contain`}
        />
      </div>

      {/* Rótulo Institucional y Subtítulo de Área */}
      <div className="flex flex-col justify-center border-l border-slate-200 dark:border-slate-700 pl-3">
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-tight text-xs sm:text-sm uppercase leading-tight ${
              monochromeWhite ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            Área de Desarrollo Local
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#0063A2] text-white">
            ADL
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] sm:text-[11px] font-medium tracking-normal mt-0.5 truncate ${
              monochromeWhite ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Revisión Técnica y Planes Provinciales Base 14
          </span>
        )}
      </div>
    </div>
  );
};
