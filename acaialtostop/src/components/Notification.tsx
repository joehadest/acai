'use client';
import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface NotificationProps {
    message: string;
    onClose: () => void;
    type?: 'info' | 'success' | 'warning' | 'error';
    autoClose?: boolean;
    playSound?: boolean;
}

export default function Notification({ 
    message, 
    onClose, 
    type = 'info',
    autoClose = true,
    playSound = true
}: NotificationProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('notification-muted');
            // Se não há configuração salva, o som fica ATIVADO por padrão
            return saved === null ? false : saved === 'true';
        }
        return false;
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);

    // Detectar primeira interação do usuário para tentar autoplay novamente
    useEffect(() => {
        if (typeof window !== 'undefined' && autoplayBlocked) {
            const handleUserInteraction = () => {
                if (autoplayBlocked && !isMuted && audioRef.current && !isPlaying && playSound) {
                    setTimeout(() => {
                        if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            audioRef.current.play().catch(error => {
                                console.log('Erro ao tocar som após interação:', error);
                            }).then(() => {
                                setAutoplayBlocked(false);
                            });
                        }
                    }, 100);
                }
                // Remover listeners após primeira interação
                window.removeEventListener('click', handleUserInteraction);
                window.removeEventListener('keydown', handleUserInteraction);
                window.removeEventListener('touchstart', handleUserInteraction);
            };

            window.addEventListener('click', handleUserInteraction);
            window.addEventListener('keydown', handleUserInteraction);
            window.addEventListener('touchstart', handleUserInteraction);

            return () => {
                window.removeEventListener('click', handleUserInteraction);
                window.removeEventListener('keydown', handleUserInteraction);
                window.removeEventListener('touchstart', handleUserInteraction);
            };
        }
    }, [autoplayBlocked, isMuted, isPlaying, playSound]);

    useEffect(() => {
        const audio = audioRef.current;
        
        if (audio) {
            // Event listener para quando o áudio terminar
            const handleEnded = () => {
                setIsPlaying(false);
            };
            
            // Event listener para erros
            const handleError = () => {
                setIsPlaying(false);
                console.log('Erro no áudio');
            };
            
            audio.addEventListener('ended', handleEnded);
            audio.addEventListener('error', handleError);
            
            return () => {
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('error', handleError);
            };
        }
    }, []);

    useEffect(() => {
        // Tentar tocar som imediatamente se não estiver mutado e playSound estiver habilitado
        if (!isMuted && audioRef.current && !isPlaying && playSound && !autoplayBlocked) {
            setIsPlaying(true);
            
            // Tentar tocar o som imediatamente
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0; // Reiniciar o áudio
                    audioRef.current.play().catch(error => {
                        console.log('Autoplay bloqueado pelo navegador:', error);
                        setIsPlaying(false);
                        setAutoplayBlocked(true);
                    });
                }
            }, 50); // Delay menor para resposta mais rápida
        }

        // Fechar automaticamente apenas se autoClose estiver habilitado
        if (autoClose) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [onClose, isMuted, autoClose, isPlaying, playSound, autoplayBlocked]);

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        localStorage.setItem('notification-muted', newMutedState.toString());
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white border-green-600';
            case 'warning':
                return 'bg-yellow-500 text-white border-yellow-600';
            case 'error':
                return 'bg-red-500 text-white border-red-600';
            default:
                return 'bg-blue-500 text-white border-blue-600';
        }
    };

    return (
        <>
            {/* Elemento de áudio oculto */}
            <audio 
                ref={audioRef} 
                src="/notification-sound.mp3" 
                preload="auto"
                style={{ display: 'none' }}
            />
            
            <div className={`fixed bottom-4 right-4 ${getTypeStyles()} px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up border z-50 max-w-sm`}>
                <FaBell className="text-xl flex-shrink-0" />
                <span className="flex-1 text-sm font-medium">
                    {autoplayBlocked ? `${message} (Clique para ativar som)` : message}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMute}
                        className="hover:opacity-80 transition-opacity p-1"
                        title={isMuted ? 'Ativar som' : 'Desativar som'}
                    >
                        {isMuted ? <FaVolumeMute className="text-sm" /> : <FaVolumeUp className="text-sm" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="hover:opacity-80 transition-opacity text-lg leading-none"
                        title="Fechar notificação"
                    >
                        ×
                    </button>
                </div>
            </div>
        </>
    );
} 