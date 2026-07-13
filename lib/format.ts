export function formatCurrency(
  value: number,
  currency = "INR",
  locale = "en-IN"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(value);
  } catch (error) {
    // Fallback for custom symbols (e.g. '₹', 'Tk', 'AED')
    const formattedNumber = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(value);
    
    return `${currency} ${formattedNumber}`;
  }
}

export function formatNumber(value: number, locale = "en-IN"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(date: string | Date, locale = "en-IN"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale = "en-IN"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
