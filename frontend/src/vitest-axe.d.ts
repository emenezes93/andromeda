/// <reference types="vitest/globals" />

declare module 'vitest' {
  interface Assertion<_T = any> {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

declare global {
  namespace Vi {
    interface Assertion<_T = any> {
      toHaveNoViolations(): void;
    }
    interface AsymmetricMatchersContaining {
      toHaveNoViolations(): void;
    }
  }
}

export {};
