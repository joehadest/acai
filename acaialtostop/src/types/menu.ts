// src/types/menu.ts

// Interface para categoria, compatível com o backend
export interface Category {
    value: string;
    label: string;
    order?: number;
    allowHalfAndHalf?: boolean;
}
export interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    destaque: boolean;
    sizes?: {
        [key: string]: number;
    };
    // Novo campo para sabores
    flavorOptions?: {
        [key: string]: number;
    };
    borderOptions?: {
        [key: string]: number;
    };
    extraOptions?: {
        [key: string]: number;
    };
    ingredients?: string[];
    isAvailable?: boolean;
    maxExtras?: number;
    sizesTitle?: string;
    // Novos campos de título e máximo de escolhas para sabores
    flavorsTitle?: string;
    maxFlavors?: number;
    extrasTitle?: string;
    borderTitle?: string;
    maxSizes?: number;
}