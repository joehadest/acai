// src/components/Header.tsx

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FaExclamationCircle, FaMapMarkerAlt, FaClock, FaPhoneAlt, FaMoneyBillWave, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { isRestaurantOpen } from '../utils/timeUtils';
import type { BusinessHoursConfig } from '../utils/timeUtils';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [businessHours, setBusinessHours] = useState<BusinessHoursConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({});
    const [mounted, setMounted] = useState(false);

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

    useEffect(() => { setMounted(true); }, []);

    const renderBusinessHours = () => {
        if (!businessHours) {
            return <p>Carregando horários...</p>;
        }

        const dayLabels: { [key: string]: string } = {
            monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
            thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
        };

        const daysOrder: (keyof BusinessHoursConfig)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        return daysOrder.map(day => {
            const schedule = businessHours[day];
            const hoursString = schedule && schedule.open ? `${schedule.start} às ${schedule.end}` : 'Fechado';
            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;

            return (
                <div key={day} className={`flex justify-between items-center text-sm ${isToday ? 'font-bold text-purple-700' : 'text-gray-600'}`}>
                    <span className="capitalize">{dayLabels[day]}:</span>
                    {hoursString === 'Fechado' ? (
                        <span className={`font-medium ${isToday ? 'text-red-600' : 'text-gray-400'}`}>Fechado</span>
                    ) : (
                        <span className="font-medium">{hoursString}</span>
                    )}
                </div>
            );
        });
    };

    return (
        <header 
            className="bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40 w-full"
        >
            <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 h-24 flex justify-between items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 sm:gap-3"
                >
                    {loading ? (
                        <div
                            aria-label="Carregando logo"
                            className="w-16 h-16 rounded-full bg-gray-200 shadow-sm border border-gray-300 animate-pulse flex-shrink-0"
                        />
                    ) : (
                        <Image
                            key={(settings.logoUrl && settings.logoUrl.trim()) || 'default-logo'}
                            src={(settings.logoUrl && settings.logoUrl.trim()) || '/favicon/android-chrome-192x192.png'}
                            alt="Logo"
                            width={64}
                            height={64}
                            className="rounded-full bg-gray-200 shadow-sm border border-gray-300 object-cover flex-shrink-0"
                            priority
                        />
                    )}
                    <div className="flex flex-col">
                        {loading ? (
                            <div className="space-y-2">
                                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-lg sm:text-xl font-bold text-gray-800">{settings.restaurantName}</h1>
                                <p className="hidden xs:block text-xs text-gray-500">{settings.menuSubtitle}</p>
                            </>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 sm:gap-4"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold tracking-wide shadow-sm transition-all ${isOpen
                            ? 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200'
                            : 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200'
                            }`}
                        disabled={loading}
                    >
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className="hidden sm:inline">{loading ? '...' : isOpen ? 'Aberto' : 'Fechado'}</span>
                    </motion.button>
                    <button
                        className="ml-1 sm:ml-2 bg-white text-gray-600 p-2 sm:p-3 rounded-full shadow-sm hover:bg-gray-100 ring-1 ring-inset ring-gray-200 transition-colors flex items-center justify-center"
                        onClick={() => setShowInfo(true)}
                        aria-label="Informações do restaurante"
                    >
                        <FaExclamationCircle className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>

            {mounted && createPortal(
                <AnimatePresence>
                    {showInfo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowInfo(false)}
                        >
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                                className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden bg-gray-50 flex flex-col max-h-[90vh]"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-4 flex-shrink-0">
                                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">{settings.restaurantName || "Do'Cheff"}</h2>
                                            <p className="text-sm text-gray-500">{settings.restaurantSubtitle || 'Informações do estabelecimento'}</p>
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {isOpen ? 'Aberto' : 'Fechado'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-6">
                                    <section>
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FaClock className="text-purple-600" /> Horários</h3>
                                        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 text-sm shadow-sm">
                                            {renderBusinessHours()}
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <section>
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FaMapMarkerAlt className="text-purple-600" /> Endereço</h3>
                                            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
                                                <p className="font-medium text-gray-700">{settings.addressStreet || 'Rua Fictícia'}</p>
                                                <p className="text-gray-500">{settings.addressCity || 'Cidade - UF'}</p>
                                            </div>
                                        </section>
                                        <section>
                                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FaMoneyBillWave className="text-purple-600" /> Pagamento</h3>
                                            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
                                                <p className="text-gray-600 leading-relaxed">{settings.paymentMethods || 'Cartão, PIX e dinheiro'}</p>
                                            </div>
                                        </section>
                                    </div>

                                    <section>
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FaPhoneAlt className="text-purple-600" /> Contatos</h3>
                                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm space-y-3">
                                            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-3 group">
                                                <FaPhoneAlt className="text-gray-400 w-4 h-4" />
                                                <div className="flex-1">
                                                    <p className="text-gray-500 text-xs">Telefone</p>
                                                    <p className="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">{settings.contactPhone || '(00) 00000-0000'}</p>
                                                </div>
                                            </a>
                                            {settings.socialMediaInstagram && (
                                                <>
                                                    <hr className="border-gray-100" />
                                                    <a href={`https://instagram.com/${settings.socialMediaInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                                                        <FaInstagram className="text-gray-400 w-4 h-4" />
                                                        <div className="flex-1">
                                                            <p className="text-gray-500 text-xs">Instagram</p>
                                                            <p className="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">{settings.socialMediaInstagram}</p>
                                                        </div>
                                                    </a>
                                                </>
                                            )}
                                            {settings.whatsappNumber && (
                                                <>
                                                    <hr className="border-gray-100" />
                                                    <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                                                        <FaWhatsapp className="text-gray-400 w-4 h-4" />
                                                        <div className="flex-1">
                                                            <p className="text-gray-500 text-xs">WhatsApp</p>
                                                            <p className="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">{settings.whatsappNumber}</p>
                                                        </div>
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FaExclamationCircle className="text-purple-600" /> Outras Informações</h3>
                                        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
                                            <p className="text-gray-500">CNPJ: {settings.cnpj || 'Não informado'}</p>
                                        </div>
                                    </section>
                                </div>
                                <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 sticky bottom-0">
                                    <button onClick={() => setShowInfo(false)} className="w-full text-base font-semibold px-4 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] transition">Fechar</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </header>
    );
}