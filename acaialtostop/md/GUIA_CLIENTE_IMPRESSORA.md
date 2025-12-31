# 📋 Guia de Configuração da Impressora - Para o Cliente

## O que você precisa saber

Para imprimir os pedidos automaticamente na sua impressora Knup POS, você precisa instalar um programa no computador onde a impressora está conectada. Esse programa se chama **PrintNode**.

## ⚙️ Passo a Passo Completo

### 1️⃣ Criar uma Conta Gratuita

1. Acesse o site: **https://www.printnode.com**
2. Clique no botão **"Sign Up"** (Cadastrar) no canto superior direito
3. Preencha seus dados:
   - Nome
   - Email
   - Senha
4. Confirme seu email (verifique sua caixa de entrada)
5. Faça login na sua conta

> 💡 **Dica**: A conta gratuita permite até 2 impressoras e 50 impressões por mês. É suficiente para começar!

---

### 2️⃣ Instalar o Programa PrintNode

O PrintNode precisa estar rodando no computador onde sua impressora está conectada.

#### 📱 Para Windows:

1. Acesse: **https://www.printnode.com/download**
2. Clique em **"Download for Windows"**
3. Execute o arquivo baixado (ex: `PrintNode.exe`)
4. Siga as instruções de instalação
5. O programa será instalado e iniciado automaticamente
6. Você verá um ícone do PrintNode na bandeja do sistema (canto inferior direito)

#### 🍎 Para Mac (macOS):

1. Acesse: **https://www.printnode.com/download**
2. Clique em **"Download for Mac"**
3. Abra o arquivo `.dmg` baixado
4. Arraste o PrintNode para a pasta "Applications" (Aplicativos)
5. Abra o PrintNode pela primeira vez
6. Se aparecer um aviso de segurança, vá em:
   - **Configurações do Sistema** → **Privacidade e Segurança**
   - Clique em **"Abrir mesmo assim"**
7. O PrintNode ficará rodando na barra de menu (parte superior)

#### 🐧 Para Linux:

1. Acesse: **https://www.printnode.com/download/linux**
2. Siga as instruções específicas para sua distribuição Linux
3. O programa ficará rodando em segundo plano

---

### 3️⃣ Conectar a Impressora

1. **Conecte sua impressora Knup POS ao computador** via cabo USB
2. **Ligue a impressora** (certifique-se de que está ligada)
3. O PrintNode detectará automaticamente a impressora
4. Aguarde alguns segundos para a detecção

> ⚠️ **Importante**: A impressora precisa estar **ligada e conectada** para aparecer no sistema.

---

### 4️⃣ Obter a Chave de Acesso (API Key)

Esta é a chave que você vai colar no painel admin do sistema:

1. Acesse: **https://app.printnode.com**
2. Faça login com sua conta
3. No menu superior, clique em **"Account"** (Conta)
4. Clique em **"API Credentials"** (Credenciais da API)
5. Clique no botão **"Create API Key"** (Criar Chave de API)
6. Dê um nome para a chave, por exemplo: **"Açai Alto Stop"**
7. Clique em **"Create"** (Criar)
8. **COPIE A CHAVE** que aparece na tela
   - Ela será algo como: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **IMPORTANTE**: Copie a chave completa! Você não poderá vê-la novamente depois.

---

### 5️⃣ Configurar no Sistema

1. Acesse o **painel admin** do seu sistema de pedidos
2. Vá em **"Configurações"** (Settings)
3. Role a página até encontrar a seção **"Configurações de Impressão (PrintNode)"**
4. Cole a chave que você copiou no campo **"PrintNode API Key"**
5. Clique em **"Salvar Alterações"**
6. Aguarde a mensagem de confirmação: **"Alterações salvas!"**

---

### 6️⃣ Verificar se Está Funcionando

1. No painel admin, vá em **"Pedidos"**
2. Clique no botão **"Imprimir POS"** (botão verde) em qualquer pedido
3. Se tudo estiver configurado corretamente:
   - Um pop-up aparecerá mostrando suas impressoras
   - Você verá o nome da sua impressora Knup POS
   - Clique na impressora para imprimir
4. O pedido será enviado automaticamente para impressão! 🎉

---

## ✅ Checklist de Verificação

Antes de usar, verifique se:

- [ ] Conta no PrintNode criada
- [ ] Programa PrintNode instalado e rodando no computador
- [ ] Impressora conectada via USB e ligada
- [ ] Impressora aparece no Dashboard do PrintNode (https://app.printnode.com)
- [ ] API Key copiada e colada nas configurações do sistema
- [ ] Configurações salvas com sucesso

---

## 🔍 Como Verificar se o PrintNode Está Rodando

### Windows:
- Procure pelo ícone do PrintNode na **bandeja do sistema** (canto inferior direito)
- Se não estiver visível, clique na seta para cima (^) para ver ícones ocultos

### Mac:
- Procure pelo ícone do PrintNode na **barra de menu** (parte superior)
- Se não estiver rodando, abra o PrintNode pela pasta Applications

### Verificar no Dashboard:
1. Acesse: **https://app.printnode.com**
2. Faça login
3. Clique em **"Printers"** (Impressoras)
4. Você deve ver sua impressora listada
5. O status deve aparecer como **"online"** (online)

---

## ❓ Problemas Comuns e Soluções

### A impressora não aparece na lista

**Solução:**
1. Verifique se o PrintNode está rodando (veja ícone na bandeja/barra de menu)
2. Verifique se a impressora está ligada e conectada via USB
3. Tente desconectar e reconectar o cabo USB
4. Reinicie o programa PrintNode
5. Verifique no Dashboard do PrintNode se a impressora aparece lá

### Erro "PrintNode API Key não configurada"

**Solução:**
1. Verifique se você copiou a chave completa (sem espaços extras)
2. Vá em Configurações e cole a chave novamente
3. Certifique-se de clicar em "Salvar Alterações"
4. Recarregue a página e verifique se a chave ainda está lá

### A impressão não funciona

**Solução:**
1. Verifique se a impressora está **online** no Dashboard do PrintNode
2. Verifique se o PrintNode está rodando no computador
3. Teste imprimindo diretamente pelo Dashboard do PrintNode
4. Verifique se há papel na impressora
5. Verifique se a impressora não está com erro (luzes piscando, etc.)

### A chave desaparece depois de salvar

**Solução:**
1. Recarregue a página
2. Se ainda não aparecer, entre em contato com o suporte técnico
3. Pode ser necessário criar uma nova API Key no PrintNode

---

## 📞 Precisa de Ajuda?

Se tiver problemas:

1. **Documentação oficial do PrintNode**: https://www.printnode.com/docs
2. **Suporte do PrintNode**: https://www.printnode.com/support
3. **Entre em contato com o suporte técnico** do sistema

---

## 💡 Dicas Importantes

- ✅ Mantenha o PrintNode rodando sempre que quiser imprimir pedidos
- ✅ A impressora precisa estar ligada e conectada
- ✅ Você pode usar até 2 impressoras na conta gratuita
- ✅ A conta gratuita permite 50 impressões por mês
- ✅ Se precisar de mais, considere um plano pago do PrintNode

---

## 🎯 Resumo Rápido

1. **Criar conta** em printnode.com
2. **Instalar programa** PrintNode no computador
3. **Conectar impressora** via USB
4. **Copiar API Key** do Dashboard
5. **Colar no sistema** em Configurações
6. **Pronto!** Agora é só clicar em "Imprimir POS" nos pedidos

---

**Boa sorte com suas impressões! 🖨️✨**

