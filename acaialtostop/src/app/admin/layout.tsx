import React from 'react';

export const metadata = { title: 'Painel Administrativo - Açai Alto Stop' };

// Layout agora apenas remove o Header global e deixa o AdminHeader interno da page cuidar do topo.
export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {children}
    </div>
  );
}
