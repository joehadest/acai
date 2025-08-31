// Script de teste para verificar se os títulos dos campos estão sendo salvos
// Execute este script no console do navegador para testar

async function testTitlesSaving() {
    console.log('🧪 Testando salvamento dos títulos dos campos...');

    try {
        // 1. Buscar itens do menu
        const response = await fetch('/api/menu');
        const data = await response.json();

        if (!data.success) {
            console.error('❌ Erro ao buscar itens do menu:', data.error);
            return;
        }

        const items = data.data;
        console.log(`📋 Encontrados ${items.length} itens no menu`);

        // 2. Verificar se os campos de título existem
        const itemsWithTitles = items.filter(item =>
            item.flavorsTitle || item.extrasTitle || item.borderTitle || item.sizesTitle
        );

        console.log(`✅ ${itemsWithTitles.length} itens têm campos de título definidos`);

        // 3. Mostrar exemplo de um item com títulos
        if (itemsWithTitles.length > 0) {
            const example = itemsWithTitles[0];
            console.log('📝 Exemplo de item com títulos:', {
                name: example.name,
                flavorsTitle: example.flavorsTitle,
                extrasTitle: example.extrasTitle,
                borderTitle: example.borderTitle,
                sizesTitle: example.sizesTitle
            });
        }

        // 4. Verificar itens sem títulos
        const itemsWithoutTitles = items.filter(item =>
            !item.flavorsTitle && !item.extrasTitle && !item.borderTitle && !item.sizesTitle
        );

        if (itemsWithoutTitles.length > 0) {
            console.log(`⚠️ ${itemsWithoutTitles.length} itens não têm campos de título definidos`);
            console.log('🔧 Estes itens podem precisar ser editados para definir os títulos');
        }

        console.log('✅ Teste concluído!');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

// Executar o teste
testTitlesSaving();
