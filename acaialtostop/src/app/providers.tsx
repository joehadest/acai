// src/app/providers.tsx

'use client'; // Este componente precisa ser um Client Component

import { CartProvider } from '../contexts/CartContext';
import { MenuProvider } from '../contexts/MenuContext';
import { StoreProvider } from '@/contexts/StoreContext';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            <MenuProvider>
                <StoreProvider>
                    {children}
                </StoreProvider>
            </MenuProvider>
        </CartProvider>
    );
}