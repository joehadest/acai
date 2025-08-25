// src/app/layout.tsx

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import { StoreProvider } from '@/contexts/StoreContext';
import { MenuProvider } from '@/contexts/MenuContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
    themeColor: '#8b5cf6',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/settings`, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error('Falha ao buscar configurações');
    }

    const data = await res.json();
    const settings = data.data;
    const title = settings?.browserTitle || "Do'Cheff - Cardápio Digital";

    return {
      title: title,
      description: "Cardápio digital do Do'Cheff",
      manifest: '/manifest.json',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: title,
      },
    };
  } catch (error) {
    console.error("Erro ao gerar metadados:", error);
    return {
      title: "Do'Cheff - Cardápio Digital",
      description: "Cardápio digital do Do'Cheff",
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
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#8b5cf6" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <link rel="icon" href="/favicon/favicon.ico" type="image/x-icon" />
            </head>
            {/* CORREÇÃO AQUI */}
            <body className="bg-gray-100 min-h-screen">
                <MenuProvider>
                    <StoreProvider>
                        <Header />
                        <main className="min-h-screen">
                            {children}
                        </main>
                    </StoreProvider>
                </MenuProvider>
            </body>
        </html>
    );
}