import { NextResponse } from 'next/server';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            message: 'API funcionando corretamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro no endpoint de teste:', error);
        return NextResponse.json(
            { success: false, message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
