// src/app/page.tsx

'use client';
import React, { useState, useEffect } from 'react';
import MenuDisplay from '@/components/MenuDisplay';
import RecentOrders from '@/components/RecentOrders';
import { FaExclamationCircle } from 'react-icons/fa';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
    const [hasNotification, setHasNotification] = useState(false);

    useEffect(() => {
        const checkNotifications = () => {
            const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
            if (notifyOrders.length > 0) {
                setHasNotification(true);
            }
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-center mb-8">
                    <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
                        <button
                            onClick={() => setActiveTab('menu')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-gray-600 hover:text-gray-900 ${activeTab === 'menu' ? 'bg-gray-100 text-purple-600' : ''}`}
                        >
                            Cardápio
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('orders');
                                setHasNotification(false);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-gray-600 hover:text-gray-900 ${activeTab === 'orders' ? 'bg-gray-100 text-purple-600' : ''} flex items-center gap-1`}
                        >
                            Pedidos
                            {hasNotification && (
                                <FaExclamationCircle className="text-purple-500 text-[8px]" />
                            )}
                        </button>
                    </div>
                </div>
                {activeTab === 'menu' ? <MenuDisplay /> : <RecentOrders />}
            </div>
        </main>
    );
}