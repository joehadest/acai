'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RestaurantStatus } from '@/types';

// Interface para o que o Contexto vai fornecer
interface MenuContextType {
    isOpen: boolean;
    toggleOpen: () => void;
    status: RestaurantStatus | null;
    loading: boolean;
    error: string | null;
    isHeaderVisible: boolean;
    setIsHeaderVisible: (visible: boolean) => void;
}

// --- CORREÇÃO 1: Exportar o Context ---
export const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const [status, setStatus] = useState<RestaurantStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    const toggleOpen = () => {
        setIsOpen(prev => !prev);
    };

    // --- CORREÇÃO 3: Fornecer as categorias no 'value' do Provider ---
    const providerValue = {
        isOpen,
        toggleOpen,
        status,
        loading,
        error,
        isHeaderVisible,
        setIsHeaderVisible
    };

    return (
        <MenuContext.Provider value={providerValue}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error('useMenu deve ser usado dentro de um MenuProvider');
    }
    return context;
}