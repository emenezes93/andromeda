# Brand & Design System — assets públicos

Assets aqui são servidos na **raiz do build** e referenciados por **caminho absoluto** (ex.: `/brand/logo.svg`).

## O que colocar aqui

| Arquivo / pasta      | Uso |
|----------------------|-----|
| **logo.svg**         | Logo completo (marca + texto) para uso em PDFs, emails, cabeçalhos externos |
| **logo-icon.svg**    | Apenas ícone (ECG) — alternativa ao favicon se precisar de versão diferente |
| **og-image.png**     | Imagem para redes sociais (Open Graph) — recomendado 1200×630 px |
| **apple-touch-icon.png** | Ícone para “Adicionar à tela inicial” (opcional; hoje usamos favicon.svg) |
| **icons/**           | Ícones PWA em PNG (ex.: 192x192, 512x512) para `manifest.json` |
| **favicon.ico**      | Fallback para navegadores que não suportam SVG (opcional) |

## Onde NÃO colocar

- Imagens usadas **dentro de componentes React** (ilustrações, empty states) → use `src/assets/brand/` e import no código.

## Referência no projeto

- **index.html:** `og:image` → `<meta property="og:image" content="/brand/og-image.png" />`
- **manifest.json:** em `icons[]` pode apontar para `/brand/icons/icon-192.png` etc.
- **Favicon:** continua em `/favicon.svg` na raiz de `public/`.
