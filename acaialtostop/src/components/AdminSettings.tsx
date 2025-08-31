// src/components/AdminSettings.tsx

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getRestaurantStatus } from '../utils/timeUtils';
import type { BusinessHoursConfig } from '../utils/timeUtils';

interface DeliveryFee {
    neighborhood: string;
    fee: number;
}

interface BusinessHours {
    open: boolean;
    start: string;
    end: string;
}

export default function AdminSettings() {
    // Estado para permitir/desabilitar pizzas meio a meio
    const [allowHalfAndHalf, setAllowHalfAndHalf] = useState(false);
    const [menuTitle, setMenuTitle] = useState("");
    const [menuSubtitle, setMenuSubtitle] = useState("Escolha seus itens favoritos");
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
    const [businessHours, setBusinessHours] = useState<BusinessHoursConfig>({
        monday: { open: false, start: '18:00', end: '22:00' },
        tuesday: { open: false, start: '18:00', end: '22:00' },
        wednesday: { open: false, start: '18:00', end: '22:00' },
        thursday: { open: false, start: '18:00', end: '22:00' },
        friday: { open: false, start: '18:00', end: '22:00' },
        saturday: { open: false, start: '18:00', end: '22:00' },
        sunday: { open: false, start: '18:00', end: '22:00' }
    });
    const [newNeighborhood, setNewNeighborhood] = useState('');
    const [newFee, setNewFee] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Novos estados para as informações do modal
    const [restaurantName, setRestaurantName] = useState("");
    const [restaurantSubtitle, setRestaurantSubtitle] = useState("Informações do Restaurante");
    const [addressStreet, setAddressStreet] = useState("Rua Maria Luiza Dantas");
    const [addressNumber, setAddressNumber] = useState("");
    const [addressCity, setAddressCity] = useState("Alto Rodrigues - RN");
    const [contactPhone, setContactPhone] = useState("+55 84 9872-9126");
    const [paymentMethods, setPaymentMethods] = useState("Aceitamos cartões de crédito/débito, PIX e dinheiro");
    const [socialMediaInstagram, setSocialMediaInstagram] = useState("");
    const [cnpj, setCnpj] = useState("53.378.172/0001-60");
    const [browserTitle, setBrowserTitle] = useState("");
    // Estado para a logo
    const [logoUrl, setLogoUrl] = useState("/logo.jpg");
    const [whatsappNumber, setWhatsappNumber] = useState("");


    // Estados para alteração de senha
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    // Estados para mostrar/ocultar senhas
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Função para verificar se o estabelecimento está aberto
    const checkOpenStatus = useCallback(() => {
        const status = getRestaurantStatus(businessHours);

        console.log('Status detalhado do estabelecimento:', status);
        return status.isOpen;
    }, [businessHours]);

    // Função utilitária para garantir valores padrão
    function mergeBusinessHours(recebido: Partial<BusinessHoursConfig>): BusinessHoursConfig {
        const dias: (keyof BusinessHoursConfig)[] = [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
        ];
        const padrao = { open: false, start: '18:00', end: '22:00' };
        const resultado = {} as BusinessHoursConfig;
        dias.forEach((dia) => {
            const recebidoDia = (recebido?.[dia] || {}) as Partial<BusinessHours>;
            resultado[dia] = {
                open: typeof recebidoDia.open === 'boolean' ? recebidoDia.open : padrao.open,
                start: recebidoDia.start || padrao.start,
                end: recebidoDia.end || padrao.end,
            };
        });
        return resultado;
    }

    useEffect(() => {
        // Buscar configurações apenas no mount
        let mounted = true;
        async function fetchSettings() {
            try {
                setLoading(true);
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    setBusinessHours(data.data.businessHours || {});
                    setDeliveryFees(data.data.deliveryFees || []);
                    setAllowHalfAndHalf(data.data.allowHalfAndHalf || false);
                    setMenuTitle(data.data.menuTitle || "");
                    setMenuSubtitle(data.data.menuSubtitle || "Escolha seus itens favoritos");
                    // Novos campos
                    setRestaurantName(data.data.restaurantName || "");
                    setRestaurantSubtitle(data.data.restaurantSubtitle || "Informações do Restaurante");
                    setAddressStreet(data.data.addressStreet || "Rua Maria Luiza Dantas");
                    setAddressNumber(data.data.addressNumber || "");
                    setAddressCity(data.data.addressCity || "Alto Rodrigues - RN");
                    setContactPhone(data.data.contactPhone || "+55 84 9872-9126");
                    setPaymentMethods(data.data.paymentMethods || "Aceitamos cartões de crédito/débito, PIX e dinheiro");
                    setSocialMediaInstagram(data.data.socialMediaInstagram || "");
                    setCnpj(data.data.cnpj || "53.378.172/0001-60");
                    setBrowserTitle(data.data.browserTitle || "");
                    setLogoUrl(data.data.logoUrl || "/logo.jpg");
                    setWhatsappNumber(data.data.whatsappNumber || "");
                }
            } catch (err) {
                if (mounted) {
                    setSaveMessage('Erro ao carregar configurações do banco. Usando valores padrão.');
                    setBusinessHours(mergeBusinessHours({}));
                    setDeliveryFees([]);
                    setIsOpen(false);
                }
            }
        }
        fetchSettings();
        return () => { mounted = false; };
    }, []); // Só no mount

    // Atualizar o estado isOpen a cada minuto (apenas se não estiver editando)
    useEffect(() => {
        if (isEditing) return;
        const interval = setInterval(() => {
            const newStatus = checkOpenStatus();
            setIsOpen(!!newStatus);
        }, 60000);
        return () => clearInterval(interval);
    }, [checkOpenStatus, isEditing]);

    // Não atualizar isOpen automaticamente ao editar
    useEffect(() => {
        if (isEditing) return;
        setIsOpen(!!checkOpenStatus());
    }, [businessHours, checkOpenStatus, isEditing]);

    // Pausar atualização automática de businessHours durante edição
    useEffect(() => {
        if (isEditing) return;
        // Aqui não faz nada, apenas impede qualquer atualização automática de businessHours enquanto edita
    }, [businessHours, isEditing]);

    const handleAddFee = () => {
        if (!newNeighborhood || !newFee) return;

        const fee = parseFloat(newFee);
        if (isNaN(fee) || fee < 0) {
            setSaveMessage('Taxa inválida');
            return;
        }

        setDeliveryFees(prev => [...prev, { neighborhood: newNeighborhood, fee }]);
        setNewNeighborhood('');
        setNewFee('');
    };

    const handleRemoveFee = (index: number) => {
        setDeliveryFees(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessHours,
                    deliveryFees,
                    allowHalfAndHalf,
                    menuTitle,
                    menuSubtitle,
                    restaurantName,
                    restaurantSubtitle,
                    addressStreet,
                    addressNumber,
                    addressCity,
                    contactPhone,
                    paymentMethods,
                    socialMediaInstagram,
                    cnpj,
                    browserTitle,
                    logoUrl,
                    whatsappNumber
                })
            });
            const data = await res.json();
            if (data.success) {
                setSaveMessage('Alterações salvas com sucesso!');
                setIsEditing(false);
                setIsOpen(!!checkOpenStatus());
            } else {
                setSaveMessage('Erro ao salvar alterações.');
            }
        } catch (error) {
            setSaveMessage('Erro ao salvar alterações.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const handleLogout = () => {
        router.push('/admin/logout');
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage('Todos os campos são obrigatórios');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage('A nova senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage('As senhas não coincidem');
            return;
        }

        setIsChangingPassword(true);
        setPasswordMessage('');

        try {
            const response = await fetch('/api/admin/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setPasswordMessage('Senha alterada com sucesso!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordChange(false);
            } else {
                setPasswordMessage(data.message || 'Erro ao alterar senha');
            }
        } catch (error) {
            setPasswordMessage('Erro ao conectar com o servidor');
        } finally {
            setIsChangingPassword(false);
            setTimeout(() => setPasswordMessage(''), 3000);
        }
    };

    const handleBusinessHoursChange = (day: keyof BusinessHoursConfig, field: 'open' | 'start' | 'end', value: string | boolean) => {
        setIsEditing(true);
        setBusinessHours(prev => {
            const novo = {
                ...prev,
                [day]: {
                    ...prev[day],
                    [field]: value
                }
            };
            console.log('Alterando horário:', day, field, value, novo);
            return novo;
        });
    };

    const daysOfWeek = [
        { key: 'monday', label: 'Segunda-feira' },
        { key: 'tuesday', label: 'Terça-feira' },
        { key: 'wednesday', label: 'Quarta-feira' },
        { key: 'thursday', label: 'Quinta-feira' },
        { key: 'friday', label: 'Sexta-feira' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' }
    ] as const;

    return (
        <div className="max-w-4xl mx-auto p-4 w-full">
            <h1 className="text-2xl font-bold mb-6 text-purple-600">Configurações do Estabelecimento</h1>

            {/* Indicador de status */}
            <div className="mb-6 flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-lg font-semibold ${checkOpenStatus() ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {checkOpenStatus() ? 'Aberto' : 'Fechado'}
                </span>
            </div>

            <div className="space-y-8">
                {/* Horários de Funcionamento */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Horários de Funcionamento</h2>
                    <div className="space-y-4">
                        {daysOfWeek.map(({ key, label }) => (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                                <label className="flex items-center space-x-2 min-w-[150px] text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={businessHours[key]?.open ?? false}
                                        onChange={(e) => handleBusinessHoursChange(key, 'open', e.target.checked)}
                                        className="form-checkbox h-5 w-5 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>{label}</span>
                                </label>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full">
                                    <input
                                        type="time"
                                        value={businessHours[key]?.start ?? '18:00'}
                                        onChange={(e) => handleBusinessHoursChange(key, 'start', e.target.value)}
                                        className="form-input w-full sm:w-32 bg-white text-gray-900 border border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <span className="hidden sm:inline text-gray-500">até</span>
                                    <input
                                        type="time"
                                        value={businessHours[key]?.end ?? '22:00'}
                                        onChange={(e) => handleBusinessHoursChange(key, 'end', e.target.value)}
                                        className="form-input w-full sm:w-32 bg-white text-gray-900 border border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Informações do Restaurante */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Informações do Restaurante (Modal)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="Nome do Restaurante" className="form-input bg-white text-gray-900" />
                        <input type="text" value={restaurantSubtitle} onChange={e => setRestaurantSubtitle(e.target.value)} placeholder="Subtítulo do Modal" className="form-input bg-white text-gray-900" />
                        <input type="text" value={addressStreet} onChange={e => setAddressStreet(e.target.value)} placeholder="Rua do Endereço" className="form-input bg-white text-gray-900" />
                        <input type="text" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="Número do Estabelecimento" className="form-input bg-white text-gray-900" />
                        <input type="text" value={addressCity} onChange={e => setAddressCity(e.target.value)} placeholder="Cidade/Estado" className="form-input bg-white text-gray-900" />
                        <input type="text" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Telefone de Contato" className="form-input bg-white text-gray-900" />
                        <input type="text" value={paymentMethods} onChange={e => setPaymentMethods(e.target.value)} placeholder="Formas de Pagamento" className="form-input bg-white text-gray-900" />
                        <input type="text" value={socialMediaInstagram} onChange={e => setSocialMediaInstagram(e.target.value)} placeholder="Instagram" className="form-input bg-white text-gray-900" />
                        <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="CNPJ" className="form-input bg-white text-gray-900" />
                        <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="Número do WhatsApp para receber pedidos" className="form-input bg-white text-gray-900" />
                    </div>
                </div>

                {/* Identidade Visual */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Identidade Visual</h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Logo</label>
                            <input
                                type="text"
                                value={logoUrl}
                                onChange={e => setLogoUrl(e.target.value)}
                                placeholder="https://exemplo.com/sua-logo.png"
                                className="form-input bg-white text-gray-900"
                            />
                        </div>
                        <hr className="border-gray-200" />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título do Navegador (Aba)</label>
                            <input
                                type="text"
                                value={browserTitle}
                                onChange={e => setBrowserTitle(e.target.value)}
                                placeholder="Título que aparece na aba do navegador"
                                className="form-input bg-white text-gray-900"
                            />
                        </div>
                        <hr className="border-gray-200" />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal do Cardápio</label>
                            <input
                                type="text"
                                value={menuTitle}
                                onChange={e => setMenuTitle(e.target.value)}
                                placeholder="Título do Cardápio"
                                className="form-input bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo do Cardápio</label>
                            <input
                                type="text"
                                value={menuSubtitle}
                                onChange={e => setMenuSubtitle(e.target.value)}
                                placeholder="Ex: Escolha seus itens favoritos"
                                className="form-input bg-white text-gray-900"
                            />
                        </div>
                    </div>
                </div>

                {/* Taxas de Entrega */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Taxas de Entrega</h2>
                    <div className="space-y-4">
                        {deliveryFees.map((fee, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gray-100 p-3 rounded-lg">
                                <div className="flex-1 w-full">
                                    <div className="text-gray-800 font-medium">{fee.neighborhood}</div>
                                    <div className="text-purple-600">R$ {fee.fee.toFixed(2)}</div>
                                </div>
                                <button
                                    onClick={() => handleRemoveFee(index)}
                                    className="text-purple-600 hover:text-purple-700"
                                >
                                    Remover
                                </button>
                            </div>
                        ))}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <input
                                type="text"
                                value={newNeighborhood}
                                onChange={(e) => setNewNeighborhood(e.target.value)}
                                placeholder="Nome do bairro"
                                className="flex-1 rounded-md border border-purple-300 bg-white text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                            />
                            <input
                                type="number"
                                value={newFee}
                                onChange={(e) => setNewFee(e.target.value)}
                                placeholder="Taxa (R$)"
                                step="0.01"
                                min="0"
                                className="w-full sm:w-32 rounded-md border border-purple-300 bg-white text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                            />
                            <button
                                onClick={handleAddFee}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="mt-6 flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </div>

            {saveMessage && (
                <div className="mt-4 p-4 rounded-md bg-purple-900 text-purple-200">
                    {saveMessage}
                </div>
            )}
        </div>
    );
}