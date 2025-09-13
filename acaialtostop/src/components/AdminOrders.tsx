// src/components/AdminOrders.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShareAlt, FaVolumeUp, FaVolumeMute } from 'react-icons/fa'; // Ícones de volume
// Removidos jsPDF e html2canvas (não utilizados)
import NotificationComponent from './Notification';
import { Pedido } from '../types/cart';

// ... (interfaces permanecem as mesmas) ...
interface Endereco {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    zipCode: string;
    deliveryFee: number;
    estimatedTime: string;
}

interface PedidoItem {
    nome: string;
    quantidade: number;
    preco: number;
    observacao?: string;
    size?: string;
    border?: string;
    extras?: string[];
    flavors?: string[]; // Adicionado
    // Adicionando os títulos
    sizesTitle?: string;
    flavorsTitle?: string; // Adicionado
    borderTitle?: string;
    extrasTitle?: string;
}

interface Cliente {
    nome: string;
    telefone: string;
}

type PedidoStatus = 'pendente' | 'preparando' | 'pronto' | 'em_entrega' | 'entregue' | 'cancelado';


export default function AdminOrders() {
    // Estado para controle da permissão de notificação
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'default');

    // Função para solicitar permissão de notificação do navegador
    const handleRequestNotificationPermission = async () => {
        if ('Notification' in window) {
            try {
                const permission = await window.Notification.requestPermission();
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    setMensagemCompartilhamento('Permissão de notificação concedida!');
                    setTimeout(() => setMensagemCompartilhamento(null), 3000);
                } else if (permission === 'denied') {
                    setMensagemCompartilhamento('Permissão de notificação negada.');
                    setTimeout(() => setMensagemCompartilhamento(null), 3000);
                }
            } catch (error) {
                alert('Erro ao solicitar permissão de notificação.');
            }
        } else {
            alert('Este navegador não suporta notificações.');
        }
    };
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null); // única declaração
    const [loading, setLoading] = useState(true);
    // removido pedidoExpandido
    const [mensagem, setMensagem] = useState<string | null>(null);
    const [mensagemCompartilhamento, setMensagemCompartilhamento] = useState<string | null>(null);
    const [phoneFilter, setPhoneFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [menuTitle, setMenuTitle] = useState<string>('Do\'Cheff');
    const [globalSoundEnabled, setGlobalSoundEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('global-sound-enabled');
            return saved === null ? true : saved === 'true'; // Som ativado por padrão
        }
        return true;
    });
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [mounted, setMounted] = useState(false);

    const toggleGlobalSound = () => {
        const newState = !globalSoundEnabled;
        setGlobalSoundEnabled(newState);
        localStorage.setItem('global-sound-enabled', newState.toString());
    };

    const fetchPedidos = async () => {
        try {
            const res = await fetch('/api/pedidos');
            const data = await res.json();
            if (data.success) {
                setPedidos(prev => {
                    const novosPedidos = data.data.filter((novoPedido: Pedido) =>
                        !prev.some(pedido => pedido._id === novoPedido._id)
                    );
                    if (novosPedidos.length > 0) {
                        setNotification(`🚨 Novo pedido #${novosPedidos[0]._id.slice(-6)} - ${novosPedidos[0].cliente?.nome || 'Cliente'}`);
                        const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
                        if (!notifyOrders.includes(novosPedidos[0]._id)) {
                            notifyOrders.push(novosPedidos[0]._id);
                            localStorage.setItem('notifyOrders', JSON.stringify(notifyOrders));
                        }
                    }
                    return data.data; // substitui pela lista completa atualizada
                });
            }
        } catch (err) {
            console.error('Erro ao buscar pedidos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidos();
        const interval = setInterval(fetchPedidos, 30000);
        return () => clearInterval(interval);
        // Sem dependências para não recriar o intervalo a cada atualização
    }, []);

    // Buscar o título do menu
    useEffect(() => {
        async function fetchMenuTitle() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data && data.data.menuTitle) {
                    setMenuTitle(data.data.menuTitle);
                }
            } catch {}
        }
        fetchMenuTitle();
    }, []);

    const handleRemoverPedido = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este pedido?')) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/pedidos?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.success) {
                setPedidos((prev) => prev.filter((p) => p._id !== id));
                setMensagem('Pedido removido com sucesso!');
                setTimeout(() => setMensagem(null), 3000);
            } else {
                console.error('Erro na resposta:', data);
                setMensagem(data.message || 'Erro ao remover pedido.');
                setTimeout(() => setMensagem(null), 3000);
            }
        } catch (err) {
            console.error('Erro ao remover pedido:', err);
            setMensagem('Erro ao remover pedido. Tente novamente.');
            setTimeout(() => setMensagem(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleCompartilharPedido = (pedido: Pedido) => {
        const endereco = pedido.endereco;
        const enderecoFormatado = endereco ?
            `${endereco.address.street}, ${endereco.address.number}${endereco.address.complement ? ` - ${endereco.address.complement}` : ''}, ${endereco.address.neighborhood}` :
            'Retirada no local';

        const formaPagamento = pedido.formaPagamento === 'pix' ? 'PIX' :
            pedido.formaPagamento === 'cartao' ? 'Cartão' : 'Dinheiro';

        const troco = pedido.formaPagamento === 'dinheiro' && pedido.troco ?
            `\nTroco para: R$ ${pedido.troco}` : '';

        const taxaEntrega = pedido.endereco?.deliveryFee ?
            `\nTaxa de Entrega: R$ ${pedido.endereco.deliveryFee.toFixed(2)}` : '';

        const itensFormatados = pedido.itens.map(item => {
            let itemStr = `*${item.quantidade}x ${item.nome}*`;
            if (item.size) itemStr += `\n  - ${item.sizesTitle || 'Tamanho'}: ${item.size}`;
            if (item.flavors && item.flavors.length > 0) itemStr += `\n  - ${item.flavorsTitle || 'Sabores'}: ${item.flavors.join(', ')}`;
            if (item.border) itemStr += `\n  - ${item.borderTitle || 'Borda'}: ${item.border}`;
            if (item.extras && item.extras.length > 0) itemStr += `\n  - ${item.extrasTitle || 'Extras'}: ${item.extras.join(', ')}`;
            if (item.observacao) itemStr += `\n  - Obs: ${item.observacao}`;
            itemStr += `\n  - Valor: R$ ${(item.preco * item.quantidade).toFixed(2)}`;
            return itemStr;
        }).join('\n\n');

        const total = pedido.total || pedido.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0) + (pedido.endereco?.deliveryFee || 0);

        const mensagem = `*${menuTitle} - Pedido #${pedido._id.slice(-6)}*\n\n` +
            `*Data:* ${new Date(pedido.data).toLocaleString('pt-BR')}\n` +
            `*Status:* ${pedido.status}\n\n` +
            `*Cliente:*\n` +
            `Nome: ${pedido.cliente.nome}\n` +
            `Telefone: ${pedido.cliente.telefone}\n\n` +
            `*Endereço:*\n${enderecoFormatado}\n\n` +
            `*Itens do Pedido:*\n${itensFormatados}\n\n` +
            `*Pagamento:* ${formaPagamento}${troco}\n` +
            `*Subtotal:* R$ ${(total - (pedido.endereco?.deliveryFee || 0)).toFixed(2)}${taxaEntrega}\n` +
            `*Total:* R$ ${total.toFixed(2)}`;

        if (navigator.share) {
            navigator.share({
                title: `Pedido #${pedido._id.slice(-6)}`,
                text: mensagem
            });
        } else {
            alert('Compartilhamento não suportado neste navegador.');
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: PedidoStatus) => {
        try {
            setUpdatingStatus(orderId);
            const res = await fetch(`/api/pedidos?id=${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Erro ao atualizar status do pedido');
            }

            if (data.success) {
                setPedidos(pedidos.map(order =>
                    order._id === orderId
                        ? { ...order, status: newStatus }
                        : order
                ));
                setMensagem('Status atualizado com sucesso!');
                setNotification(`✅ Status do pedido #${orderId.slice(-6)} atualizado para ${getStatusText(newStatus)}`);

                const timestamp = new Date().toLocaleString('pt-BR');
                const message = `Status do pedido #${orderId.slice(-6)} atualizado para ${getStatusText(newStatus)}`;

                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        clientId: pedidos.find(p => p._id === orderId)?.cliente.telefone,
                        orderId,
                        status: newStatus,
                        message,
                        timestamp
                    }),
                });

                const notifyOrders = JSON.parse(localStorage.getItem('notifyOrders') || '[]');
                if (!notifyOrders.includes(orderId)) {
                    notifyOrders.push(orderId);
                    localStorage.setItem('notifyOrders', JSON.stringify(notifyOrders));
                }
                localStorage.setItem(`notifyStatus_${orderId}`, newStatus);
                localStorage.setItem(`notifyTimestamp_${orderId}`, timestamp);

                setTimeout(() => setMensagem(null), 3000);
            } else {
                throw new Error(data.message || 'Erro ao atualizar status do pedido');
            }
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            setMensagem('Erro ao atualizar status do pedido. Por favor, tente novamente.');
            setTimeout(() => setMensagem(null), 3000);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const getStatusText = (status: PedidoStatus) => {
        const texts = {
            pendente: 'Pendente',
            preparando: 'Preparando',
            pronto: 'Pronto',
            em_entrega: 'Em Entrega',
            entregue: 'Entregue',
            cancelado: 'Cancelado'
        };
        return texts[status];
    };

    const getNextStatus = (currentStatus: PedidoStatus): PedidoStatus | null => {
        switch (currentStatus) {
            case 'pendente':
                return 'preparando';
            case 'preparando':
                return 'pronto';
            case 'pronto':
                return 'em_entrega';
            case 'em_entrega':
                return 'entregue';
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calcularTotal = (pedido: Pedido) => {
        return pedido.total || pedido.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0) + (pedido.endereco?.deliveryFee || 0);
    };

    const filteredPedidos = pedidos.filter(pedido => {
        const matchesPhone = !phoneFilter || pedido.cliente?.telefone?.includes(phoneFilter);
        const matchesStatus = !statusFilter || pedido.status === statusFilter;
        return matchesPhone && matchesStatus;
    });

    useEffect(() => {
        if (pedidoSelecionado && modalRef.current) {
            modalRef.current.focus();
        }
    }, [pedidoSelecionado]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPedidoSelecionado(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (pedidoSelecionado) {
            // Scroll para baixo um pouco mais para melhor posicionamento do modal
            const scrollOffset = window.innerHeight * 0.20; // 20% da altura da tela
            window.scrollTo({ top: scrollOffset, behavior: 'smooth' });
        }
    }, [pedidoSelecionado]);

    if (loading) return <div className="text-center py-10">Carregando pedidos...</div>;
    if (!pedidos.length) return <div className="text-center text-gray-500">Nenhum pedido recente.</div>;
    if (!mounted) return null; // evita mismatch de hidratação

    return (
        <>
            <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-purple-600">Painel de Pedidos</h2>

                {/* Mensagem para Ativar o Som */}
                {/* ...nenhum botão de ativação de som... */}

                {mensagemCompartilhamento && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-center font-semibold">
                        {mensagemCompartilhamento}
                    </div>
                )}
                {notification && (
                    <NotificationComponent 
                        message={notification} 
                        onClose={() => setNotification(null)}
                        type={notification.includes('✅') ? 'success' : notification.includes('🚨') ? 'warning' : 'info'}
                        playSound={notification.includes('🚨') && globalSoundEnabled}
                        position={notification.includes('🚨') ? 'top-center' : 'bottom-right'}
                    />
                )}
            {/* Filtros */}
            <div className="mb-6 p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">Controles</h3>
                    <button
                        onClick={toggleGlobalSound}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            globalSoundEnabled 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={globalSoundEnabled ? 'Desativar sons de notificação' : 'Ativar sons de notificação'}
                    >
                        <FaVolumeUp className={`text-base ${globalSoundEnabled ? '' : 'opacity-50'}`} />
                        <span className="hidden sm:inline">
                            {globalSoundEnabled ? 'Som Ativado' : 'Som Desativado'}
                        </span>
                        <span className="sm:hidden">
                            {globalSoundEnabled ? 'Som ON' : 'Som OFF'}
                        </span>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar por telefone
                        </label>
                        <input
                            type="tel"
                            value={phoneFilter}
                            onChange={(e) => setPhoneFilter(e.target.value)}
                            placeholder="Digite o telefone do pedido"
                            className="w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-purple-600 focus:ring-purple-600 text-sm sm:text-base"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-purple-600 focus:ring-purple-600 text-sm sm:text-base"
                        >
                            <option value="">Todos os status</option>
                            <option value="pendente">Pendente</option>
                            <option value="preparando">Preparando</option>
                            <option value="pronto">Pronto</option>
                            <option value="em_entrega">Em Entrega</option>
                            <option value="entregue">Entregue</option>
                            <option value="cancelado">Cancelado</option>
                        </select>
                    </div>
                </div>
            </div>
            {/* Lista de Pedidos */}
            <ul className="space-y-3 sm:space-y-4">
                {filteredPedidos.map((pedido) => (
                    <li key={pedido._id} className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base sm:text-lg text-gray-900 mb-1">Pedido <span className="text-purple-600">#{pedido._id.slice(-6)}</span></div>
                            <div className="text-xs sm:text-sm text-gray-500 mb-2">
                                Data: {formatDate(pedido.data)}
                            </div>
                            <div className="font-bold text-purple-600 text-sm sm:text-base">Total: R$ {calcularTotal(pedido).toFixed(2)}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold 
                                    ${pedido.status === 'entregue' ? 'bg-green-100 text-green-800' : ''}
                                    ${pedido.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : ''}
                                    ${pedido.status === 'preparando' ? 'bg-blue-100 text-blue-800' : ''}
                                    ${pedido.status === 'em_entrega' ? 'bg-purple-100 text-purple-800' : ''}
                                    ${pedido.status === 'cancelado' ? 'bg-red-100 text-red-800' : ''}
                                `}>
                                    {getStatusText(pedido.status)}
                                </div>
                                {getNextStatus(pedido.status) && (
                                    <button
                                        onClick={() => updateOrderStatus(pedido._id, getNextStatus(pedido.status)!)}
                                        disabled={updatingStatus === pedido._id}
                                        className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                                    >
                                        {updatingStatus === pedido._id ? 'Atualizando...' : 'Próximo Status'}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:gap-2">
                            <button
                                className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base flex items-center justify-center"
                                onClick={() => setPedidoSelecionado(pedido)}
                            >
                                Ver Detalhes
                            </button>
                            <button
                                className="flex-1 bg-white border-2 border-gray-800 text-gray-900 font-mono text-xs sm:text-sm py-2 px-3 rounded transition-all duration-200 hover:bg-gray-50 hover:shadow-md flex items-center justify-center gap-2"
                                onClick={() => handleCompartilharPedido(pedido)}
                            >
                                <FaShareAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                                Imprimir
                            </button>
                            <button
                                className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors text-sm sm:text-base"
                                onClick={() => handleRemoverPedido(pedido._id)}
                            >
                                Remover
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
                {mensagem && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded text-center font-semibold">
                        {mensagem}
                    </div>
                )}
            </div>

            {/* Modal de detalhes melhorado - renderizado via Portal fora de todos os containers */}
            {mounted && pedidoSelecionado && createPortal(
                <AnimatePresence>
                    <motion.div 
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" 
                        onClick={(e) => { if (e.target === e.currentTarget) setPedidoSelecionado(null); }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ 
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100vw',
                            height: '100vh'
                        }}
                    >
                        <motion.div
                            ref={modalRef}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-gray-200 flex flex-col overflow-hidden relative focus:outline-none"
                            onClick={e => e.stopPropagation()}
                            tabIndex={-1}
                            role="dialog"
                            aria-modal="true"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ 
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                                duration: 0.3
                            }}
                        >
                        {(() => { const p = pedidoSelecionado; return (
                        <>
                        {/* Header com gradiente */}
                        <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4 relative">
                            <button
                                className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl focus:outline-none transition-colors"
                                onClick={() => setPedidoSelecionado(null)}
                                aria-label="Fechar modal"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            
                            <div className="text-center pr-10">
                                <h3 className="text-2xl font-bold mb-2">Pedido #{p._id?.slice(-6)}</h3>
                                <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-100">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {p.data ? formatDate(p.data) : '-'}
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                                        ${p.status === 'entregue' ? 'bg-green-500/20 text-green-100' : ''}
                                        ${p.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-100' : ''}
                                        ${p.status === 'preparando' ? 'bg-blue-500/20 text-blue-100' : ''}
                                        ${p.status === 'em_entrega' ? 'bg-purple-500/20 text-purple-100' : ''}
                                        ${p.status === 'cancelado' ? 'bg-red-500/20 text-red-100' : ''}
                                    `}>
                                        {getStatusText(p.status)}
                                    </div>
                                    {p.endereco?.estimatedTime && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {p.endereco.estimatedTime}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Resumo do total */}
                        <div className="bg-purple-50 border-b border-purple-100 px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-lg font-bold text-purple-900">Total do Pedido:</span>
                                    <span className="text-2xl font-bold text-purple-600">R$ {calcularTotal(p).toFixed(2)}</span>
                                </div>
                                <div className="flex gap-2">
                                    {getNextStatus(p.status) && (
                                        <button
                                            onClick={() => updateOrderStatus(p._id, getNextStatus(p.status)!)}
                                            disabled={updatingStatus === p._id}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {updatingStatus === p._id ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Atualizando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    {getStatusText(getNextStatus(p.status)!)}
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleCompartilharPedido(p)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <FaShareAlt className="w-4 h-4" />
                                        Compartilhar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Conteúdo principal */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid lg:grid-cols-3 gap-6 p-6">
                                {/* Coluna 1: Cliente e Endereço */}
                                <div className="space-y-6">
                                    {/* Cliente */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Cliente
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-blue-700">Nome:</span>
                                                <span className="text-blue-900">{p.cliente?.nome || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-blue-700">Telefone:</span>
                                                <a href={`tel:${p.cliente?.telefone}`} className="text-blue-600 hover:text-blue-800 underline">
                                                    {p.cliente?.telefone || '-'}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Endereço */}
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                        <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {p.endereco ? 'Endereço de Entrega' : 'Retirada no Local'}
                                        </h4>
                                        {p.endereco ? (
                                            <div className="space-y-2 text-sm">
                                                <div className="font-medium text-green-900">
                                                    {p.endereco.address?.street}, {p.endereco.address?.number}
                                                    {p.endereco.address?.complement && ` - ${p.endereco.address.complement}`}
                                                </div>
                                                <div className="text-green-700">
                                                    Bairro: {p.endereco.address?.neighborhood || '-'}
                                                </div>
                                                {p.endereco.address?.referencePoint && (
                                                    <div className="text-green-700">
                                                        Referência: {p.endereco.address.referencePoint}
                                                    </div>
                                                )}
                                                <div className="bg-green-200 rounded-lg p-2 mt-2">
                                                    <div className="font-semibold text-green-800">
                                                        Taxa de entrega: R$ {p.endereco.deliveryFee?.toFixed(2) || '0,00'}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-green-700 text-sm">
                                                Cliente irá retirar o pedido no estabelecimento
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagamento */}
                                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                                        <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            Pagamento
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-yellow-700">Forma:</span>
                                                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                                                    {p.formaPagamento?.toLowerCase() === 'pix' ? '📱 PIX' :
                                                     p.formaPagamento?.toLowerCase() === 'cartao' ? '💳 Cartão' : '💵 Dinheiro'}
                                                </span>
                                            </div>
                                            {p.formaPagamento?.toLowerCase() === 'dinheiro' && p.troco && (
                                                <div className="bg-yellow-200 rounded-lg p-2">
                                                    <span className="font-semibold text-yellow-800">Troco para: R$ {p.troco}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Observações */}
                                    {p.observacoes && (
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                                            <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                </svg>
                                                Observações
                                            </h4>
                                            <div className="bg-orange-200 rounded-lg p-3 text-orange-900 text-sm font-medium">
                                                {p.observacoes}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Coluna 2 e 3: Itens do Pedido */}
                                <div className="lg:col-span-2">
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                        <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Itens do Pedido ({p.itens.length})
                                        </h4>
                                        
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {p.itens.map((item, idx) => (
                                                <div key={idx} className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                                {item.quantidade}
                                                            </div>
                                                            <h5 className="font-bold text-gray-900 text-lg">{item.nome}</h5>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-500">R$ {item.preco.toFixed(2)} × {item.quantidade}</div>
                                                            <div className="text-lg font-bold text-purple-600">
                                                                R$ {(item.preco * item.quantidade).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Detalhes do item */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                        {item.size !== undefined && item.size !== '' && (
                                                            <div className="bg-gray-50 rounded-lg p-2 border">
                                                                <span className="font-semibold text-gray-700">{item.sizesTitle || 'Tamanho'}:</span>
                                                                <div className="text-gray-900 mt-1">
                                                                    {Array.isArray(item.size) ? item.size.join(', ') : item.size}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {item.flavors && item.flavors.length > 0 && (
                                                            <div className="bg-gray-50 rounded-lg p-2 border">
                                                                <span className="font-semibold text-gray-700">{item.flavorsTitle || 'Sabores'}:</span>
                                                                <div className="text-gray-900 mt-1">{item.flavors.join(', ')}</div>
                                                            </div>
                                                        )}
                                                        
                                                        {item.border && (
                                                            <div className="bg-gray-50 rounded-lg p-2 border">
                                                                <span className="font-semibold text-gray-700">{item.borderTitle || 'Borda'}:</span>
                                                                <div className="text-gray-900 mt-1">{item.border}</div>
                                                            </div>
                                                        )}
                                                        
                                                        {item.extras && item.extras.length > 0 && (
                                                            <div className="bg-gray-50 rounded-lg p-2 border">
                                                                <span className="font-semibold text-gray-700">{item.extrasTitle || 'Extras'}:</span>
                                                                <div className="text-gray-900 mt-1">{item.extras.join(', ')}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {item.observacao && (
                                                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                                            <span className="font-semibold text-yellow-800">Observação:</span>
                                                            <div className="text-yellow-900 mt-1">{item.observacao}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Resumo financeiro */}
                                        <div className="mt-4 pt-4 border-t border-purple-200 bg-purple-100 rounded-lg p-3">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-purple-700">Subtotal dos itens:</span>
                                                    <span className="font-semibold">R$ {(calcularTotal(p) - (p.endereco?.deliveryFee || 0)).toFixed(2)}</span>
                                                </div>
                                                {p.endereco?.deliveryFee && p.endereco.deliveryFee > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-purple-700">Taxa de entrega:</span>
                                                        <span className="font-semibold">R$ {p.endereco.deliveryFee.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-lg font-bold text-purple-900 border-t border-purple-300 pt-2">
                                                    <span>Total:</span>
                                                    <span>R$ {calcularTotal(p).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </> ); })()}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}