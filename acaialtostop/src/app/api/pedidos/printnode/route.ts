import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateESCPOSCommands } from '@/utils/printUtils';
import { Pedido } from '@/types';

// PrintNode API base URL
const PRINTNODE_API_URL = 'https://api.printnode.com';

interface PrintNodePrinter {
    id: number;
    name: string;
    description: string;
    default: boolean;
    state: string;
}

/**
 * Lista todas as impressoras disponíveis no PrintNode
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'printers';

        // Buscar API Key do banco de dados
        const { db } = await connectToDatabase();
        const settings = await db.collection('settings').findOne({});
        
        if (!settings?.printnodeApiKey) {
            return NextResponse.json(
                { success: false, message: 'PrintNode API Key não configurada. Configure nas settings do admin.' },
                { status: 400 }
            );
        }

        const apiKey = settings.printnodeApiKey;

        if (action === 'printers') {
            // Listar impressoras
            const response = await fetch(`${PRINTNODE_API_URL}/printers`, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`PrintNode API error: ${response.status} - ${errorText}`);
            }

            const printers: PrintNodePrinter[] = await response.json();

            // Adicionar informações de debug sobre os estados das impressoras
            console.log('Printers encontradas:', printers.map(p => ({
                name: p.name,
                state: p.state,
                id: p.id
            })));

            return NextResponse.json({
                success: true,
                data: printers,
            });
        }

        return NextResponse.json(
            { success: false, message: 'Ação inválida' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Erro ao buscar impressoras PrintNode:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Erro ao buscar impressoras' },
            { status: 500 }
        );
    }
}

/**
 * Envia um pedido para impressão via PrintNode
 */
export async function POST(request: Request) {
    try {
        const { pedidoId, printerId } = await request.json();

        if (!pedidoId) {
            return NextResponse.json(
                { success: false, message: 'ID do pedido é obrigatório' },
                { status: 400 }
            );
        }

        if (!printerId) {
            return NextResponse.json(
                { success: false, message: 'ID da impressora é obrigatório' },
                { status: 400 }
            );
        }

        // Buscar pedido
        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        let pedido: any;
        try {
            pedido = await collection.findOne({ _id: new ObjectId(pedidoId) });
        } catch (objectIdError) {
            return NextResponse.json(
                { success: false, message: 'ID do pedido inválido' },
                { status: 400 }
            );
        }

        if (!pedido) {
            return NextResponse.json(
                { success: false, message: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        // Buscar configurações
        const settings = await db.collection('settings').findOne({});
        
        if (!settings?.printnodeApiKey) {
            return NextResponse.json(
                { success: false, message: 'PrintNode API Key não configurada' },
                { status: 400 }
            );
        }

        const apiKey = settings.printnodeApiKey;

        // Buscar configurações do restaurante
        const opts = settings ? {
            settings: {
                restaurantName: settings.restaurantName,
                cnpj: settings.cnpj,
                addressStreet: settings.addressStreet,
                addressNumber: settings.addressNumber,
                addressCity: settings.addressCity,
                contactPhone: settings.contactPhone,
            }
        } : undefined;

        // Gerar comandos ESC/POS
        const escposCommands = generateESCPOSCommands(pedido as unknown as Pedido, opts);

        // Converter para base64 para enviar ao PrintNode
        const base64Data = Buffer.from(escposCommands).toString('base64');

        // Criar job de impressão no PrintNode
        const printJob = {
            printerId: parseInt(printerId),
            title: `Pedido #${String(pedido._id).slice(-6)}`,
            contentType: 'raw_base64',
            content: base64Data,
            source: 'Açai Alto Stop - Sistema de Pedidos',
        };

        const response = await fetch(`${PRINTNODE_API_URL}/printjobs`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(printJob),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PrintNode API error:', errorText);
            throw new Error(`Erro ao enviar para PrintNode: ${response.status} - ${errorText}`);
        }

        const printJobResult = await response.json();

        return NextResponse.json({
            success: true,
            message: 'Pedido enviado para impressão com sucesso!',
            data: {
                printJobId: printJobResult.id,
                printerId: printerId,
                pedidoId: pedidoId,
            },
        });
    } catch (error: any) {
        console.error('Erro ao imprimir via PrintNode:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Erro ao imprimir via PrintNode' },
            { status: 500 }
        );
    }
}

