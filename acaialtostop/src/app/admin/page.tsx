'use client';
import React, { useState, useEffect } from 'react';
import AdminOrders from '@/components/AdminOrders';
import AdminSettings from '@/components/AdminSettings';
import AdminMenu from '@/components/AdminMenu';
import AdminHeader from '@/components/AdminHeader';

export default function AdminPanel() {
    // Função para sair do painel admin
    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('isAuthenticated');
            document.cookie = 'isAuthenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/admin/login';
        }
    };
    // Verifica autenticação ao acessar o painel admin
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isLogged = !!localStorage.getItem('isAuthenticated') || !!document.cookie.includes('isAuthenticated=true');
            if (!isLogged) {
                window.location.href = '/admin/login';
            }
        }
    }, []);
    const [activeTab, setActiveTab] = useState<'config' | 'pedidos' | 'menu'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('adminActiveTab') as 'config' | 'pedidos' | 'menu') || 'config';
        }
        return 'config';
    });

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
            <AdminHeader active={activeTab} onChange={setActiveTab} onLogout={handleLogout} />
            <div className="flex-1 w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 sm:py-5 lg:py-8">
                <div className="w-full bg-white/60 backdrop-blur-sm shadow-sm ring-1 ring-gray-200 p-3 sm:p-4 md:p-6 rounded-none sm:rounded-lg">
                    {activeTab === 'config' ? <AdminSettings /> : activeTab === 'menu' ? <AdminMenu /> : <AdminOrders />}
                </div>
            </div>
        </main>
    );
}