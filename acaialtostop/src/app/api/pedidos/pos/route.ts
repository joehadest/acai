import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateESCPOSCommands } from '@/utils/printUtils';
import { Pedido } from '@/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pedidoId = searchParams.get('id');
        const format = searchParams.get('format') || 'base64'; // base64, hex, ou raw

        if (!pedidoId) {
            return NextResponse.json(
                { success: false, message: 'ID do pedido é obrigatório' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('pedidos');

        // Buscar pedido
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

        // Buscar configurações do restaurante
        let settingsDoc: any = null;
        try {
            settingsDoc = await db.collection('settings').findOne({});
        } catch (err) {
            console.error('Erro ao buscar configurações:', err);
        }

        const opts = settingsDoc ? {
            settings: {
                restaurantName: settingsDoc.restaurantName,
                cnpj: settingsDoc.cnpj,
                addressStreet: settingsDoc.addressStreet,
                addressNumber: settingsDoc.addressNumber,
                addressCity: settingsDoc.addressCity,
                contactPhone: settingsDoc.contactPhone,
            }
        } : undefined;

        // Gerar comandos ESC/POS
        const escposCommands = generateESCPOSCommands(pedido as unknown as Pedido, opts);

        // Retornar no formato solicitado
        if (format === 'base64') {
            // Converter para base64 para facilitar o envio via HTTP
            const base64 = Buffer.from(escposCommands).toString('base64');
            return NextResponse.json({
                success: true,
                data: base64,
                format: 'base64',
                pedidoId: pedidoId
            });
        } else if (format === 'hex') {
            // Converter para hexadecimal
            const hex = Array.from(escposCommands)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return NextResponse.json({
                success: true,
                data: hex,
                format: 'hex',
                pedidoId: pedidoId
            });
        } else {
            // Retornar raw (binary)
            return new NextResponse(escposCommands, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="pedido_${pedidoId.slice(-6)}.bin"`,
                },
            });
        }
    } catch (error) {
        console.error('Erro ao gerar comandos ESC/POS:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao gerar comandos de impressão' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { pedidoId, printerType = 'usb', printerPath } = await request.json();

        if (!pedidoId) {
            return NextResponse.json(
                { success: false, message: 'ID do pedido é obrigatório' },
                { status: 400 }
            );
        }

        // Buscar pedido e gerar comandos (mesmo código do GET)
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
        let settingsDoc: any = null;
        try {
            settingsDoc = await db.collection('settings').findOne({});
        } catch (err) {
            console.error('Erro ao buscar configurações:', err);
        }

        const opts = settingsDoc ? {
            settings: {
                restaurantName: settingsDoc.restaurantName,
                cnpj: settingsDoc.cnpj,
                addressStreet: settingsDoc.addressStreet,
                addressNumber: settingsDoc.addressNumber,
                addressCity: settingsDoc.addressCity,
                contactPhone: settingsDoc.contactPhone,
            }
        } : undefined;

        const escposCommands = generateESCPOSCommands(pedido as unknown as Pedido, opts);

        // Nota: Em um ambiente de produção, você precisaria de um serviço local
        // ou usar WebUSB API no cliente para enviar diretamente para a impressora
        // Por enquanto, retornamos os dados para o cliente processar

        return NextResponse.json({
            success: true,
            message: 'Comandos ESC/POS gerados com sucesso',
            data: Buffer.from(escposCommands).toString('base64'),
            format: 'base64',
            pedidoId: pedidoId,
            note: 'Use WebUSB API no cliente ou um serviço local para enviar à impressora'
        });
    } catch (error) {
        console.error('Erro ao processar impressão:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao processar impressão' },
            { status: 500 }
        );
    }
}

