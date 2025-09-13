import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Conexão com MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
    throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
}
if (!MONGODB_DB) {
    throw new Error('Por favor, defina a variável de ambiente MONGODB_DB');
}

let cached = global.mongoose ?? (global.mongoose = { conn: null, promise: null });

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            dbName: MONGODB_DB,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

// Schema do Menu
const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    destaque: {
        type: Boolean,
        default: false
    },
    sizes: {
        type: Map,
        of: Number,
        default: {}
    },
    ingredients: {
        type: [String],
        default: []
    },
    borderOptions: {
        type: Map,
        of: Number,
        default: {}
    },
    extraOptions: {
        type: Map,
        of: Number,
        default: {}
    },
    flavorOptions: {
        type: Map,
        of: Number,
        default: {}
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    maxFlavors: {
        type: Number,
        default: 1
    },
    // Campos de título para as opções
    sizesTitle: {
        type: String,
        default: 'Tamanhos'
    },
    flavorsTitle: {
        type: String,
        default: 'Sabores'
    },
    extrasTitle: {
        type: String,
        default: 'Adicionais'
    },
    borderTitle: {
        type: String,
        default: 'Bordas'
    },
    maxSizes: {
        type: Number,
        default: 1
    },
    maxExtras: {
        type: Number,
        default: 1
    }
});

const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

// Nenhum item inicial será criado
const initialMenuItems: any[] = [];

export async function GET() {
    try {
        await connectDB();

        const count = await MenuItem.countDocuments();

        // Se não houver itens E a lista inicial não estiver vazia, insere os dados
        if (count === 0 && initialMenuItems.length > 0) {
            await MenuItem.insertMany(initialMenuItems);
        }

        const menuItems = await MenuItem.find({ isAvailable: { $ne: false } });

        return NextResponse.json({
            success: true,
            data: menuItems
        }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error('GET /api/menu - Erro:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar itens do menu' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();

        const newItem = new MenuItem(body);
        const savedItem = await newItem.save();

        return NextResponse.json({
            success: true,
            data: savedItem
        }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        // Tratamento específico para erros de validação do Mongoose
        if (error && typeof error === 'object' && (error as any).name === 'ValidationError') {
            const validation = error as any;
            const fieldErrors: Record<string, string> = {};
            Object.keys(validation.errors || {}).forEach((k) => {
                fieldErrors[k] = validation.errors[k].message;
            });
            console.error('POST /api/menu - ValidationError:', fieldErrors);
            return NextResponse.json(
                { success: false, error: 'Erro de validação', fields: fieldErrors },
                { status: 400 }
            );
        }
        console.error('POST /api/menu - Erro inesperado:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao criar item do menu' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        await connectDB();
        const body = await request.json();

        const { _id, ...updateData } = body;
        const updatedItem = await MenuItem.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updatedItem) {
            return NextResponse.json(
                { success: false, error: 'Item não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedItem
        }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error('PUT /api/menu - Erro:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar item do menu' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID do item é obrigatório' },
                { status: 400 }
            );
        }

        const deletedItem = await MenuItem.findByIdAndDelete(id);

        if (!deletedItem) {
            return NextResponse.json(
                { success: false, error: 'Item não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Item deletado com sucesso'
        }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error('DELETE /api/menu - Erro:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar item do menu' },
            { status: 500 }
        );
    }
}