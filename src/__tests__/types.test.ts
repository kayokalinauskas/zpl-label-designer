// ============================================================================
// Types Utility Functions Tests
// ============================================================================

import { mmToDots, dotsToMm, DENSITY_TO_DPI, DENSITY_MAP } from '@/types';

describe('mmToDots', () => {
  it('should convert mm to dots correctly at 8 dpmm', () => {
    expect(mmToDots(100, 8)).toBe(800);
  });

  it('should convert mm to dots correctly at 6 dpmm', () => {
    expect(mmToDots(100, 6)).toBe(600);
  });

  it('should convert mm to dots correctly at 12 dpmm', () => {
    expect(mmToDots(100, 12)).toBe(1200);
  });

  it('should convert mm to dots correctly at 24 dpmm', () => {
    expect(mmToDots(100, 24)).toBe(2400);
  });

  it('should round the result', () => {
    expect(mmToDots(10.5, 8)).toBe(84);
  });

  it('should handle zero', () => {
    expect(mmToDots(0, 8)).toBe(0);
  });

  it('should handle fractional results', () => {
    expect(mmToDots(1, 8)).toBe(8);
    expect(mmToDots(1.5, 8)).toBe(12);
  });
});

describe('dotsToMm', () => {
  it('should convert dots to mm correctly at 8 dpmm', () => {
    expect(dotsToMm(800, 8)).toBe(100);
  });

  it('should convert dots to mm correctly at 6 dpmm', () => {
    expect(dotsToMm(600, 6)).toBe(100);
  });

  it('should convert dots to mm correctly at 12 dpmm', () => {
    expect(dotsToMm(1200, 12)).toBe(100);
  });

  it('should convert dots to mm correctly at 24 dpmm', () => {
    expect(dotsToMm(2400, 24)).toBe(100);
  });

  it('should handle fractional results', () => {
    expect(dotsToMm(10, 8)).toBe(1.25);
  });

  it('should handle zero', () => {
    expect(dotsToMm(0, 8)).toBe(0);
  });
});

describe('mmToDots and dotsToMm inverse', () => {
  it('should be inverse operations (within rounding)', () => {
    const originalMm = 50;
    const density = 8;
    
    const dots = mmToDots(originalMm, density);
    const backToMm = dotsToMm(dots, density);
    
    expect(backToMm).toBe(originalMm);
  });

  it('should maintain precision for common label sizes', () => {
    const testCases = [
      { mm: 100, density: 8 },
      { mm: 50, density: 8 },
      { mm: 110, density: 8 },
      { mm: 30, density: 8 },
    ];

    testCases.forEach(({ mm, density }) => {
      const dots = mmToDots(mm, density);
      const backToMm = dotsToMm(dots, density);
      expect(backToMm).toBe(mm);
    });
  });
});

describe('DENSITY_TO_DPI', () => {
  it('should have correct DPI mappings', () => {
    expect(DENSITY_TO_DPI[6]).toBe(152);
    expect(DENSITY_TO_DPI[8]).toBe(203);
    expect(DENSITY_TO_DPI[12]).toBe(300);
    expect(DENSITY_TO_DPI[24]).toBe(600);
  });
});

describe('DENSITY_MAP (backwards compatibility)', () => {
  it('should be an alias for DENSITY_TO_DPI', () => {
    expect(DENSITY_MAP).toBe(DENSITY_TO_DPI);
  });

  it('should have the same values as DENSITY_TO_DPI', () => {
    expect(DENSITY_MAP[6]).toBe(DENSITY_TO_DPI[6]);
    expect(DENSITY_MAP[8]).toBe(DENSITY_TO_DPI[8]);
    expect(DENSITY_MAP[12]).toBe(DENSITY_TO_DPI[12]);
    expect(DENSITY_MAP[24]).toBe(DENSITY_TO_DPI[24]);
  });
});
