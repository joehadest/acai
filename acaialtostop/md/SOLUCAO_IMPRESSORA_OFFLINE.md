# 🔧 Solução: Impressora Aparece como Offline

## Problema
A impressora está conectada e funcionando, mas aparece como **"offline"** no sistema, mesmo estando online.

## ✅ Soluções Rápidas

### 1️⃣ Verificar no Dashboard do PrintNode

1. Acesse: **https://app.printnode.com**
2. Faça login
3. Clique em **"Printers"** (Impressoras)
4. Veja o status da sua impressora:
   - ✅ **"online"** = Tudo certo
   - ⚠️ **"offline"** = Problema de conexão
   - ❓ **"unknown"** = Status desconhecido

### 2️⃣ Reiniciar o PrintNode

**Windows:**
1. Clique com botão direito no ícone do PrintNode (bandeja do sistema)
2. Clique em **"Quit"** ou **"Sair"**
3. Abra o PrintNode novamente

**Mac:**
1. Clique no ícone do PrintNode (barra de menu)
2. Clique em **"Quit PrintNode"**
3. Abra o PrintNode novamente

### 3️⃣ Reconectar a Impressora

1. **Desconecte** o cabo USB da impressora
2. Aguarde 5 segundos
3. **Conecte** novamente
4. Aguarde o PrintNode detectar (pode levar alguns segundos)
5. Verifique no Dashboard se apareceu como "online"

### 4️⃣ Reiniciar o Computador

Às vezes um simples reinício resolve problemas de comunicação:
1. Salve tudo que está fazendo
2. Reinicie o computador
3. Abra o PrintNode novamente
4. Verifique se a impressora aparece como "online"

### 5️⃣ Verificar Drivers da Impressora

A impressora pode precisar de drivers específicos:

1. **Windows:**
   - Vá em: Configurações → Dispositivos → Impressoras
   - Veja se sua impressora aparece na lista
   - Se não aparecer, instale os drivers da Knup POS

2. **Mac:**
   - Vá em: Preferências do Sistema → Impressoras e Scanners
   - Veja se sua impressora aparece
   - Se não aparecer, adicione manualmente

### 6️⃣ Verificar Permissões do PrintNode

O PrintNode precisa de permissões para acessar a impressora:

**Windows:**
- O PrintNode deve ter permissões de administrador
- Clique com botão direito no PrintNode → "Executar como administrador"

**Mac:**
- Vá em: Configurações do Sistema → Privacidade e Segurança
- Dê permissões de acesso à impressora para o PrintNode

---

## 🔍 Diagnóstico Avançado

### Verificar Logs do PrintNode

**Windows:**
1. Clique com botão direito no ícone do PrintNode
2. Clique em **"View Logs"** ou **"Ver Logs"**
3. Procure por erros relacionados à impressora

**Mac:**
1. Abra o Console (aplicativo do Mac)
2. Procure por mensagens do PrintNode
3. Veja se há erros de conexão

### Testar Impressão Direta

1. No Dashboard do PrintNode (app.printnode.com)
2. Clique na sua impressora
3. Clique em **"Print Test Page"** (Imprimir Página de Teste)
4. Se imprimir, a impressora está funcionando
5. Se não imprimir, o problema é na comunicação

---

## ⚠️ Problemas Comuns

### "A impressora está ligada mas não aparece"

**Causa:** PrintNode não está detectando a impressora

**Solução:**
1. Verifique se o cabo USB está bem conectado
2. Tente outra porta USB
3. Reinicie o PrintNode
4. Instale/atualize os drivers da impressora

### "Aparece como offline mas funciona no Windows/Mac"

**Causa:** PrintNode não consegue se comunicar com a impressora

**Solução:**
1. Verifique se a impressora está configurada como "impressora compartilhada"
2. Tente adicionar a impressora manualmente no PrintNode
3. Verifique se há firewall bloqueando a conexão

### "Status muda entre online e offline constantemente"

**Causa:** Problema de conexão USB instável

**Solução:**
1. Troque o cabo USB
2. Tente outra porta USB
3. Verifique se o cabo não está danificado
4. Use uma porta USB 2.0 (mais estável que USB 3.0 para impressoras)

---

## 💡 Dica: Tentar Imprimir Mesmo Offline

O sistema agora permite tentar imprimir mesmo se a impressora aparecer como "offline" ou "unknown". 

**Como fazer:**
1. Clique em "Imprimir POS" no pedido
2. Se a impressora aparecer com status amarelo (não verde), você ainda pode tentar imprimir
3. Clique na impressora mesmo assim
4. O sistema tentará enviar o pedido para impressão

> ⚠️ **Nota**: Isso pode funcionar se a impressora estiver realmente conectada, mas o PrintNode não está reportando o status corretamente.

---

## 📞 Ainda Não Funcionou?

Se nenhuma das soluções acima funcionou:

1. **Verifique a documentação do PrintNode:**
   - https://www.printnode.com/docs

2. **Entre em contato com o suporte do PrintNode:**
   - https://www.printnode.com/support
   - Eles podem ajudar com problemas específicos de conexão

3. **Entre em contato com o suporte técnico do sistema:**
   - Forneça informações sobre:
     - Sistema operacional (Windows/Mac/Linux)
     - Modelo da impressora
     - Status exibido no Dashboard do PrintNode
     - Mensagens de erro (se houver)

---

## ✅ Checklist Final

Antes de desistir, verifique:

- [ ] PrintNode está rodando no computador
- [ ] Impressora está ligada
- [ ] Cabo USB está bem conectado
- [ ] Impressora aparece no Windows/Mac como impressora instalada
- [ ] Impressora aparece no Dashboard do PrintNode
- [ ] Tentei reiniciar o PrintNode
- [ ] Tentei reconectar a impressora
- [ ] Tentei reiniciar o computador
- [ ] Drivers da impressora estão instalados

Se todos os itens estão marcados e ainda não funciona, entre em contato com o suporte!

