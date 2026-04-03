# Onde colocar o pacote de imagens do Brand e Design System

Este documento orienta onde colocar cada tipo de asset (logo, ícones, ilustrações, etc.) do pacote de marca e design system da plataforma.

---

## Visão geral

| Destino | Caminho no projeto | Quando usar |
|--------|---------------------|-------------|
| **Assets públicos (URL fixa)** | `frontend/public/brand/` | Favicon, logo para HTML/PDF/email, og:image, ícones PWA |
| **Assets importados no código** | `frontend/src/assets/brand/` | Ilustrações, empty states, imagens usadas em componentes React |
| **Ícone principal (já no projeto)** | `frontend/public/favicon.svg` | Favicon e apple-touch atuais; pode ser substituído por versão do pacote |

---

## 1. `frontend/public/brand/`

**O que colocar:** arquivos que precisam de **URL fixa** (sem hash no nome), referenciados em HTML, manifest ou links externos.

Coloque aqui, por exemplo:

- **logo.svg** ou **logo.png** — logo completo (marca + texto) para uso em cabeçalhos, PDFs, emails
- **logo-icon.svg** — só o ícone ECG, se vier uma versão oficial do pacote
- **og-image.png** — imagem para compartilhamento em redes sociais (recomendado **1200×630 px**)
- **apple-touch-icon.png** — ícone “Adicionar à tela inicial” (opcional; hoje o app usa o favicon.svg)
- **icons/** — pastas ou arquivos para PWA, ex.:
  - **icon-192.png** (192×192)
  - **icon-512.png** (512×512)

**Como referenciar:**

- No HTML: `<meta property="og:image" content="/brand/og-image.png" />`
- No `manifest.json`: `"src": "/brand/icons/icon-192.png"`
- Em links ou PDFs: `https://seudominio.com/brand/logo.svg`

**Observação:** o **favicon** atual está em `frontend/public/favicon.svg` (raiz do `public`). Se no pacote vier um favicon ou ícone único para aba, você pode:
- substituir esse arquivo, ou
- colocar em `public/brand/` e alterar em `index.html`: `href="/brand/favicon.svg"`

---

## 2. `frontend/src/assets/brand/`

**O que colocar:** imagens e SVGs que são **importados em componentes React** (ilustrações, empty states, imagens de conteúdo).

Coloque aqui, por exemplo:

- Ilustrações para **empty state** (ex.: “Nenhum paciente ainda”)
- Imagens para **onboarding** ou telas de boas-vindas
- Logos ou ícones que você usa como `<img src={...}>` dentro de um componente
- Qualquer arte do design system que seja usada como **src** em JS/TS

**Como usar no código:**

```tsx
import emptyState from '@/assets/brand/empty-state.svg';

<img src={emptyState} alt="" role="presentation" className="max-w-xs" />
```

No build, o Vite gera um nome com hash (ex.: `assets/empty-state-abc123.svg`) para cache e otimização.

---

## 3. Estrutura sugerida do pacote após organizar

Você pode manter no repositório algo assim:

```
frontend/
├── public/
│   ├── favicon.svg              # (atual; pode ser trocado pelo do pacote)
│   ├── manifest.json
│   └── brand/
│       ├── README.md
│       ├── logo.svg
│       ├── logo-icon.svg
│       ├── og-image.png
│       ├── apple-touch-icon.png  # opcional
│       └── icons/
│           ├── icon-192.png
│           └── icon-512.png
│
└── src/
    └── assets/
        └── brand/
            ├── README.md
            ├── empty-state.svg
            ├── onboarding-hero.png
            └── ... (ilustrações usadas em componentes)
```

---

## 4. Referência ao Branding Book

As regras de uso (cores, tamanhos, contrastes) estão em **`docs/BRANDING_BOOK.md`**:

- **Seção 2** — Logotipo e ícone (IconPulse, favicon, tamanhos)
- **Seção 8** — Iconografia
- **Seção 10** — Layout (sidebar, login, etc.)

Ao adicionar novos assets, prefira nomes e formatos alinhados ao que está descrito no Branding Book (ex.: SVG para logo, PNG para og-image e PWA).

---

## 5. Checklist rápido

- [ ] Coloquei logos e ícones de **URL fixa** em `frontend/public/brand/`
- [ ] Coloquei **ilustrações e imagens de componente** em `frontend/src/assets/brand/`
- [ ] Atualizei `index.html` com `og:image` se tiver `og-image.png`
- [ ] Atualizei `manifest.json` com ícones 192/512 se tiver PWA
- [ ] Substituí `public/favicon.svg` (ou apontei para `/brand/`) se o pacote tiver favicon oficial

Se precisar de exemplos de como referenciar um arquivo específico do pacote (por nome ou tipo), diga qual é o arquivo e em que tela ou contexto quer usar.
