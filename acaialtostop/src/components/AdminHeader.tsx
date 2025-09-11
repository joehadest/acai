"use client";
import React from 'react';

interface Props {
  active: 'config'|'pedidos'|'menu';
  onChange: (tab: 'config'|'pedidos'|'menu') => void;
  onLogout: () => void;
}

const tabs: { key: Props['active']; label: string }[] = [
  { key: 'config', label: 'Configurações' },
  { key: 'menu', label: 'Cardápio' },
  { key: 'pedidos', label: 'Pedidos' }
];

export default function AdminHeader({ active, onChange, onLogout }: Props) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-inner flex-shrink-0">
            AÇ
          </div>
          <div className="leading-tight min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-semibold text-gray-800 truncate">Painel Administrativo</h1>
            <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">Açai Alto Stop</p>
          </div>
        </div>
        <nav className="hidden md:flex flex-1 items-center justify-center">
          <ul className="flex gap-4 lg:gap-6">
            {tabs.map(t => (
              <li key={t.key}>
                <button
                  onClick={() => onChange(t.key)}
                  className={`relative px-2 pb-1 pt-2 text-xs font-medium tracking-wide transition-colors ${active === t.key ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t.label}
                  {active === t.key && (
                    <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {/* Menu mobile */}
        <div className="md:hidden flex items-center gap-2">
          <select
            value={active}
            onChange={(e) => onChange(e.target.value as Props['active'])}
            className="text-xs bg-gray-50 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {tabs.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onLogout}
            className="group relative inline-flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-md bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-semibold shadow hover:from-rose-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-rose-500 transition-all duration-200"
            title="Sair do painel"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
              <path d="M16 12H9" />
              <path d="M13 9l3 3-3 3" />
            </svg>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}