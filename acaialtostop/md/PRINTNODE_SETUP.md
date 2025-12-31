# Como Configurar e Usar o PrintNode

## O que é PrintNode?

PrintNode é um serviço de impressão em nuvem que permite imprimir de qualquer lugar para impressoras conectadas. É ideal para impressoras térmicas POS que precisam receber comandos ESC/POS.

## Passo a Passo de Configuração

### 1. Criar Conta no PrintNode

1. Acesse [https://www.printnode.com](https://www.printnode.com)
2. Clique em "Sign Up" para criar uma conta gratuita
3. Complete o cadastro (a conta gratuita permite até 2 impressoras)

### 2. Instalar o Cliente PrintNode

O PrintNode precisa de um cliente instalado no computador onde a impressora está conectada:

#### Windows:
1. Baixe o instalador em: [https://www.printnode.com/download](https://www.printnode.com/download)
2. Execute o instalador e siga as instruções
3. O cliente será iniciado automaticamente

#### macOS:
1. Baixe o instalador para macOS
2. Execute o arquivo `.dmg`
3. Arraste o PrintNode para a pasta Applications
4. Abra o PrintNode e permita nas configurações de segurança

#### Linux:
1. Siga as instruções em: [https://www.printnode.com/download/linux](https://www.printnode.com/download/linux)

### 3. Obter a API Key

1. Faça login no [PrintNode Dashboard](https://app.printnode.com)
2. Vá em **Account** → **API Credentials**
3. Clique em **Create API Key**
4. Dê um nome para a chave (ex: "Açai Alto Stop")
5. **Copie a API Key** - você precisará dela no próximo passo

### 4. Configurar no Sistema

1. Acesse o painel admin do sistema
2. Vá em **Configurações** (Settings)
3. Procure pelo campo **"PrintNode API Key"**
4. Cole a API Key que você copiou
5. Salve as configurações

### 5. Conectar a Impressora

1. Certifique-se de que o cliente PrintNode está rodando no computador
2. Conecte sua impressora Knup POS ao computador (via USB)
3. O PrintNode detectará automaticamente a impressora
4. No Dashboard do PrintNode, você verá a impressora listada

## Como Usar

### Imprimir um Pedido

1. No painel admin, localize o pedido que deseja imprimir
2. Clique no botão **"Imprimir POS"** (botão verde)
3. Se o PrintNode estiver configurado:
   - Um modal aparecerá com as impressoras disponíveis
   - Selecione a impressora desejada
   - O pedido será enviado automaticamente para impressão
4. Se o PrintNode não estiver configurado:
   - O sistema tentará usar WebUSB (se disponível)
   - Caso contrário, fará download de um arquivo .bin para impressão manual

## Verificação de Status

### Verificar se o Cliente está Rodando

- **Windows**: Procure pelo ícone do PrintNode na bandeja do sistema
- **macOS**: Procure na barra de menu superior
- **Linux**: Verifique com `systemctl status printnode` ou `ps aux | grep printnode`

### Verificar Impressoras no Dashboard

1. Acesse [https://app.printnode.com](https://app.printnode.com)
2. Vá em **Printers**
3. Você verá todas as impressoras conectadas e seu status (online/offline)

## Solução de Problemas

### A impressora não aparece na lista

1. Verifique se o cliente PrintNode está rodando
2. Verifique se a impressora está conectada e ligada
3. No Dashboard do PrintNode, verifique se a impressora aparece como "online"
4. Tente reiniciar o cliente PrintNode

### Erro "PrintNode API Key não configurada"

1. Verifique se você salvou a API Key nas configurações do admin
2. Certifique-se de que copiou a chave completa (sem espaços extras)
3. Tente salvar novamente

### A impressão não funciona

1. Verifique se a impressora está online no Dashboard
2. Verifique se o cliente PrintNode está rodando
3. Teste imprimindo diretamente pelo Dashboard do PrintNode
4. Verifique os logs do PrintNode para erros

### Impressora aparece como "offline"

1. Verifique a conexão USB da impressora
2. Reinicie o cliente PrintNode
3. Desconecte e reconecte a impressora
4. Verifique se a impressora está ligada

## Recursos Adicionais

- **Documentação oficial**: [https://www.printnode.com/docs](https://www.printnode.com/docs)
- **Suporte**: [https://www.printnode.com/support](https://www.printnode.com/support)
- **API Reference**: [https://www.printnode.com/docs/api](https://www.printnode.com/docs/api)

## Limites da Conta Gratuita

- Até 2 impressoras
- Até 50 impressões por mês
- Suporte por email

Para mais impressoras ou mais impressões, considere um plano pago.

## Alternativas

Se o PrintNode não atender suas necessidades, você pode:

1. **Usar WebUSB**: Para impressão direta via navegador (requer Chrome/Edge)
2. **Download manual**: Baixar o arquivo .bin e usar um software de impressão POS local
3. **Outros serviços**: ESC/POS Printer, PrintNode alternativos, etc.

