// src/app/layout.tsx

import './globals.css';
import type { Metadata, Viewport } from 'next';
import ConditionalHeader from '@/components/ConditionalHeader';
import { Providers } from './providers'; // Importe o novo componente

// ... (a função generateMetadata continua a mesma) ...
export async function generateMetadata(): Promise<Metadata> {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BASE_URL) {
    // Mock para build sem API disponível
    return {
      title: "Açai Alto Stop - Cardápio Digital",
      description: "Cardápio digital do Açai Alto Stop",
    };
  }
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/settings`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Falha ao buscar configurações');
    }
    const data = await res.json();
    const settings = data.data;
    const title = settings?.browserTitle || "Açai Alto Stop - Cardápio Digital";
    return {
      title: title,
      description: "Cardápio digital do Açai Alto Stop",
      manifest: '/favicon/site.webmanifest',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: title,
      },
    };
  } catch (error) {
    console.error("Erro ao gerar metadados:", error);
    return {
      title: "Açai Alto Stop - Cardápio Digital",
      description: "Cardápio digital do Açai Alto Stop",
    };
  }
}


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <head>
                {/* ... (o head continua o mesmo) ... */}
                <link rel="icon" href="/favicon/favicon.ico" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
                <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
                {/* ... (o head continua o mesmo) ... */}
            </head>
      <body className="bg-gray-100 min-h-screen m-0">
        <ConditionalHeader />
        <Providers>
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
    );
}