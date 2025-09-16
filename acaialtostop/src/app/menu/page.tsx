'use client';
import React from 'react';
import MenuDisplay from '@/components/MenuDisplay';
import { MenuProvider } from '@/contexts/MenuContext';
import { CartProvider } from '@/contexts/CartContext';

export default function MenuPage() {
    return (
        <CartProvider>
            <MenuProvider>
                <main className="min-h-screen bg-[#262525]">
                    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-6 md:py-8">
                        <MenuDisplay />
                    </div>
                </main>
            </MenuProvider>
        </CartProvider>
    );
}