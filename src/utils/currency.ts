
import { Currency } from '../types';

export const EXCHANGE_RATES: Record<Currency, number> = {
    [Currency.KES]: 1, // Base currency
    [Currency.UGX]: 28.5,
    [Currency.TZS]: 19.8,
    [Currency.RWF]: 9.8,
    [Currency.BIF]: 21.5,
    [Currency.USD]: 0.0076,
    [Currency.ZMW]: 0.20, // 1 KES ~= 0.20 ZMW (approx)
    [Currency.ETB]: 0.95, // 1 KES ~= 0.95 ETB (approx)
    [Currency.SDG]: 4.60, // 1 KES ~= 4.60 SDG (approx, varies widely)
    [Currency.SSP]: 10.50 // 1 KES ~= 10.50 SSP (approx)
};

export const formatCurrency = (amount: number, currency: Currency = Currency.KES): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const convertAmount = (amountInKes: number, targetCurrency: Currency): number => {
    if (targetCurrency === Currency.KES) return amountInKes;
    return amountInKes * (EXCHANGE_RATES[targetCurrency] || 1);
};
