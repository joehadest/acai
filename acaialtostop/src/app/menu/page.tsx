'use client';
import React from 'react';
import MenuDisplay from '@/components/MenuDisplay';
import { MenuProvider } from '@/contexts/MenuContext';
import { CartProvider } from '@/contexts/CartContext';

export default function MenuPage() {
    return (
        <CartProvider>
            <MenuProvider>
                <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
                    {/* Elementos decorativos de fundo */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/10 rounded-full blur-3xl"></div>
                    </div>
                    
                    <div className="relative z-10 w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-6 md:py-8">
                        <MenuDisplay />
                    </div>
                </main>
            </MenuProvider>
        </CartProvider>
    );
}