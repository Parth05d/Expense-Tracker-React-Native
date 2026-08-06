import { CurrencyConfig } from '../types';

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'prefix', decimalPlaces: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', position: 'prefix', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', position: 'prefix', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', position: 'prefix', decimalPlaces: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'prefix', decimalPlaces: 0 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', position: 'prefix', decimalPlaces: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'prefix', decimalPlaces: 2 },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', position: 'prefix', decimalPlaces: 2 },
};

export function formatCurrency(
  amount: number,
  currencyCode: string = 'INR',
  options?: { hideDecimals?: boolean; compact?: boolean }
): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS['INR'];
  
  if (options?.compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 100000 && currencyCode === 'INR') {
      const lakhs = (amount / 100000).toFixed(1);
      return `${config.symbol}${lakhs}L`;
    }
    const k = (amount / 1000).toFixed(1);
    return `${config.symbol}${k}k`;
  }

  const decimals = options?.hideDecimals ? 0 : config.decimalPlaces;
  
  // Format with commas based on locale
  const formattedNumber = amount.toLocaleString(
    currencyCode === 'INR' ? 'en-IN' : 'en-US',
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  );

  return config.position === 'prefix'
    ? `${config.symbol}${formattedNumber}`
    : `${formattedNumber} ${config.symbol}`;
}
