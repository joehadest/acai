import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

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
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI!, { bufferCommands: false, dbName: MONGODB_DB }).then((mongoose) => mongoose);
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}

const menuItemSchema = new mongoose.Schema({}, { strict: false });
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

export async function GET() {
    try {
        await connectDB();
        const menuItems = await MenuItem.find({});
        return NextResponse.json({ success: true, data: menuItems });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro ao buscar todos os itens do menu' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await connectDB();
        await MenuItem.deleteMany({});
        return NextResponse.json({ success: true, message: 'Todos os itens do cardápio foram removidos.' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro ao remover todos os itens do cardápio.' }, { status: 500 });
    }
}
