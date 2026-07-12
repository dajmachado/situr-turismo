# SITUR Turismo — Site Premium

Site institucional + CMS da SITUR Turismo, construído com Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion e Lenis.

## Rodando o projeto

```bash
npm install
npm run dev
```

O site fica disponível em http://localhost:3000.

## Painel administrativo

- URL: http://localhost:3000/admin
- Senha padrão: `situr2026` (altere definindo a variável de ambiente `ADMIN_PASSWORD`)

No painel é possível gerenciar:

- **Viagens** — dados, preço, parcelamento, vagas, imagem de capa, galeria própria de cada viagem, roteiro interativo dia a dia (com atividades, horários, fotos e mapas), hotel, inclusos/exclusos e FAQ.
- **Banners do carrossel** — imagem, título, subtítulo, preço, ordem e viagem vinculada.
- **Galeria do site** — cada foto pertence ao álbum de uma viagem. Na home aparece a capa de cada álbum com o nome da viagem sobreposto; ao clicar, o visitante vê todas as fotos daquela viagem em `/galeria/<slug>`.

Os uploads de imagem são otimizados automaticamente com **sharp**: redimensionados para no máximo 1920px e convertidos para WebP (qualidade 82), reduzindo bastante o peso sem perda visível de qualidade.

Tudo cadastrado aparece automaticamente no site.

## Pagamento online (InfinitePay)

O site tem checkout próprio em `/checkout/<viagem>`: o cliente informa os dados, escolhe a quantidade de passageiros, revisa o pedido e é levado ao **ambiente de pagamento seguro da InfinitePay** (Pix com aprovação na hora ou cartão em até 12x). Depois de pagar, volta automaticamente para o site da SITUR, que confirma o pagamento e mostra a reserva confirmada.

Para ativar:

1. Tenha uma conta InfinitePay com o Checkout habilitado (é gratuito): https://www.infinitepay.io/checkout
2. Copie `.env.example` para `.env.local` e preencha `INFINITEPAY_HANDLE` com a sua InfiniteTag (ex.: `situr` — com ou sem o `$`). Não precisa de chave de API.
3. Reinicie o servidor. Sem o handle, o checkout mostra um aviso e oferece reserva pelo WhatsApp.
4. Em produção, preencha também `NEXT_PUBLIC_SITE_URL` (URL pública do site, usada no retorno do checkout) e, opcionalmente, `INFINITEPAY_WEBHOOK_URL` para confirmação imediata via webhook.

Como funciona por dentro:

- O valor é sempre calculado no servidor (preço da viagem × passageiros, enviado em centavos) — o cliente não consegue adulterar o total.
- Cada pagamento cria uma reserva em `data/reservations.json` com `order_nsu` = id da reserva; na volta do checkout, o site reconfirma o pagamento na API da InfinitePay (`payment_check`) antes de aprovar — nunca confia só no redirect ou no corpo do webhook.
- Quando aprovado, as vagas da viagem são descontadas automaticamente (uma única vez).
- As reservas aparecem no painel em **Admin → Reservas Online**, com status, valor, NSU da transação e totais.

## Mapa de poltronas do ônibus

No checkout, o cliente escolhe as poltronas num **mapa visual do ônibus** (suporta 1 ou 2 andares — a Oktoberfest, com 92 lugares, usa double-decker). Ao escolher mais de uma poltrona, o site pede o **nome (e documento opcional) de cada passageiro**; a primeira poltrona já vem com o nome do responsável pela reserva.

- Assentos já vendidos ficam bloqueados: os vendidos **online** travam automaticamente (reservas aprovadas + pendentes recentes); os vendidos **presencialmente** o admin marca na aba **Ônibus** de cada viagem (clicando nas poltronas).
- As plantas seguem os **dois ônibus reais da SITUR**: Leito DD 43 lugares (2 andares, 2+1 no superior, com TV/escada/geladeira/banheiro) e Executivo 46 lugares (2+2, geladeira e WC no fundo). Na aba **Ônibus** da viagem escolhe-se o tipo e a **quantidade de ônibus** (ex.: Oktoberfest = 2× Executivo 46 = 92 lugares); com 2+ ônibus o mapa mostra "Ônibus 1", "Ônibus 2" etc. e as poltronas são identificadas como "Ônibus 1 · polt. 15".
- O valor é sempre `preço × nº de poltronas`, calculado no servidor. Antes de cobrar, o servidor revalida que as poltronas ainda estão livres (evita reserva duplicada).
- As reservas no admin mostram as poltronas e o nome de cada passageiro.
- **Vagas totais/restantes não são mais digitadas à mão**: são calculadas automaticamente a partir do tipo/quantidade de ônibus e da ocupação real do mapa (bloqueios + reservas online + vendas no balcão). Isso vale em todo o site — cards, página da viagem e admin sempre mostram o número real, sem risco de ficar desatualizado.

## Financeiro por viagem

Cada viagem tem uma tela de **Financeiro** (ícone de carteira na lista de viagens, ou `/admin/viagens/<id>/financeiro`) com receita, despesas e lucro:

- **Receita**: somada automaticamente das reservas online aprovadas + vendas no balcão pagas (mesmos números da Lista de Embarque).
- **Despesas**: lançadas manualmente por categoria (ônibus/frota, hospedagem, alimentação, ingressos, guia/equipe, combustível, pedágio, outros), com descrição, valor e data opcional.
- **Lucro**: receita − despesas, com a margem em % exibida no card.

Os dados ficam em `data/expenses.json`.

## Parcelamento manual (carnê Pix)

Reproduz digitalmente o controle de carnê que a Sandra e a Ivonete faziam à mão — **é 100% manual, só liberado no admin**: nada é cobrado automaticamente, o cliente paga o Pix por fora e a equipe dá baixa quando o comprovante chega.

Para criar um carnê: na **Lista de Embarque** de uma viagem, clique em **Venda no balcão** e escolha a forma de pagamento **"Pix Parcelado (Carnê)"**. Aparecem os campos do titular (CPF, nascimento, endereço, CEP) e o gerador de parcelas — informe a quantidade e a data da 1ª parcela e clique em **Gerar parcelas**; cada parcela fica numa linha editável (data e valor), dá pra adicionar/remover parcelas avulsas para vencimentos irregulares.

O controle do dia a dia fica em **Admin → Parcelamentos** (`/admin/parcelamentos`), que lista todos os carnês de todas as viagens:

- Progresso de cada carnê (X de Y parcelas pagas, valor pago/total), com parcelas atrasadas destacadas em vermelho.
- **Dar baixa** / desfazer com um clique em cada parcela — quando a última é paga, o carnê vira "Quitado" automaticamente e a confirmação (e-mail/WhatsApp) é disparada como qualquer outra venda.
- **Imprimir carnê**: gera a mesma carta que a Sandra/Ivonete usavam (SITUR, destino, dados do titular, tabela de parcelas, observação, contatos) pronta para entregar ou salvar em PDF.
- **Enviar por WhatsApp**: quando há telefone cadastrado, monta a mensagem com o mesmo conteúdo pronta para enviar.

Os dados ficam dentro da própria venda em `data/manual-bookings.json` (campo `installments`).

## Confirmação automática de reserva (e-mail e WhatsApp)

Assim que uma reserva é aprovada — pagamento online confirmado ou venda no balcão marcada como "pago" — o site tenta enviar a confirmação automaticamente:

- **E-mail**: enviado via SMTP (qualquer provedor — Gmail, Outlook, SendGrid etc.) se `SMTP_HOST`, `SMTP_USER` e `SMTP_PASS` estiverem preenchidos no `.env.local`. Com Gmail, use uma [senha de app](https://myaccount.google.com/apppasswords), não a senha normal da conta.
- **WhatsApp automático**: opcional e mais avançado, via [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) da Meta (exige app Business e número comercial verificado). Ative preenchendo `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`.
- **Sem nenhum dos dois configurados**, nada quebra: o admin sempre tem um botão verde de WhatsApp (ícone 💬) em **Reservas Online** e na **Lista de Embarque**, ao lado de cada passageiro confirmado, que abre o WhatsApp já com a mensagem de confirmação pronta para enviar com um clique.

A mensagem inclui nome do passageiro, viagem, data, poltronas (ou nº de passageiros), valor e o contato da SITUR para dúvidas. Uma falha no envio nunca impede a confirmação do pagamento — a notificação é só "melhor esforço".

## Lista de embarque e vendas no balcão

Cada viagem tem uma **Lista de Embarque** (Admin → Viagens → ícone de passageiros, ou `/admin/viagens/<id>/passageiros`) que unifica **reservas online + vendas registradas manualmente** pela equipe.

- **Venda no balcão**: registre quem comprou por fora (dinheiro/Pix/cartão/transferência/cortesia), escolhendo a poltrona no mesmo mapa do ônibus, com nome e documento de cada passageiro, ponto de embarque e observações. A poltrona vendida no balcão trava automaticamente no site.
- **Manifesto unificado**: tabela ordenada por poltrona com passageiro, contato, origem (online/balcão), valor, forma de pagamento e status (confirmado/aguardando/reservado).
- **Resumo**: confirmados, livres, bloqueados e financeiro (recebido online + balcão, a receber).
- **Imprimir** gera uma lista de embarque para levar no ônibus (com coluna de assinatura); **CSV** exporta tudo para Excel.

Os dados ficam em `data/manual-bookings.json`.

## Login com Google e base de clientes

O checkout funciona **sem login** (comprar como convidado), mas o cliente pode clicar em **"Continuar com Google"** para ter os dados preenchidos automaticamente e acessar a página **/minhas-reservas** (acompanha status das reservas). Todo comprador — logado ou não — entra automaticamente na base de clientes, visível em **Admin → Clientes** (contato, reservas confirmadas, total gasto).

Para ativar o botão do Google:

1. Acesse https://console.cloud.google.com/apis/credentials (crie um projeto se não tiver).
2. Configure a "Tela de consentimento OAuth" (tipo Externo, nome SITUR Turismo, seu e-mail).
3. Crie uma credencial **ID do cliente OAuth** → tipo **Aplicativo da Web**:
   - Origens JavaScript autorizadas: `http://localhost:3010` (dev) e depois `https://seudominio.com.br`
4. Copie o **Client ID** (termina em `.apps.googleusercontent.com`) para `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no `.env.local` e reinicie o servidor.

Sem o Client ID, o botão simplesmente não aparece e tudo continua funcionando como convidado. Os clientes ficam em `data/customers.json`; a sessão usa cookie httpOnly (`situr_session`) validado no servidor.

## Onde os dados ficam

- Conteúdo em `data/*.json` (viagens, banners, galeria, depoimentos).
- Imagens enviadas pelo painel em `public/uploads/`.
- Informações fixas (telefone, WhatsApp, CNPJ, Cadastur, endereço, estatísticas) em `lib/site-config.ts` — edite lá para trocar os dados reais da empresa.

## Estrutura

- `app/(site)` — páginas públicas (home, viagens, roteiros, sobre, contato, política de privacidade)
- `app/admin` — painel administrativo (protegido por senha via middleware)
- `app/api` — API do CMS (auth, trips, banners, gallery, upload)
- `components` — componentes do site e do admin
- `lib` — tipos, acesso a dados e utilidades
