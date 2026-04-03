# Brand & Design System — assets importados no código

Assets aqui são **importados em componentes** (ex.: `import logo from '@/assets/brand/logo.svg'`). O Vite inclui hash no nome no build (cache e otimização).

## O que colocar aqui

| Tipo | Exemplo | Uso |
|------|---------|-----|
| **Ilustrações** | empty-state.svg, onboarding-hero.png | Empty states, onboarding, telas de sucesso |
| **Imagens de conteúdo** | ícones de categoria, avatares padrão | Componentes que precisam de `src={url}` |
| **Logos para componentes** | logo-vertical.svg | Quando precisar usar `<img src={...}>` em React em vez de SVG inline |

## Como usar

```tsx
import logoSrc from '@/assets/brand/logo-vertical.svg';

<img src={logoSrc} alt="Fit Insight" className="h-10" />
```

Para SVG como componente (inline), prefira manter no código (ex.: `IconPulse` em `components/icons`) ou use `?react` no Vite se quiser importar SVG como componente.

## Onde NÃO colocar

- Favicon, og:image, ícones do manifest → use `frontend/public/brand/`.
