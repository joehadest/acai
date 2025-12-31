// Rebuilt AdminSettings
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRestaurantStatus } from '../utils/timeUtils';
import type { BusinessHoursConfig } from '../utils/timeUtils';

interface DeliveryFee { neighborhood: string; fee: number; }
interface BusinessHours { open: boolean; start: string; end: string; }

export default function AdminSettings() {
    const [allowHalfAndHalf, setAllowHalfAndHalf] = useState(false);
    const [menuTitle, setMenuTitle] = useState('');
    const [menuSubtitle, setMenuSubtitle] = useState('Escolha seus itens favoritos');
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

    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantSubtitle, setRestaurantSubtitle] = useState('Informações do Restaurante');
    const [addressStreet, setAddressStreet] = useState('Rua Maria Luiza Dantas');
    const [addressNumber, setAddressNumber] = useState('');
    const [addressCity, setAddressCity] = useState('Alto Rodrigues - RN');
    const [contactPhone, setContactPhone] = useState('+55 84 9872-9126');
    const [paymentMethods, setPaymentMethods] = useState('Aceitamos cartões de crédito/débito, PIX e dinheiro');
    const [socialMediaInstagram, setSocialMediaInstagram] = useState('');
    const [cnpj, setCnpj] = useState('53.378.172/0001-60');
    const [browserTitle, setBrowserTitle] = useState('');
    const [logoUrl, setLogoUrl] = useState('/logo.jpg');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [printnodeApiKey, setPrintnodeApiKey] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    const checkOpenStatus = useCallback(() => {
        const status = getRestaurantStatus(businessHours);
        return status.isOpen;
    }, [businessHours]);

    function mergeBusinessHours(recebido: Partial<BusinessHoursConfig>): BusinessHoursConfig {
        const dias: (keyof BusinessHoursConfig)[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const padrao = { open: false, start: '18:00', end: '22:00' };
        const resultado = {} as BusinessHoursConfig;
        dias.forEach(dia => {
            const r = (recebido?.[dia] || {}) as Partial<BusinessHours>;
            resultado[dia] = { open: r.open ?? padrao.open, start: r.start || padrao.start, end: r.end || padrao.end };
        });
        return resultado;
    }

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (mounted && data.success && data.data) {
                    setBusinessHours(mergeBusinessHours(data.data.businessHours || {}));
                    setDeliveryFees(data.data.deliveryFees || []);
                    setAllowHalfAndHalf(data.data.allowHalfAndHalf || false);
                    setMenuTitle(data.data.menuTitle || '');
                    setMenuSubtitle(data.data.menuSubtitle || 'Escolha seus itens favoritos');
                    setRestaurantName(data.data.restaurantName || '');
                    setRestaurantSubtitle(data.data.restaurantSubtitle || 'Informações do Restaurante');
                    setAddressStreet(data.data.addressStreet || 'Rua Maria Luiza Dantas');
                    setAddressNumber(data.data.addressNumber || '');
                    setAddressCity(data.data.addressCity || 'Alto Rodrigues - RN');
                    setContactPhone(data.data.contactPhone || '+55 84 9872-9126');
                    setPaymentMethods(data.data.paymentMethods || 'Aceitamos cartões de crédito/débito, PIX e dinheiro');
                    setSocialMediaInstagram(data.data.socialMediaInstagram || '');
                    setCnpj(data.data.cnpj || '53.378.172/0001-60');
                    setBrowserTitle(data.data.browserTitle || '');
                    setLogoUrl(data.data.logoUrl || '/logo.jpg');
                    setWhatsappNumber(data.data.whatsappNumber || '');
                    setPrintnodeApiKey(data.data.printnodeApiKey || '');
                }
            } catch (e) {
                if (mounted) {
                    setSaveMessage('Erro ao carregar configurações. Usando valores padrão.');
                    setBusinessHours(mergeBusinessHours({}));
                    setDeliveryFees([]);
                    setIsOpen(false);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (isEditing) return;
        const interval = setInterval(() => setIsOpen(checkOpenStatus()), 60000);
        return () => clearInterval(interval);
    }, [checkOpenStatus, isEditing]);

    useEffect(() => { if (!isEditing) setIsOpen(checkOpenStatus()); }, [businessHours, checkOpenStatus, isEditing]);

    const handleAddFee = () => {
        if (!newNeighborhood || !newFee) return;
        const fee = parseFloat(newFee);
        if (isNaN(fee) || fee < 0) { setSaveMessage('Taxa inválida'); return; }
        setDeliveryFees(p => [...p, { neighborhood: newNeighborhood, fee }]);
        setNewNeighborhood(''); setNewFee('');
    };
    const handleRemoveFee = (i: number) => setDeliveryFees(p => p.filter((_, idx) => idx !== i));

    const handleSave = async () => {
        setIsSaving(true); setSaveMessage('');
        try {
            const res = await fetch('/api/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ businessHours, deliveryFees, allowHalfAndHalf, menuTitle, menuSubtitle, restaurantName, restaurantSubtitle, addressStreet, addressNumber, addressCity, contactPhone, paymentMethods, socialMediaInstagram, cnpj, browserTitle, logoUrl, whatsappNumber, printnodeApiKey }) });
            const data = await res.json();
            if (data.success) { setSaveMessage('Alterações salvas!'); setIsEditing(false); setIsOpen(checkOpenStatus()); }
            else setSaveMessage('Erro ao salvar.');
        } catch { setSaveMessage('Erro ao salvar.'); } finally { setIsSaving(false); setTimeout(()=> setSaveMessage(''),3000); }
    };

    const handleLogout = () => router.push('/admin/logout');

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) return setPasswordMessage('Todos os campos são obrigatórios');
        if (newPassword.length < 6) return setPasswordMessage('Mínimo 6 caracteres');
        if (newPassword !== confirmPassword) return setPasswordMessage('Senhas não coincidem');
        setIsChangingPassword(true); setPasswordMessage('');
        try {
            const res = await fetch('/api/admin/password', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ currentPassword, newPassword }) });
            const data = await res.json();
            if (data.success) { setPasswordMessage('Senha alterada!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
            else setPasswordMessage(data.message || 'Erro ao alterar');
        } catch { setPasswordMessage('Erro de conexão'); } finally { setIsChangingPassword(false); setTimeout(()=> setPasswordMessage(''),3000); }
    };

    const handleBusinessHoursChange = (day: keyof BusinessHoursConfig, field: 'open'|'start'|'end', value: string|boolean) => {
        setIsEditing(true);
        setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const daysOfWeek = [
        { key:'monday', label:'Segunda-feira' },
        { key:'tuesday', label:'Terça-feira' },
        { key:'wednesday', label:'Quarta-feira' },
        { key:'thursday', label:'Quinta-feira' },
        { key:'friday', label:'Sexta-feira' },
        { key:'saturday', label:'Sábado' },
        { key:'sunday', label:'Domingo' },
    ] as const;

    return (
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 space-y-8">
            <h1 className="text-xl sm:text-2xl font-bold text-purple-600">Configurações do Estabelecimento</h1>
            {/* Status (fora do grid para alinhar alturas) */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${checkOpenStatus() ? 'bg-green-100 text-green-800':'bg-gray-200 text-gray-800'}`}>{checkOpenStatus() ? 'Aberto':'Fechado'}</span>
                <span className="text-xs sm:text-sm text-gray-600">Status atual do estabelecimento</span>
            </div>
            <div className="grid 2xl:grid-cols-3 gap-8 items-start">
                <div className="space-y-8 2xl:col-span-2">
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Horários de Funcionamento</h2>
                            <div className="space-y-4 pr-1">
                                {daysOfWeek.map(({key,label}) => (
                                    <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-gray-50 rounded-lg">
                                        <label className="flex items-center space-x-2 min-w-[140px] sm:min-w-[160px] text-gray-700 text-sm sm:text-base">
                                            <input type="checkbox" checked={businessHours[key]?.open ?? false} onChange={e=>handleBusinessHoursChange(key,'open', e.target.checked)} className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-purple-600 focus:ring-purple-500" />
                                            <span className="truncate">{label}</span>
                                        </label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                                            <input type="time" value={businessHours[key]?.start ?? '18:00'} onChange={e=>handleBusinessHoursChange(key,'start', e.target.value)} className="form-input w-full sm:w-32 bg-white text-gray-900 border border-purple-300 focus:ring-purple-500 focus:border-purple-500" />
                                            <span className="hidden sm:inline text-gray-500">até</span>
                                            <input type="time" value={businessHours[key]?.end ?? '22:00'} onChange={e=>handleBusinessHoursChange(key,'end', e.target.value)} className="form-input w-full sm:w-32 bg-white text-gray-900 border border-purple-300 focus:ring-purple-500 focus:border-purple-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Informações do Restaurante (Modal)</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-1">
                                <input type="text" value={restaurantName} onChange={e=>setRestaurantName(e.target.value)} placeholder="Nome do Restaurante" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={restaurantSubtitle} onChange={e=>setRestaurantSubtitle(e.target.value)} placeholder="Subtítulo do Modal" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={addressStreet} onChange={e=>setAddressStreet(e.target.value)} placeholder="Rua do Endereço" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={addressNumber} onChange={e=>setAddressNumber(e.target.value)} placeholder="Número do Estabelecimento" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={addressCity} onChange={e=>setAddressCity(e.target.value)} placeholder="Cidade/Estado" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} placeholder="Telefone de Contato" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={paymentMethods} onChange={e=>setPaymentMethods(e.target.value)} placeholder="Formas de Pagamento" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={socialMediaInstagram} onChange={e=>setSocialMediaInstagram(e.target.value)} placeholder="Instagram" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={cnpj} onChange={e=>setCnpj(e.target.value)} placeholder="CNPJ" className="form-input bg-white text-gray-900 text-sm sm:text-base" />
                                <input type="text" value={whatsappNumber} onChange={e=>setWhatsappNumber(e.target.value)} placeholder="Número do WhatsApp para receber pedidos" className="form-input bg-white text-gray-900 text-sm sm:text-base sm:col-span-2" />
                            </div>
                        </div>
                        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm lg:col-span-2">
                            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Configurações de Impressão (PrintNode)</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        PrintNode API Key
                                        <span className="text-xs text-gray-500 ml-2">(Opcional - para impressão em nuvem)</span>
                                    </label>
                                    <input 
                                        type="password" 
                                        value={printnodeApiKey} 
                                        onChange={e=>setPrintnodeApiKey(e.target.value)} 
                                        placeholder="Cole sua API Key do PrintNode aqui" 
                                        className="form-input bg-white text-gray-900 text-sm sm:text-base w-full" 
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Obtenha sua API Key em: <a href="https://app.printnode.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">app.printnode.com</a>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Consulte o guia completo em: <a href="/md/PRINTNODE_SETUP.md" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">PRINTNODE_SETUP.md</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm lg:col-span-2">
                            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Identidade Visual</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-4 md:col-span-1">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">URL da Logo</label>
                                        <input type="text" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} placeholder="https://exemplo.com/sua-logo.png" className="form-input bg-white text-gray-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título Navegador</label>
                                        <input type="text" value={browserTitle} onChange={e=>setBrowserTitle(e.target.value)} placeholder="Título da aba" className="form-input bg-white text-gray-900" />
                                    </div>
                                </div>
                                <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal do Cardápio</label>
                                        <input type="text" value={menuTitle} onChange={e=>setMenuTitle(e.target.value)} placeholder="Título do Cardápio" className="form-input bg-white text-gray-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo do Cardápio</label>
                                        <input type="text" value={menuSubtitle} onChange={e=>setMenuSubtitle(e.target.value)} placeholder="Ex: Escolha seus itens favoritos" className="form-input bg-white text-gray-900" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm lg:col-span-2">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">Taxas de Entrega</h2>
                            <div className="space-y-4">
                                {deliveryFees.map((fee,i)=>(
                                    <div key={i} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gray-100 p-3 rounded-lg">
                                        <div className="flex-1 w-full">
                                            <div className="text-gray-800 font-medium">{fee.neighborhood}</div>
                                            <div className="text-purple-600">R$ {fee.fee.toFixed(2)}</div>
                                        </div>
                                        <button onClick={()=>handleRemoveFee(i)} className="text-purple-600 hover:text-purple-700">Remover</button>
                                    </div>
                                ))}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                    <input type="text" value={newNeighborhood} onChange={e=>setNewNeighborhood(e.target.value)} placeholder="Nome do bairro" className="flex-1 rounded-md border border-purple-300 bg-white text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500" />
                                    <input type="number" value={newFee} onChange={e=>setNewFee(e.target.value)} placeholder="Taxa (R$)" step="0.01" min="0" className="w-full sm:w-32 rounded-md border border-purple-300 bg-white text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500" />
                                    <button onClick={handleAddFee} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">Adicionar</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 lg:col-span-2 justify-end pt-2">
                            <button
                                onClick={handleLogout}
                                type="button"
                                className="px-5 py-2.5 rounded-lg font-medium border border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:text-purple-600 transition-colors shadow-sm"
                            >Sair</button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                type="button"
                                className="px-6 py-2.5 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 shadow"
                            >{isSaving ? 'Salvando...' : 'Salvar Alterações'}</button>
                        </div>
                        {saveMessage && <div className="lg:col-span-2 p-4 rounded-md bg-purple-900 text-purple-200">{saveMessage}</div>}
                    </div>
                </div>
                <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm h-fit">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center justify-between">Alterar Senha</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                            <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="form-input bg-white text-gray-900 w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="form-input bg-white text-gray-900 w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="form-input bg-white text-gray-900 w-full" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleChangePassword} disabled={isChangingPassword} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50">{isChangingPassword ? 'Alterando...' : 'Alterar Senha'}</button>
                            <button onClick={()=>{ setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors">Limpar</button>
                        </div>
                        {passwordMessage && <div className="p-2 rounded bg-purple-50 text-purple-700 text-sm">{passwordMessage}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}