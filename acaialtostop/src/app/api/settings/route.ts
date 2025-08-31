// src/app/api/settings/route.ts

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { isRestaurantOpen, getRestaurantStatus } from '../../../utils/timeUtils';
import type { BusinessHoursConfig } from '../../../utils/timeUtils';

declare global {
    var mongoose: { conn: any, promise: any } | undefined;
}

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

const settingsSchema = new mongoose.Schema({
    allowHalfAndHalf: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: false },
    businessHours: {
        monday: { open: { type: Boolean, default: false }, start: String, end: String },
        tuesday: { open: { type: Boolean, default: false }, start: String, end: String },
        wednesday: { open: { type: Boolean, default: false }, start: String, end: String },
        thursday: { open: { type: Boolean, default: false }, start: String, end: String },
        friday: { open: { type: Boolean, default: false }, start: String, end: String },
        saturday: { open: { type: Boolean, default: false }, start: String, end: String },
        sunday: { open: { type: Boolean, default: false }, start: String, end: String }
    },
    deliveryFees: [{
        neighborhood: { type: String, required: true },
        fee: { type: Number, required: true, min: 0 }
    }],
    adminPassword: { type: String, default: 'admin123' },
    lastUpdated: { type: Date, default: Date.now },
    menuTitle: { type: String, default: "" },
    menuSubtitle: { type: String, default: "" },
    restaurantName: { type: String, default: "Do'Cheff" },
    restaurantSubtitle: { type: String, default: "Informações do Restaurante" },
    addressStreet: { type: String, default: "Rua Maria Luiza Dantas" },
    addressCity: { type: String, default: "Alto Rodrigues - RN" },
    contactPhone: { type: String, default: "+55 84 9872-9126" },
    paymentMethods: { type: String, default: "Aceitamos cartões de crédito/débito, PIX e dinheiro" },
    socialMediaInstagram: { type: String, default: "@docheff__" },
    cnpj: { type: String, default: "53.378.172/0001-60" },
    browserTitle: { type: String, default: "Do'Cheff - Cardápio Digital" },
    logoUrl: { type: String, default: "/logo.jpg" },
    whatsappNumber: { type: String, default: "" }
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

function isCurrentlyOpen(businessHours: any): boolean {
    return isRestaurantOpen(businessHours as BusinessHoursConfig);
}

export async function GET() {
    try {
        await connectDB();
        const settings = await Settings.findOne() || await Settings.create({});
        const isOpen = isCurrentlyOpen(settings.businessHours);
        const settingsData = settings.toObject();
        settingsData.isOpen = isOpen;
        return NextResponse.json({ success: true, data: settingsData });
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        return NextResponse.json({ success: false, message: 'Erro ao buscar configurações' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await connectDB();

        // Encontra o documento de configurações ou cria um novo se não existir
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        // Atualiza todos os campos do corpo da requisição
        Object.keys(body).forEach(key => {
            settings[key] = body[key];
        });
        
        // CORREÇÃO: Garante que o Mongoose saiba que o array de taxas foi modificado
        settings.markModified('deliveryFees');

        settings.lastUpdated = new Date();

        const updatedSettings = await settings.save();

        return NextResponse.json({ success: true, data: updatedSettings });
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return NextResponse.json(
            { success: false, message: `Erro ao atualizar configurações: ${errorMessage}` },
            { status: 500 }
        );
    }
}