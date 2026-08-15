/**
 * Indian Number Formatting and Currency Utilities
 */

export function formatINR(amount: number, showDecimal = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const rounded = Math.round(amount);
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimal ? 2 : 0,
    minimumFractionDigits: showDecimal ? 2 : 0,
  }).format(rounded);
}

export function formatINRCompact(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    const inCr = (abs / 10000000).toFixed(2);
    return `${sign}₹${parseFloat(inCr)} Cr`;
  } else if (abs >= 100000) {
    // 1 Lakh = 100,000
    const inLakh = (abs / 100000).toFixed(2);
    return `${sign}₹${parseFloat(inLakh)} L`;
  } else if (abs >= 1000) {
    const inK = (abs / 1000).toFixed(1);
    return `${sign}₹${parseFloat(inK)}k`;
  }
  return `${sign}₹${Math.round(abs)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function sanitizeNumber(val: any, min = 0, max = Infinity): number {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return min;
  return Math.min(Math.max(min, num), max);
}
