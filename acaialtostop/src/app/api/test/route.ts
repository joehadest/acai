import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
    try {
        console.log('Testando conexão com MongoDB...');
        const { db } = await connectToDatabase();

        console.log('Testando coleção pedidos...');
        const collection = db.collection('pedidos');

        // Contar documentos na coleção
        const count = await collection.countDocuments();
        console.log(`Total de pedidos na coleção: ${count}`);

        // Buscar um documento de exemplo
        const sample = await collection.findOne({});
        console.log('Amostra de documento:', sample ? 'Encontrado' : 'Nenhum documento encontrado');

        return NextResponse.json({
            success: true,
            message: 'API e MongoDB funcionando corretamente',
            timestamp: new Date().toISOString(),
            mongodb: {
                connected: true,
                totalPedidos: count,
                hasSample: !!sample
            }
        });
    } catch (error) {
        console.error('Erro no teste de MongoDB:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Erro na conexão com MongoDB',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
