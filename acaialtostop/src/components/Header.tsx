// src/components/Header.tsx

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FaExclamationCircle, FaMapMarkerAlt, FaClock, FaPhoneAlt, FaMoneyBillWave } from 'react-icons/fa';
import { isRestaurantOpen } from '../utils/timeUtils';
import type { BusinessHoursConfig } from '../utils/timeUtils';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [businessHours, setBusinessHours] = useState<BusinessHoursConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({});
    // Altura fixa definida via layout (--header-height). Removido cálculo dinâmico.

    const checkOpenStatus = useCallback(() => {
        if (!businessHours) return false;
        return isRestaurantOpen(businessHours);
    }, [businessHours]);

    useEffect(() => {
        if (showInfo) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        // Garante que o scroll seja restaurado quando o componente for desmontado
        return () => {
            document.body.style.overflow = 'auto';
        };
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
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 py-2 h-24 flex justify-between items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <Image
                        src={settings.logoUrl || "/logo.jpg"}
                        alt="Logo"
                        width={64}
                        height={64}
                        className="rounded-full bg-gray-200 shadow-sm border border-gray-300 object-cover"
                        priority
                    />
                    <button
                        className="ml-2 bg-purple-600 text-white p-2 rounded-full shadow-sm hover:bg-purple-700 transition-colors flex items-center justify-center"
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
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium tracking-wide ${isOpen
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
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
                                                    transition={{ duration: 0.25 }}
                                                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-16"
                                                    onClick={() => setShowInfo(false)}
                                                >
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9, y: 24 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, y: 24 }}
                                                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                                                            className="relative w-full max-w-xl rounded-3xl overflow-hidden border border-gray-200 shadow-2xl bg-white"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <div className="relative">
                                            <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 px-6 py-5 flex items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                                                        {settings.restaurantName || 'Estabelecimento'}
                                                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'} shadow`}></span>
                                                    </h2>
                                                    <p className="text-purple-100 text-xs mt-1 leading-snug">{settings.restaurantSubtitle || 'Informações do estabelecimento'}</p>
                                                </div>
                                                <motion.button
                                                    whileHover={{ rotate: 90, scale: 1.05 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setShowInfo(false)}
                                                    aria-label="Fechar"
                                                    className="text-white/70 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </motion.button>
                                            </div>
                                              <div className="px-6 pt-5 pb-4 space-y-5 max-h-[62vh] overflow-y-auto">
                                                <section className="group relative">
                                                    <header className="flex items-center gap-2 mb-2">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600"><FaClock className="w-4 h-4"/></span>
                                                        <h3 className="font-semibold text-gray-800 text-sm tracking-wide">Horários</h3>
                                                    </header>
                                                      <div className="rounded-2xl border border-purple-100/60 bg-white p-4 shadow-sm space-y-1 text-sm">
                                                        {renderBusinessHours()}
                                                    </div>
                                                </section>
                                                <section className="group">
                                                    <header className="flex items-center gap-2 mb-2">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600"><FaMapMarkerAlt className="w-4 h-4"/></span>
                                                        <h3 className="font-semibold text-gray-800 text-sm tracking-wide">Endereço</h3>
                                                    </header>
                                                      <div className="rounded-2xl border border-purple-100/60 bg-white p-4 shadow-sm text-sm leading-relaxed">
                                                        <p className="font-medium text-gray-700">{settings.addressStreet || 'Rua Fictícia'}</p>
                                                        <p className="text-gray-500">{settings.addressCity || 'Cidade - UF'}</p>
                                                    </div>
                                                </section>
                                                <section className="group">
                                                    <header className="flex items-center gap-2 mb-2">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600"><FaPhoneAlt className="w-4 h-4"/></span>
                                                        <h3 className="font-semibold text-gray-800 text-sm tracking-wide">Contato</h3>
                                                    </header>
                                                      <div className="rounded-2xl border border-purple-100/60 bg-white p-4 shadow-sm text-sm">
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Telefone / WhatsApp</p>
                                                        <p className="font-semibold text-gray-700 text-base">{settings.contactPhone || '(00) 00000-0000'}</p>
                                                    </div>
                                                </section>
                                                <section className="group">
                                                    <header className="flex items-center gap-2 mb-2">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600"><FaMoneyBillWave className="w-5 h-5"/></span>
                                                        <h3 className="font-semibold text-gray-800 text-sm tracking-wide">Pagamento</h3>
                                                    </header>
                                                      <div className="rounded-2xl border border-purple-100/60 bg-white p-4 shadow-sm text-sm">
                                                        <p className="text-gray-600 leading-relaxed">{settings.paymentMethods || 'Cartão, PIX e dinheiro'}</p>
                                                    </div>
                                                </section>
                                            </div>
                                            <div className="px-6 pb-5 pt-3 flex items-center justify-end gap-3 bg-gradient-to-b from-transparent to-white/60">
                                                <button onClick={()=> setShowInfo(false)} className="text-sm font-medium px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.97] transition disabled:opacity-50">Fechar</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </AnimatePresence>
                        )}
        </header>
    );
}