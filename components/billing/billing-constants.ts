export const BILLING_MODES = [
  { value: "quick", label: "Quick", icon: "⚡" },
  { value: "takeaway", label: "Takeaway", icon: "🛍️" },
  { value: "dine_in", label: "Dine-in", icon: "🪑" },
  { value: "parcel", label: "Parcel", icon: "📦" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "upi", label: "UPI", icon: "📱" },
  { value: "card", label: "Card", icon: "💳" },
  { value: "wallet", label: "Wallet", icon: "👛" },
  { value: "split", label: "Split", icon: "✂️" },
  { value: "credit", label: "Khata", icon: "📒" },
] as const;
