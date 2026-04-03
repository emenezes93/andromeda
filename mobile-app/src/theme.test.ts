import { colors, spacing, radius, typography, touchTargetMin, inputHeight, buttonHeight } from './theme';

describe('theme', () => {
  it('exports colors with required keys', () => {
    expect(colors.background).toBeDefined();
    expect(colors.primary).toBeDefined();
    expect(colors.text).toBeDefined();
    expect(colors.error).toBeDefined();
  });

  it('exports semantic color tokens', () => {
    expect(colors.semantic.bg.canvas).toBeDefined();
    expect(colors.semantic.text.primary).toBeDefined();
    expect(colors.semantic.border.default).toBeDefined();
    expect(colors.semantic.brand.primary).toBeDefined();
    expect(colors.semantic.feedback.success).toBeDefined();
    expect(colors.semantic.interactive.primary).toBeDefined();
  });

  it('exports spacing with positive values', () => {
    expect(spacing.xl).toBeGreaterThan(0);
    expect(spacing.listBottom).toBe(40);
  });

  it('exports touchTargetMin >= 44', () => {
    expect(touchTargetMin).toBeGreaterThanOrEqual(44);
  });

  it('exports inputHeight and buttonHeight', () => {
    expect(inputHeight).toBe(48);
    expect(buttonHeight).toBe(52);
  });

  it('exports typography with lineHeight', () => {
    expect(typography.display.lineHeight).toBe(40);
    expect(typography.title.lineHeight).toBe(32);
    expect(typography.body.lineHeight).toBe(24);
  });

  it('exports radius values', () => {
    expect(radius.md).toBe(14);
  });
});
