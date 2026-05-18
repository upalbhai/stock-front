import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LineItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  taxRate: number;
  sku?: string;
  unit?: string;
  image?: string;
  categoryId?: string;
  notes?: string;
};

type PaymentState = {
  cash: number;
  upi: number;
  card: number;
  wallet: number;
};

type BillingMode = "takeaway" | "dine_in" | "parcel" | "quick";

type BillingState = {
  items: LineItem[];
  discount: number;
  notes: string;
  customerName: string;
  customerPhone: string;
  billingMode: BillingMode;
  payment: PaymentState;
  paymentMethod: "cash" | "upi" | "card" | "wallet" | "split";
  taxEnabled: boolean;
  taxRate: number;
};

const initialState: BillingState = {
  items: [],
  discount: 0,
  notes: "",
  customerName: "",
  customerPhone: "",
  billingMode: "quick",
  payment: { cash: 0, upi: 0, card: 0, wallet: 0 },
  paymentMethod: "cash",
  taxEnabled: false,
  taxRate: 0
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<LineItem, "qty">>) => {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        existing.qty += 1;
      } else {
        state.items.push({ ...action.payload, qty: 1 });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateQty: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const item = state.items.find((e) => e.id === action.payload.id);
      if (item) {
        item.qty = Math.max(0, action.payload.qty);
        if (item.qty === 0) {
          state.items = state.items.filter((e) => e.id !== item.id);
        }
      }
    },
    updateItemNotes: (state, action: PayloadAction<{ id: string; notes: string }>) => {
      const item = state.items.find((e) => e.id === action.payload.id);
      if (item) item.notes = action.payload.notes;
    },
    setDiscount: (state, action: PayloadAction<number>) => {
      state.discount = Math.max(0, action.payload);
    },
    setNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload;
    },
    setCustomer: (state, action: PayloadAction<{ name?: string; phone?: string }>) => {
      if (action.payload.name !== undefined) state.customerName = action.payload.name;
      if (action.payload.phone !== undefined) state.customerPhone = action.payload.phone;
    },
    setBillingMode: (state, action: PayloadAction<BillingMode>) => {
      state.billingMode = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<BillingState["paymentMethod"]>) => {
      state.paymentMethod = action.payload;
      // Reset split amounts when switching method
      state.payment = { cash: 0, upi: 0, card: 0, wallet: 0 };
    },
    setPaymentAmount: (state, action: PayloadAction<{ field: keyof PaymentState; value: number }>) => {
      state.payment[action.payload.field] = Math.max(0, action.payload.value);
    },
    setTaxEnabled: (state, action: PayloadAction<boolean>) => {
      state.taxEnabled = action.payload;
    },
    setTaxRate: (state, action: PayloadAction<number>) => {
      state.taxRate = Math.max(0, action.payload);
    },
    clearBill: () => initialState
  }
});

export const {
  addItem, removeItem, updateQty, updateItemNotes,
  setDiscount, setNotes, setCustomer, setBillingMode,
  setPaymentMethod, setPaymentAmount, setTaxEnabled, setTaxRate, clearBill
} = billingSlice.actions;

export default billingSlice.reducer;
