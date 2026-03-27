import React from 'react';
import { CHECKOUT_URL } from '../constants';
import { ArrowRight, Zap } from 'lucide-react';

interface ButtonProps {
  text: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  pulsing?: boolean;
  variant?: 'primary' | 'outline';
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
  text, 
  className = '', 
  fullWidth = false, 
  pulsing = false,
  variant = 'primary',
  onClick
}) => {
  
  const baseClasses = `
    group relative inline-flex items-center justify-center gap-4 px-8 py-4 
    rounded-2xl font-bold transition-all duration-300 transform 
    hover:scale-105 active:scale-95 shadow-xl overflow-hidden cursor-pointer
    ${fullWidth ? 'w-full' : 'w-auto'}
    ${className}
  `;

  // Updated to Botanical Theme
  const primaryClasses = `
    bg-brand-olive hover:bg-brand-leaf
    text-white hover:shadow-brand-olive/30 border border-transparent
  `;

  // Updated Outline to Botanical Theme
  const outlineClasses = `
    bg-transparent border-2 border-brand-olive text-brand-olive 
    hover:bg-brand-olive/10 hover:text-brand-leaf
  `;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <a
      href={onClick ? '#' : CHECKOUT_URL}
      onClick={handleClick}
      className={`${baseClasses} ${variant === 'primary' ? primaryClasses : outlineClasses}`}
    >
      {/* Shine Effect for Primary Button */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />
      )}
      
      <span className="relative z-20 flex items-center gap-4">
        {pulsing && <Zap className="fill-white animate-bounce" size={24} />}
        <span className="text-center leading-tight">
          {text}
        </span>
        <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform shrink-0" />
      </span>
    </a>
  );
};

export default Button;