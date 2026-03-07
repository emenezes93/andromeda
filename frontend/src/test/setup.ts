import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import 'vitest-axe/extend-expect';

// jsdom não implementa matchMedia — mock simples para hooks de tema
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => cleanup());
