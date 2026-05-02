import { describe, it, expect } from 'vitest';

// Пример вспомогательной функции
//тест для parseAmount (который используется в GrantCatalog)
function parseAmount(amountStr: string): number {
  const match = amountStr.match(/(\d+(?:\s\d+)*)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/\s/g, ''));
}

describe('parseAmount', () => {
  it('parses amount with spaces', () => {
    expect(parseAmount('2 000 000 ₽')).toBe(2000000);
  });
  it('returns 0 for invalid', () => {
    expect(parseAmount('no number')).toBe(0);
  });
});