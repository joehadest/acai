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

// Comandos ESC/POS para impressora Knup POS
const ESC = '\x1B';
const GS = '\x1D';

// Função auxiliar para centralizar texto
function centerText(text: string, width: number = 32): string {
    if (text.length >= width) return text;
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
}

// Mapeamento de caracteres UTF-8 para PC860 (Portuguese) - melhor para impressoras brasileiras
const utf8ToPc860: { [key: string]: number } = {
    // Acentos e caracteres especiais comuns em português (PC860)
    'á': 0xA0, 'à': 0x85, 'â': 0x83, 'ã': 0xC7, 'ä': 0x84,
    'Á': 0xB5, 'À': 0xB6, 'Â': 0xB7, 'Ã': 0x80, 'Ä': 0x8E,
    'é': 0x82, 'è': 0x8A, 'ê': 0x88, 'ë': 0x89,
    'É': 0x90, 'È': 0xD3, 'Ê': 0xD2, 'Ë': 0xD4,
    'í': 0xA1, 'ì': 0xD5, 'î': 0xD6, 'ï': 0xD7,
    'Í': 0xD1, 'Ì': 0xDE, 'Î': 0xDF, 'Ï': 0xE0,
    'ó': 0xA2, 'ò': 0xE2, 'ô': 0x93, 'õ': 0xE4, 'ö': 0x94,
    'Ó': 0xE3, 'Ò': 0xE5, 'Ô': 0xE6, 'Õ': 0xE7, 'Ö': 0xE8,
    'ú': 0xA3, 'ù': 0xE9, 'û': 0xEA, 'ü': 0xEB,
    'Ú': 0xEC, 'Ù': 0xED, 'Û': 0xEE, 'Ü': 0xEF,
    'ç': 0x87, 'Ç': 0x80,
    'ñ': 0xA4, 'Ñ': 0xA5,
    '°': 0xF8, 'º': 0xF8, 'ª': 0xF8,
    '€': 0xD5, '$': 0x24, '£': 0x9C,
    'R$': 0x52, // R$ será tratado separadamente
};

// Função para converter texto UTF-8 para PC860 (bytes)
function textToBytes(text: string): number[] {
    const bytes: number[] = [];
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charCode = text.charCodeAt(i);
        
        // Verificar se há mapeamento direto
        if (utf8ToPc860[char]) {
            bytes.push(utf8ToPc860[char]);
        }
        // Caracteres ASCII padrão (0x20-0x7E)
        else if (charCode >= 0x20 && charCode <= 0x7E) {
            bytes.push(charCode);
        }
        // Caracteres de controle (0x00-0x1F) - manter como estão
        else if (charCode < 0x20) {
            bytes.push(charCode);
        }
        // Tentar converter usando normalização Unicode
        else {
            // Normalizar e tentar mapear
            const normalized = char.normalize('NFD');
            if (normalized.length > 1) {
                // Caractere com diacrítico - tentar mapear a base
                const base = normalized[0];
                if (utf8ToPc860[base]) {
                    bytes.push(utf8ToPc860[base]);
                } else if (base.charCodeAt(0) >= 0x20 && base.charCodeAt(0) <= 0x7E) {
                    bytes.push(base.charCodeAt(0));
                } else {
                    bytes.push(0x3F); // '?' para caracteres não mapeados
                }
            } else {
                // Caractere não mapeado - usar '?'
                bytes.push(0x3F);
            }
        }
    }
    
    return bytes;
}

export function generateESCPOSCommands(pedido: Pedido, opts?: ReceiptOptions): Uint8Array {
    const commands: number[] = [];
    
    // Inicializar impressora
    commands.push(0x1B, 0x40); // ESC @ - Reset
    
    // Configurar codificação
    // ESC t n - Selecionar tabela de caracteres
    // n = 0: PC437 (USA), 1: Katakana, 2: PC850 (Multilingual), 3: PC860 (Portuguese)
    // Para impressoras Knup POS, tentar PC860 (Portuguese) primeiro
    commands.push(0x1B, 0x74, 0x03); // ESC t 3 - PC860 (Portuguese) - melhor para acentos em português
    
    // Se PC860 não funcionar, pode tentar CP850:
    // commands.push(0x1B, 0x74, 0x02); // ESC t 2 - CP850 (Multilingual)
    
    // Cabeçalho
    const s = opts?.settings;
    // Normalizar título removendo acentos para evitar problemas de codificação
    const title = (s?.restaurantName || 'ACAI ALTO STOP')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacríticos (acentos)
    
    // Centralizar e imprimir título (duplo tamanho)
    commands.push(0x1B, 0x61, 0x01); // ESC a 1 - Centralizar
    commands.push(0x1D, 0x21, 0x11); // GS ! 0x11 - Duplo tamanho (altura e largura)
    const titleBytes = textToBytes(title);
    commands.push(...titleBytes);
    commands.push(0x0A); // Line feed
    
    // Resetar tamanho
    commands.push(0x1D, 0x21, 0x00); // GS ! 0x00 - Tamanho normal
    
    // Informações do estabelecimento
    if (s?.cnpj) {
        commands.push(0x1B, 0x61, 0x01); // Centralizar
        commands.push(...textToBytes(`CNPJ: ${s.cnpj}\n`));
    }
    if (s?.addressStreet || s?.addressCity) {
        commands.push(0x1B, 0x61, 0x01); // Centralizar
        const endLine = `${s?.addressStreet || ''} ${s?.addressNumber || ''} - ${s?.addressCity || ''}`.trim();
        if (endLine) {
            commands.push(...textToBytes(`${endLine}\n`));
        }
    }
    if (s?.contactPhone) {
        commands.push(0x1B, 0x61, 0x01); // Centralizar
        commands.push(...textToBytes(`Tel: ${s.contactPhone}\n`));
    }
    
    // Linha separadora
    commands.push(0x1B, 0x61, 0x00); // Alinhar à esquerda
    commands.push(...textToBytes('================================\n'));
    
    // Data e hora
    const date = new Date(pedido.data);
    const pedidoId = String(pedido._id);
    commands.push(...textToBytes(`Data: ${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}\n`));
    commands.push(...textToBytes(`Pedido: #${pedidoId.slice(-6).toUpperCase()}\n\n`));
    
    // Cliente
    commands.push(...textToBytes(`Cliente: ${pedido.cliente.nome}\n`));
    commands.push(...textToBytes(`Telefone: ${pedido.cliente.telefone}\n\n`));
    
    // Tipo de entrega
    commands.push(...textToBytes(`Tipo: ${pedido.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}\n`));
    if (pedido.tipoEntrega === 'entrega' && pedido.endereco) {
        if ('address' in pedido.endereco && typeof pedido.endereco.address === 'object') {
            const addr = pedido.endereco.address as any;
            commands.push(...textToBytes(`Endereco: ${addr.street || ''}, ${addr.number || ''}\n`));
            if (addr.complement) {
                commands.push(...textToBytes(`Complemento: ${addr.complement}\n`));
            }
            commands.push(...textToBytes(`Bairro: ${addr.neighborhood || ''}\n`));
            if (addr.referencePoint) {
                commands.push(...textToBytes(`Ponto Ref: ${addr.referencePoint}\n`));
            }
        } else {
            const endereco = pedido.endereco as any;
            commands.push(...textToBytes(`Endereco: ${endereco.address || ''}\n`));
            if (endereco.complement) {
                commands.push(...textToBytes(`Complemento: ${endereco.complement}\n`));
            }
            commands.push(...textToBytes(`Bairro: ${endereco.neighborhood || ''}\n`));
        }
        const endereco = pedido.endereco as any;
        commands.push(...textToBytes(`Taxa Entrega: R$ ${endereco.deliveryFee?.toFixed(2) || '0.00'}\n`));
        if (endereco.estimatedTime) {
            commands.push(...textToBytes(`Previsao: ${endereco.estimatedTime}\n`));
        }
    }
    commands.push(0x0A); // Line feed
    
    // Itens
    commands.push(...textToBytes('================================\n'));
    commands.push(0x1B, 0x61, 0x01); // Centralizar
    commands.push(0x1D, 0x21, 0x01); // Texto em negrito
    commands.push(...textToBytes('ITENS\n'));
    commands.push(0x1D, 0x21, 0x00); // Reset negrito
    commands.push(0x1B, 0x61, 0x00); // Alinhar à esquerda
    commands.push(...textToBytes('================================\n'));
    
    const totalItens = pedido.itens.reduce((acc, it) => acc + (it.quantidade || 0), 0);
    commands.push(...textToBytes(`Qtd. Itens: ${totalItens}\n\n`));
    
    pedido.itens.forEach(item => {
        commands.push(...textToBytes(`${item.quantidade}x ${item.nome}\n`));
        if (item.size) {
            const sizeTitle = (item as any).sizesTitle || 'Tamanho';
            commands.push(...textToBytes(`  ${sizeTitle}: ${item.size}\n`));
        }
        if (item.border) {
            const borderTitle = (item as any).borderTitle || 'Borda';
            commands.push(...textToBytes(`  ${borderTitle}: ${item.border}\n`));
        }
        if ((item as any).flavors && (item as any).flavors.length > 0) {
            const flavorsTitle = (item as any).flavorsTitle || 'Sabores';
            commands.push(...textToBytes(`  ${flavorsTitle}: ${(item as any).flavors.join(', ')}\n`));
        }
        if (item.extras && item.extras.length > 0) {
            const extrasTitle = (item as any).extrasTitle || 'Extras';
            commands.push(...textToBytes(`  ${extrasTitle}: ${item.extras.join(', ')}\n`));
        }
        if (item.observacao) {
            commands.push(...textToBytes(`  Obs: ${item.observacao}\n`));
        }
        commands.push(...textToBytes(`  Subtotal: R$ ${(item.preco * item.quantidade).toFixed(2)}\n\n`));
    });
    
    // Totais
    commands.push(...textToBytes('================================\n'));
    const subtotal = pedido.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    commands.push(...textToBytes(`Subtotal: R$ ${subtotal.toFixed(2)}\n`));
    if (pedido.tipoEntrega === 'entrega' && pedido.endereco) {
        commands.push(...textToBytes(`Taxa Entrega: R$ ${pedido.endereco.deliveryFee.toFixed(2)}\n`));
    }
    commands.push(0x1D, 0x21, 0x11); // Duplo tamanho
    commands.push(...textToBytes(`TOTAL: R$ ${pedido.total.toFixed(2)}\n`));
    commands.push(0x1D, 0x21, 0x00); // Tamanho normal
    commands.push(0x0A); // Line feed
    
    // Forma de pagamento
    commands.push(...textToBytes(`Pagamento: ${pedido.formaPagamento.toUpperCase()}\n`));
    if (pedido.troco) {
        commands.push(...textToBytes(`Troco para: R$ ${pedido.troco}\n`));
    }
    commands.push(0x0A); // Line feed
    
    // Observações
    if (pedido.observacoes) {
        commands.push(...textToBytes('Observacoes:\n'));
        commands.push(...textToBytes(`${pedido.observacoes}\n\n`));
    }
    
    // Status
    commands.push(...textToBytes(`Status: ${pedido.status.toUpperCase()}\n\n`));
    
    // Rodapé
    commands.push(...textToBytes('================================\n'));
    commands.push(0x1B, 0x61, 0x01); // Centralizar
    commands.push(...textToBytes('OBRIGADO PELA PREFERENCIA!\n'));
    commands.push(0x1B, 0x61, 0x00); // Alinhar à esquerda
    commands.push(...textToBytes('================================\n\n\n'));
    
    // Cortar papel (se a impressora suportar)
    commands.push(0x1D, 0x56, 0x41, 0x03); // GS V A 3 - Cortar parcialmente
    
    // Avançar papel
    commands.push(0x0A, 0x0A, 0x0A); // 3 line feeds
    
    return new Uint8Array(commands);
}
