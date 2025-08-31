'use client';
import React, { useState, useEffect } from 'react';
import AdminOrders from '@/components/AdminOrders';
import AdminSettings from '@/components/AdminSettings';
import AdminMenu from '@/components/AdminMenu';

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
        <main className="min-h-screen bg-gray-100 text-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors"
                    >
                        Sair
                    </button>
                </div>
                <div className="mb-6 border-b border-gray-200">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'config' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Configurações
                        </button>
                        <button
                            onClick={() => setActiveTab('menu')}
                            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'menu' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Cardápio
                        </button>
                        <button
                            onClick={() => setActiveTab('pedidos')}
                            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'pedidos' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pedidos
                        </button>
                    </div>
                </div>

                {activeTab === 'config' ? <AdminSettings /> :
                    activeTab === 'menu' ? <AdminMenu /> :
                        <AdminOrders />}
            </div>
        </main>
    );
}