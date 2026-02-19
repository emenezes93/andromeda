import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import 'vitest-axe/extend-expect';
import '../vitest-axe';

afterEach(() => cleanup());
