"use client";
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR, renderiza um placeholder com a mesma estrutura para evitar mismatch
  if (!mounted) {
    return (
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40 w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 h-24"></div>
      </header>
    );
  }

  if (pathname.startsWith('/admin')) return null;
  return <Header />;
}
