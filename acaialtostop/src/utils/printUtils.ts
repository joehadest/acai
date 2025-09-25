import { Pedido } from '@/types';

type ReceiptOptions = {
    settings?: {
        restaurantName?: string;
        cnpj?: string;
        addressStreet?: string;
        addressNumber?: string;
        addressCity?: string;
        contactPhone?: string;
    }
};

export function generateReceiptText(pedido: Pedido, opts?: ReceiptOptions): string {
    const lines: string[] = [];

    // Cabeçalho
    lines.push('================================');
    const s = opts?.settings;
    const title = (s?.restaurantName || 'ACAI ALTO STOP').toUpperCase();
    const centered = title.length >= 32 ? title : title.padStart(Math.floor((32 - title.length) / 2) + title.length).padEnd(32);
    lines.push(centered);
    if (s?.cnpj) lines.push(`CNPJ: ${s.cnpj}`);
    if (s?.addressStreet || s?.addressCity) {
        const endLine = `${s?.addressStreet || ''} ${s?.addressNumber || ''} - ${s?.addressCity || ''}`.trim();
        if (endLine) lines.push(endLine);
    }
    if (s?.contactPhone) lines.push(`Tel: ${s.contactPhone}`);
    lines.push('================================');
    lines.push('');

    // Data e hora
    const date = new Date(pedido.data);
    const pedidoId = String(pedido._id);
    lines.push(`Data: ${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`);
    lines.push(`Pedido: #${pedidoId.slice(-6).toUpperCase()}`);
    lines.push('');

    // Cliente
    lines.push(`Cliente: ${pedido.cliente.nome}`);
    lines.push(`Telefone: ${pedido.cliente.telefone}`);
    lines.push('');

    // Tipo de entrega
    lines.push(`Tipo: ${pedido.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}`);
    if (pedido.tipoEntrega === 'entrega' && pedido.endereco) {
        // Verificar se é a estrutura antiga (index.ts) ou nova (cart.ts)
        if ('address' in pedido.endereco && typeof pedido.endereco.address === 'object') {
            // Estrutura cart.ts
            const addr = pedido.endereco.address as any;
            lines.push(`Endereco: ${addr.street || ''}, ${addr.number || ''}`);
            if (addr.complement) {
                lines.push(`Complemento: ${addr.complement}`);
            }
            lines.push(`Bairro: ${addr.neighborhood || ''}`);
            lines.push(`Ponto Ref: ${addr.referencePoint || ''}`);
        } else {
            // Estrutura index.ts
            const endereco = pedido.endereco as any;
            lines.push(`Endereco: ${endereco.address || ''}`);
            if (endereco.complement) {
                lines.push(`Complemento: ${endereco.complement}`);
            }
            lines.push(`Bairro: ${endereco.neighborhood || ''}`);
        }
        const endereco = pedido.endereco as any;
        lines.push(`Taxa Entrega: R$ ${endereco.deliveryFee?.toFixed(2) || '0.00'}`);
        if (endereco.estimatedTime) {
            lines.push(`Previsão: ${endereco.estimatedTime}`);
        }
    }
    lines.push('');

    // Itens
    lines.push('================================');
    lines.push('           ITENS                ');
    lines.push('================================');
    lines.push(`Qtd. Itens: ${pedido.itens.reduce((acc, it) => acc + (it.quantidade || 0), 0)}`);
    lines.push('');
    pedido.itens.forEach(item => {
        lines.push(`${item.quantidade}x ${item.nome}`);
        if (item.size) {
            const sizeTitle = (item as any).sizesTitle || 'Tamanho';
            lines.push(`  ${sizeTitle}: ${item.size}`);
        }
        if (item.border) {
            const borderTitle = (item as any).borderTitle || 'Borda';
            lines.push(`  ${borderTitle}: ${item.border}`);
        }
        if ((item as any).flavors && (item as any).flavors.length > 0) {
            const flavorsTitle = (item as any).flavorsTitle || 'Sabores';
            lines.push(`  ${flavorsTitle}: ${(item as any).flavors.join(', ')}`);
        }
        if (item.extras && item.extras.length > 0) {
            const extrasTitle = (item as any).extrasTitle || 'Extras';
            lines.push(`  ${extrasTitle}: ${item.extras.join(', ')}`);
        }
        if (item.observacao) lines.push(`  Obs: ${item.observacao}`);
        lines.push(`  Subtotal: R$ ${(item.preco * item.quantidade).toFixed(2)}`);
        lines.push('');
    });

    lines.push('================================');

    // Totais
    const subtotal = pedido.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    lines.push(`Subtotal: R$ ${subtotal.toFixed(2)}`);
    if (pedido.tipoEntrega === 'entrega' && pedido.endereco) {
        lines.push(`Taxa Entrega: R$ ${pedido.endereco.deliveryFee.toFixed(2)}`);
    }
    lines.push(`TOTAL: R$ ${pedido.total.toFixed(2)}`);
    lines.push('');

    // Forma de pagamento
    lines.push(`Pagamento: ${pedido.formaPagamento.toUpperCase()}`);
    if (pedido.troco) {
        lines.push(`Troco para: R$ ${pedido.troco}`);
    }
    lines.push('');

    // Observações
    if (pedido.observacoes) {
        lines.push('Observacoes:');
        lines.push(pedido.observacoes);
        lines.push('');
    }

    // Status
    lines.push(`Status: ${pedido.status.toUpperCase()}`);
    lines.push('');

    // Rodapé
    lines.push('================================');
    lines.push('     OBRIGADO PELA PREFERENCIA! ');
    lines.push('================================');
    lines.push('');
    lines.push('');
    lines.push('');

    return lines.join('\n');
}

export function generateReceiptHTML(pedido: Pedido, opts?: ReceiptOptions): string {
    const pedidoId = typeof pedido._id === 'string' ? pedido._id : (pedido._id as any).toString();
    const text = generateReceiptText(pedido, opts);
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Recibo - Pedido ${pedidoId.slice(-6).toUpperCase()}</title>
            <style>
                @media print {
                    @page {
                        size: 58mm auto;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 5mm;
                    }
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    line-height: 1.2;
                    width: 48mm;
                    margin: 0 auto;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .center {
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="center">${text}</div>
        </body>
        </html>
    `;
}
