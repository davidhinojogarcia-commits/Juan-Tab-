import React from 'react';

interface CadizOfficialLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const CadizOfficialLogo: React.FC<CadizOfficialLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false
}) => {
  const iconSize = size === 'sm' ? 'h-7 w-auto' : size === 'lg' ? 'h-11 w-auto' : 'h-9 w-auto';
  const titleSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const subtitleSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-2.5">
        {/* Emblema oficial azul de la Diputación de Cádiz */}
        <img
          src="/icon.svg"
          alt="Diputación de Cádiz"
          className={`${iconSize} object-contain shrink-0`}
        />

        {/* Texto Diputación de Cádiz */}
        <div className="flex flex-col justify-center leading-tight">
          <span className={`font-semibold text-slate-800 ${titleSize} tracking-tight`}>
            Diputación
          </span>
          <span className={`font-semibold text-slate-800 ${titleSize} tracking-tight -mt-0.5`}>
            de Cádiz
          </span>
        </div>

        {/* Línea divisoria vertical */}
        <div className="h-7 w-px bg-[#004F90]/40 mx-0.5" />

        {/* Rótulo Planifica v1.0 en azul oficial + Subtítulo */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col justify-center leading-tight">
            <span className="font-extrabold text-[#004F90] text-sm tracking-tight flex items-center gap-1.5">
              <span>Planifica</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#004F90]/10 text-[#004F90] text-[10px] font-black font-mono tracking-tight border border-[#004F90]/20">
                v1.0
              </span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-tight line-clamp-1">
              Gestión Integral de Planes, Programas y Convenios
            </span>
          </div>
        </div>
      </div>

      {/* Subtítulo extendido */}
      {showSubtitle && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
          <span className="font-black text-sm text-[#004F90] tracking-wider">
            Planifica v1.0
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
            Gestión Integral de Planes,<br />Programas y Convenios
          </span>
        </div>
      )}
    </div>
  );
};
