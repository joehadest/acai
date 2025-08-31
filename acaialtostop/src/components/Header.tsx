// src/components/Header.tsx

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FaExclamationCircle } from 'react-icons/fa';
import { isRestaurantOpen } from '../utils/timeUtils';
import type { BusinessHoursConfig } from '../utils/timeUtils';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [businessHours, setBusinessHours] = useState<BusinessHoursConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({});
    const [lastMenuUpdate, setLastMenuUpdate] = useState<Date | null>(null);

    const checkOpenStatus = useCallback(() => {
        if (!businessHours) return false;
        return isRestaurantOpen(businessHours);
    }, [businessHours]);

    useEffect(() => {
        if (showInfo) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }, [showInfo]);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    setBusinessHours(data.data.businessHours);
                    setSettings(data.data);
                }
            } catch (err) {
                setBusinessHours(null);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    // Função para buscar última atualização do menu
    const fetchLastMenuUpdate = async () => {
        try {
            const res = await fetch('/api/menu');
            if (res.ok) {
                setLastMenuUpdate(new Date());
            }
        } catch (err) {
            // Silêncio em caso de erro
        }
    };

    // Buscar atualização inicial e configurar intervalo
    useEffect(() => {
        fetchLastMenuUpdate();
        const interval = setInterval(fetchLastMenuUpdate, 30000); // A cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    // Função para formatar tempo relativo
    const formatLastUpdate = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Atualizado agora';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `Atualizado há ${minutes}min`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `Atualizado há ${hours}h`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `Atualizado há ${days} dia${days > 1 ? 's' : ''}`;
        }
    };

    useEffect(() => {
        if (!businessHours) return;
        setIsOpen(checkOpenStatus());
        const interval = setInterval(() => {
            setIsOpen(checkOpenStatus());
        }, 60000);
        return () => clearInterval(interval);
    }, [businessHours, checkOpenStatus]);
    
    const renderBusinessHours = () => {
        if (!businessHours) {
            return <p>Carregando horários...</p>;
        }

        const dayLabels: { [key: string]: string } = {
            monday: 'Segunda',
            tuesday: 'Terça',
            wednesday: 'Quarta',
            thursday: 'Quinta',
            friday: 'Sexta',
            saturday: 'Sábado',
            sunday: 'Domingo',
        };

        const daysOrder: (keyof BusinessHoursConfig)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        return daysOrder.map(day => {
            const schedule = businessHours[day];
            const hoursString = schedule && schedule.open ? `${schedule.start} às ${schedule.end}` : 'Fechado';

            return (
                <div key={day} className="flex justify-between items-center">
                    <span className="text-gray-500 capitalize">{dayLabels[day]}:</span>
                    {hoursString === 'Fechado' ? (
                        <span className="text-red-500 font-medium">Fechado</span>
                    ) : (
                        <span className="text-gray-800 font-medium">{hoursString}</span>
                    )}
                </div>
            );
        });
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <Image
                        src={settings.logoUrl || "/logo.jpg"}
                        alt="Logo"
                        width={80}
                        height={80}
                        className="rounded-full bg-gray-200 shadow"
                        priority
                    />
                    <button
                        className="ml-2 bg-purple-600 text-white p-2 rounded-full shadow hover:bg-purple-700 transition-colors flex items-center justify-center"
                        onClick={() => setShowInfo(true)}
                        aria-label="Informações do restaurante"
                    >
                        <FaExclamationCircle className="w-5 h-5" />
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    {/* Indicador de atualização do menu */}
                    {lastMenuUpdate && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full"
                        >
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>{formatLastUpdate(lastMenuUpdate)}</span>
                        </motion.div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isOpen
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                            }`}
                        disabled={loading}
                    >
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOpen ? 'bg-green-400' : 'bg-gray-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isOpen ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        </span>
                        <span>{loading ? 'Carregando...' : isOpen ? 'Aberto' : 'Fechado'}</span>
                    </motion.button>
                </motion.div>
            </div>

            {/* Modal de informações do restaurante */}
            {showInfo && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300
                            }}
                            className="bg-white rounded-2xl shadow-2xl p-0 max-w-lg w-full mx-4 text-gray-800 border border-gray-200 relative max-h-[85vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{settings.restaurantName || ""}</h2>
                                        <p className="text-purple-100 text-sm">{settings.restaurantSubtitle || "Informações do Restaurante"}</p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="text-white/80 hover:text-white text-2xl"
                                        onClick={() => setShowInfo(false)}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </motion.button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">Horário de Funcionamento</h3>
                                    <div className="space-y-2 text-sm">{renderBusinessHours()}</div>
                                </div>
                                <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">Endereço</h3>
                                    <p className="text-gray-800">{settings.addressStreet || "Rua Fictícia"}</p>
                                    <p className="text-gray-500 text-sm">{settings.addressCity || "Cidade - UF"}</p>
                                </div>
                                <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">Contato</h3>
                                    <p className="text-gray-500 text-sm">Telefone/WhatsApp:</p>
                                    <p className="text-gray-800 font-medium">{settings.contactPhone || "(00) 00000-0000"}</p>
                                </div>
                                <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">Formas de Pagamento</h3>
                                    <p className="text-sm text-gray-600">{settings.paymentMethods || "Cartão, PIX e dinheiro"}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}
        </header>
    );
}