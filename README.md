# Inc&Co

Site institucional responsivo em português, desenvolvido com Vite, HTML, CSS e JavaScript.

## Desenvolvimento

Node.js 22 ou superior.

```sh
npm ci --cache /tmp/inc-co-npm-cache
npm run dev -- --port 5173
```

## Produção

```sh
npm run build
npm run preview -- --port 4173
```

Publique a pasta `dist` em uma hospedagem estática.

## Conteúdo e contato

- `index.html`: conteúdo e estrutura.
- `src/style.css`: estrutura visual e layouts.
- `src/design-system.css`: aplicação dos tokens do `DESIGN.md`, com amarelo Inc&Co `#F9FF00`, fundo `#0B0E11`, superfícies `#1E2329`, espaçamento de 80 px e rodapé claro.
- A pilha BinanceNova/BinancePlex usa Inter e IBM Plex Sans como alternativas locais, conforme o documento. Os arquivos licenciados da Binance não estão incluídos.
- `src/main.js`: menu mobile, filtros, diálogos e preparação de contato por e-mail.
- Terra e Move são estudos conceituais, identificados na interface.
- O formulário prepara uma mensagem no aplicativo de e-mail e não envia dados a um servidor. O destinatário é `agenciaavengers@hotmail.com`, configurado no `mailto:` de `src/main.js`. O visitante revisa e envia a mensagem no próprio aplicativo de e-mail.

## Validação

Build de produção e navegação em Chromium nas larguras de 320, 360, 390, 768, 1024 e 1440 px, incluindo filtros, diálogos, serviços, menu e validação de campos.

## GitHub Pages

O site está preparado para o endereço `https://gxstavoluiz.github.io/Inc-Co-Site/`.
O caminho base `/Inc-Co-Site/` é definido em `vite.config.js` e também é usado em desenvolvimento.

1. No GitHub, abra **Settings → Pages** deste repositório.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Na aba **Actions**, abra **Publish Inc&Co to GitHub Pages**. Execute **Run workflow** na branch `main` se ainda não houver uma execução em andamento.
4. Aguarde os jobs `build` e `deploy` terminarem com sucesso. O link público aparecerá em **Settings → Pages**.

Novos commits enviados à branch `main` publicam o site automaticamente. A publicação inclui apenas o conteúdo de `dist`, não o código-fonte nem o documento de design. O formulário continua abrindo o aplicativo de e-mail do visitante; não requer servidor ou segredo.
