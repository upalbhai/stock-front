import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LineItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  taxRate: number;
};

type PaymentState = {
  cash: number;
  online: number;
  card: number;
};

type BillingState = {
  items: LineItem[];
  taxRate: number;
  payment: PaymentState;
};

const initialState: BillingState = {
  items: [],
  taxRate: 0.05,
  payment: {
    cash: 0,
    online: 0,
    card: 0
  }
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<LineItem, "qty">>) => {
      const existing = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existing) {
        existing.qty += 1;
      } else {
        state.items.push({ ...action.payload, qty: 1 });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateQty: (
      state,
      action: PayloadAction<{ id: string; qty: number }>
    ) => {
      const item = state.items.find((entry) => entry.id === action.payload.id);
      if (item) {
        item.qty = Math.max(0, action.payload.qty);
        if (item.qty === 0) {
          state.items = state.items.filter((entry) => entry.id !== item.id);
        }
      }
    },
    setPayment: (
      state,
      action: PayloadAction<{ field: keyof PaymentState; value: number }>
    ) => {
      state.payment[action.payload.field] = Math.max(
        0,
        action.payload.value
      );
    },
    setTaxRate: (state, action: PayloadAction<number>) => {
      state.taxRate = Math.max(0, action.payload);
    },
    clearBill: (state) => {
      state.items = [];
      state.payment = { cash: 0, online: 0, card: 0 };
    }
  }
});

export const { addItem, removeItem, updateQty, setPayment, setTaxRate, clearBill } =
  billingSlice.actions;

export default billingSlice.reducer;
