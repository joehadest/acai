import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
    try {
        console.log('🔍 Iniciando busca de pedidos para impressão...');

        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        console.log('📊 Verificando coleção de pedidos...');

        // Primeiro, vamos ver quantos documentos existem na coleção
        const totalPedidos = await collection.countDocuments();
        console.log(`📈 Total de pedidos na coleção: ${totalPedidos}`);

        if (totalPedidos === 0) {
            console.log('⚠️ Nenhum pedido encontrado na coleção');
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Nenhum pedido encontrado'
            });
        }

        // Definir statuses permitidos (personalizável via env ou query)
        const url = new URL(request.url);
        const allFlag = url.searchParams.get('all') === '1';
        const envStatuses = process.env.PEDIDOS_STATUS_IMPRESSAO;
        const allowedStatuses = envStatuses ? envStatuses.split(',').map(s=>s.trim()).filter(Boolean) : ['pendente','preparando','pronto'];
        let baseFilter: any;
        if (allFlag) {
            // Sem filtros: retorna tudo
            baseFilter = {};
        } else {
            baseFilter = {
                $and: [
                    { $or: [ { impresso: { $exists: false } }, { impresso: false } ] },
                    { status: { $regex: `^(${allowedStatuses.join('|')})$`, $options: 'i' } }
                ]
            };
        }
        console.log('🔎 Executando query de pedidos para impressão...', { filter: baseFilter, allFlag, allowedStatuses });
        const pedidosParaImprimir = await collection.find(baseFilter).sort({ data: 1 }).toArray();

        console.log(`✅ Encontrados ${pedidosParaImprimir.length} pedidos para impressão`);

        // Log detalhado dos pedidos encontrados
        pedidosParaImprimir.forEach((pedido, index) => {
            console.log(`📄 Pedido ${index + 1}: ID=${pedido._id}, Status=${pedido.status}, Impresso=${pedido.impresso}`);
        });

        // Converter ObjectIds para strings
        const pedidosFormatados = pedidosParaImprimir.map(pedido => ({
            ...pedido,
            _id: pedido._id.toString()
        }));

        console.log('📤 Retornando pedidos formatados...');

        return NextResponse.json({
            success: true,
            data: pedidosFormatados,
            total: pedidosFormatados.length,
            allowedStatuses,
            all: allFlag
        });
    } catch (error) {
        console.error('❌ Erro ao buscar pedidos para impressão:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'Stack não disponível');

        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar pedidos para impressão',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { pedidoId } = await request.json();

        if (!pedidoId) {
            return NextResponse.json(
                { success: false, message: 'ID do pedido é obrigatório' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        // Marcar o pedido como impresso
        const result = await collection.updateOne(
            { _id: new ObjectId(pedidoId) },
            {
                $set: {
                    impresso: true,
                    dataImpressao: new Date().toISOString()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao marcar pedido como impresso:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao marcar pedido como impresso' },
            { status: 500 }
        );
    }
}
