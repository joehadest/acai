// src/utils/priceCalculator.ts

import { MenuItem } from '../types/menu';

/**
 * Calcula o preço final de um item do menu com base nas opções selecionadas.
 * Esta função é a única fonte da verdade para o cálculo de preços.
 */
export const calculateItemPrice = (
    item: MenuItem,
    size?: string,
    border?: string,
    extras?: string[],
    observation?: string,
    allPizzas?: MenuItem[]
): number => {
    // Começa com o preço base do item. Se nenhum tamanho for selecionado, este será o preço.
    let price = item.price;

    // 1. Lógica para Tamanhos
    // Se um tamanho for selecionado e o item tiver opções de tamanho, atualiza o preço.
    if (size && item.sizes) {
        const sizeKey = size as keyof typeof item.sizes;
        price = item.sizes[sizeKey] || item.price; // Usa o preço do tamanho ou volta para o base.
    }

    // 2. Lógica para Pizza Meio a Meio (prevalece o maior valor)
    if (item.category === 'pizzas' && observation?.includes('Meio a meio:') && allPizzas && size && item.sizes) {
        const sizeKey = size as keyof typeof item.sizes;
        const meioAMeioText = observation.split('Meio a meio:')[1];
        const cleanMeioAMeioText = meioAMeioText.split(' - ')[0];
        const [sabor1, sabor2] = cleanMeioAMeioText.split('/').map(s => s.trim());
        const pizza1 = allPizzas.find((p: MenuItem) => p.name === sabor1);
        const pizza2 = allPizzas.find((p: MenuItem) => p.name === sabor2);

        if (pizza1 && pizza2) {
            const price1 = pizza1.sizes?.[sizeKey] || pizza1.price;
            const price2 = pizza2.sizes?.[sizeKey] || pizza2.price;
            price = Math.max(price1, price2);
        }
    }

    // 3. Adiciona o preço da Borda
    if (border && item.borderOptions) {
        const borderKey = border as keyof typeof item.borderOptions;
        price += item.borderOptions[borderKey] || 0;
    }

    // 4. Adiciona o preço dos Extras
    if (extras && item.extraOptions) {
        extras.forEach(extra => {
            const extraKey = extra as keyof typeof item.extraOptions;
            price += item.extraOptions![extraKey] || 0;
        });
    }

    return price;
};