/**
 * Format a numeric amount as Russian Rubles.
 *
 * Rules:
 * - null / undefined / NaN → "—"
 * - Integer amounts: "1 500 ₽" (no decimals)
 * - Fractional amounts: "1 500,50 ₽" (2 decimals, comma)
 * - Thousand separators use non-breaking space (Intl ru-RU default)
 *
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
export function formatRub(amount) {
    if (amount == null) return '—';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(num)) return '—';

    const isInteger = Number.isInteger(num);
    const formatted = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(num);

    return formatted;
}
