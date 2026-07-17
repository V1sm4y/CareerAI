import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/5 bg-dark-800/60 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
      </div>
    </header>
  );
}
