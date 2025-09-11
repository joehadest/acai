// src/components/AdminOrders.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
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
    const [modalAnim, setModalAnim] = useState(false);
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
            setModalAnim(false);
            const id = requestAnimationFrame(() => setModalAnim(true));
            // removido bloqueio de scroll
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return () => {
                cancelAnimationFrame(id);
            };
        }
    }, [pedidoSelecionado]);

    if (loading) return <div className="text-center py-10">Carregando pedidos...</div>;
    if (!pedidos.length) return <div className="text-center text-gray-500">Nenhum pedido recente.</div>;
    if (!mounted) return null; // evita mismatch de hidratação

    return (
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

            {/* Modal de detalhes */}
            {pedidoSelecionado && (
                <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-white/10 backdrop-blur-sm px-4 md:px-8" onClick={(e) => { if (e.target === e.currentTarget) setPedidoSelecionado(null); }}>
                    <div
                        ref={modalRef}
                        className={`mt-24 sm:mt-28 bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-md md:max-w-xl lg:max-w-3xl 2xl:max-w-4xl border border-gray-200 h-auto max-h-none flex flex-col overflow-visible relative focus:outline-none transform transition-all duration-300 ease-out 
                        ${modalAnim ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-[0.98]'}`}
                        onClick={e => e.stopPropagation()}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                    >
                        {(() => { const p = pedidoSelecionado; return (
                        <>
                        <header className="px-4 sm:px-6 pt-4 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <button
                                className="absolute top-2 right-2 text-purple-600 hover:text-purple-400 text-xl sm:text-2xl focus:outline-none no-print"
                                onClick={() => setPedidoSelecionado(null)}
                                aria-label="Fechar modal de pedido"
                            >&times;</button>
                            <h3 className="text-lg md:text-2xl font-bold text-purple-600 text-center pr-8">Pedido #{p._id?.slice(-6)}</h3>
                            <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-gray-600">
                                <div><span className="text-gray-500">Data:</span> <span className="text-gray-900">{p.data ? formatDate(p.data) : '-'}</span></div>
                                <div><span className="text-gray-500">Status:</span> <span className="font-semibold text-green-600">{getStatusText(p.status)}</span></div>
                                <div><span className="text-gray-500">Entrega:</span> <span className="text-gray-900">{p.endereco?.estimatedTime || '-'}</span></div>
                            </div>
                        </header>
                        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white sticky top-[68px] z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs uppercase tracking-wide text-gray-500">Total</span>
                                <span className="text-xl md:text-2xl font-bold text-purple-600">R$ {calcularTotal(p).toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                {getNextStatus(p.status) && (
                                    <button
                                        onClick={() => updateOrderStatus(p._id, getNextStatus(p.status)!)}
                                        disabled={updatingStatus === p._id}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                                    >
                                        {updatingStatus === p._id ? 'Atualizando...' : `Mover para ${getStatusText(getNextStatus(p.status)!)}`}
                                    </button>
                                )}
                                <button
                                    onClick={() => setPedidoSelecionado(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
                            <div className="grid lg:grid-cols-2 gap-6">
                                <section className="space-y-4">
                                    <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                                        <h4 className="font-semibold text-gray-500 mb-1 uppercase tracking-wide text-[11px] sm:text-xs">Cliente</h4>
                                        <div><span className="text-gray-500">Nome:</span> <span className="text-gray-900">{p.cliente?.nome || '-'}</span></div>
                                        <div><span className="text-gray-500">Telefone:</span> <span className="text-gray-900">{p.cliente?.telefone || '-'}</span></div>
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                                        <h4 className="font-semibold text-gray-500 mb-1 uppercase tracking-wide text-[11px] sm:text-xs">Endereço</h4>
                                        <div><span className="text-gray-500">Rua:</span> <span className="text-gray-900">{p.endereco?.address?.street || '-'}</span></div>
                                        <div><span className="text-gray-500">Número:</span> <span className="text-gray-900">{p.endereco?.address?.number || '-'}</span></div>
                                        {p.endereco?.address?.complement && <div><span className="text-gray-500">Compl:</span> <span className="text-gray-900">{p.endereco.address.complement}</span></div>}
                                        <div><span className="text-gray-500">Bairro:</span> <span className="text-gray-900">{p.endereco?.address?.neighborhood || '-'}</span></div>
                                        <div><span className="text-gray-500">Referência:</span> <span className="text-gray-900">{p.endereco?.address?.referencePoint || '-'}</span></div>
                                    </div>
                                    {p.observacoes && (
                                        <div className="text-xs sm:text-sm text-gray-700">
                                            <h4 className="font-semibold text-gray-500 mb-1 uppercase tracking-wide text-[11px] sm:text-xs">Observações</h4>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-[11px] sm:text-xs leading-snug">{p.observacoes}</div>
                                        </div>
                                    )}
                                    <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                                        <h4 className="font-semibold text-gray-500 mb-1 uppercase tracking-wide text-[11px] sm:text-xs">Pagamento</h4>
                                        <div><span className="text-gray-500">Forma:</span> <span className="text-gray-900">{
                                            p.formaPagamento?.toLowerCase() === 'pix' ? 'PIX' :
                                                p.formaPagamento?.toLowerCase() === 'cartao' ? 'Cartão' :
                                                    'Dinheiro'
                                        }</span></div>
                                        {p.formaPagamento?.toLowerCase() === 'dinheiro' && (
                                            <div><span className="text-gray-500">Troco para:</span> <span className="text-gray-900">R$ {p.troco || '-'}</span></div>
                                        )}
                                        <div><span className="text-gray-500">Taxa:</span> <span className="text-gray-900">R$ {p.endereco?.deliveryFee?.toFixed(2) || '0,00'}</span></div>
                                    </div>
                                </section>
                                <section className="space-y-4 lg:col-span-1">
                                    <div>
                                        <h4 className="font-semibold text-gray-500 mb-2 text-sm border-b border-gray-200 pb-1 uppercase tracking-wide">Itens do Pedido</h4>
                                        <ul className="space-y-3">
                                            {p.itens.map((item, idx) => (
                                                <li key={idx} className="text-sm text-gray-900 bg-gray-50 border border-gray-200 p-3 rounded-md shadow-xs">
                                                    <div className="flex justify-between font-semibold">
                                                        <span>{item.quantidade}x {item.nome}</span>
                                                        <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-[11px] sm:text-xs text-gray-600 mt-2 space-y-1 pl-2 border-l-2 border-purple-300">
                                                        {item.size !== undefined && item.size !== '' && (
                                                            <div>
                                                                <strong className="text-gray-700">{item.sizesTitle || 'Tamanho'}:</strong> {Array.isArray(item.size) ? item.size.join(', ') : item.size}
                                                            </div>
                                                        )}
                                                        {item.flavors && item.flavors.length > 0 && <div><strong className="text-gray-700">{item.flavorsTitle || 'Sabores'}:</strong> {item.flavors.join(', ')}</div>}
                                                        {item.border && <div><strong className="text-gray-700">{item.borderTitle || 'Borda'}:</strong> {item.border}</div>}
                                                        {item.extras && item.extras.length > 0 && <div><strong className="text-gray-700">{item.extrasTitle || 'Extras'}:</strong> {item.extras.join(', ')}</div>}
                                                        {item.observacao && <div><strong className="text-gray-700">Obs:</strong> {item.observacao}</div>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>
                            </div>
                        </div>
                        </> ); })()}
                        <style jsx global>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .print-pedido, .print-pedido * {
                visibility: visible !important;
              }
              .print-pedido {
                position: absolute !important;
                left: 0; top: 0; width: 80mm; min-width: 0; max-width: 100vw;
                background: white !important;
                color: #000 !important;
                font-size: 9px !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 2mm !important;
              }
              .print-pedido h3 {
                font-size: 11px !important;
                margin-bottom: 2mm !important;
                text-align: center !important;
              }
              .print-pedido h4 {
                font-size: 10px !important;
                margin-bottom: 1mm !important;
              }
              .print-pedido div, .print-pedido span {
                font-size: 9px !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .print-pedido button, .print-pedido .no-print {
                display: none !important;
              }
              .print-pedido ul {
                margin: 0 !important;
                padding: 0 !important;
              }
              .print-pedido li {
                margin-bottom: 1mm !important;
              }
            }
          `}</style>
                    </div>
                </div>
            )}
        </div>
    );
}