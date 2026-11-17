import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LineItem = {
  cartLineId: string;
  id: string;
  name: string;
  price: number;
  qty: number;
  taxRate: number;
  sku?: string;
  unit?: string;
  soldUnit?: string;
  soldQty?: number;
  baseQty?: number;
  conversionFactor?: number;
  packagingUnitId?: string;
  priceOverride?: boolean;
  image?: string;
  categoryId?: string;
  notes?: string;
  onHandQty?: number;
};

type PaymentState = {
  cash: number;
  upi: number;
  card: number;
  wallet: number;
};

type BillingMode = "takeaway" | "dine_in" | "parcel" | "quick" | "wholesale";
type SaleMode = "retail" | "wholesale";
type TaxMode = "exclusive" | "inclusive";

type BillingState = {
  items: LineItem[];
  discount: number;
  notes: string;
  customerName: string;
  customerPhone: string;
  customerId: string | null;
  creditSale: boolean;
  amountReceived: number;
  billingMode: BillingMode;
  saleMode: SaleMode;
  taxMode: TaxMode;
  payment: PaymentState;
  paymentMethod: "cash" | "upi" | "card" | "wallet" | "split" | "credit";
  taxEnabled: boolean;
  taxRate: number;
  generateGstInvoice: boolean;
};

const initialState: BillingState = {
  items: [],
  discount: 0,
  notes: "",
  customerName: "",
  customerPhone: "",
  customerId: null,
  creditSale: false,
  amountReceived: 0,
  billingMode: "quick",
  saleMode: "retail",
  taxMode: "exclusive",
  payment: { cash: 0, upi: 0, card: 0, wallet: 0 },
  paymentMethod: "cash",
  taxEnabled: false,
  taxRate: 0,
  generateGstInvoice: false
};

function lineKey(productId: string, packagingUnitId?: string) {
  return packagingUnitId ? `${productId}:${packagingUnitId}` : productId;
}

function cartLineId(productId: string, packagingUnitId: string | undefined, price: number) {
  return `${lineKey(productId, packagingUnitId)}@${price}`;
}

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    setSaleMode: (state, action: PayloadAction<SaleMode>) => {
      if (state.saleMode === action.payload) return;
      state.saleMode = action.payload;
      state.billingMode =
        action.payload === "wholesale"
          ? "wholesale"
          : state.billingMode === "wholesale"
            ? "quick"
            : state.billingMode;
      state.items = [];
    },
    setTaxMode: (state, action: PayloadAction<TaxMode>) => {
      state.taxMode = action.payload;
    },
    addItem: (state, action: PayloadAction<Omit<LineItem, "qty" | "cartLineId"> & { qty?: number }>) => {
      const price = action.payload.price;
      const key = lineKey(action.payload.id, action.payload.packagingUnitId);
      const lineId = cartLineId(action.payload.id, action.payload.packagingUnitId, price);
      const existing = state.items.find((item) => item.cartLineId === lineId);
      const qty = action.payload.qty ?? 1;
      const conversionFactor = action.payload.conversionFactor ?? 1;
      const onHandQty = action.payload.onHandQty;

      if (existing) {
        const currentBase = existing.baseQty ?? existing.qty;
        const addBase = qty * (existing.conversionFactor ?? 1);
        if (existing.onHandQty !== undefined && currentBase + addBase > existing.onHandQty) {
          return;
        }
        existing.qty += qty;
        existing.soldQty = (existing.soldQty ?? existing.qty) + qty;
        existing.baseQty = currentBase + addBase;
      } else {
        const soldQty = action.payload.soldQty ?? qty;
        const baseQty = action.payload.baseQty ?? soldQty * conversionFactor;
        if (onHandQty !== undefined && baseQty > onHandQty) {
          return;
        }
        state.items.push({
          ...action.payload,
          cartLineId: lineId,
          qty: soldQty,
          soldQty,
          baseQty,
          conversionFactor
        });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.cartLineId !== action.payload);
    },
    updateQty: (state, action: PayloadAction<{ cartLineId: string; qty: number }>) => {
      const item = state.items.find((e) => e.cartLineId === action.payload.cartLineId);
      if (item) {
        let qty = Math.max(0, action.payload.qty);
        const conversion = item.conversionFactor ?? 1;
        if (item.onHandQty !== undefined && qty * conversion > item.onHandQty) {
          qty = Math.floor(item.onHandQty / conversion);
        }
        item.qty = qty;
        item.soldQty = qty;
        item.baseQty = qty * conversion;
        if (qty === 0) {
          state.items = state.items.filter((e) => e.cartLineId !== item.cartLineId);
        }
      }
    },
    updateLinePrice: (state, action: PayloadAction<{ cartLineId: string; price: number }>) => {
      const item = state.items.find((e) => e.cartLineId === action.payload.cartLineId);
      if (item) {
        const newPrice = Math.max(0, action.payload.price);
        item.price = newPrice;
        item.priceOverride = true;
        item.cartLineId = cartLineId(item.id, item.packagingUnitId, newPrice);
      }
    },
    updateItemNotes: (state, action: PayloadAction<{ cartLineId: string; notes: string }>) => {
      const item = state.items.find((e) => e.cartLineId === action.payload.cartLineId);
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
    selectCustomer: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        phone?: string;
        defaultTaxMode?: TaxMode;
      } | null>
    ) => {
      if (!action.payload) {
        state.customerId = null;
        state.customerName = "";
        state.customerPhone = "";
        return;
      }
      state.customerId = action.payload.id;
      state.customerName = action.payload.name;
      state.customerPhone = action.payload.phone || "";
      if (action.payload.defaultTaxMode) {
        state.taxMode = action.payload.defaultTaxMode;
      }
    },
    setCreditSale: (state, action: PayloadAction<boolean>) => {
      state.creditSale = action.payload;
      if (action.payload) {
        state.paymentMethod = "credit";
      } else {
        state.amountReceived = 0;
        if (state.paymentMethod === "credit") state.paymentMethod = "cash";
      }
    },
    setAmountReceived: (state, action: PayloadAction<number>) => {
      state.amountReceived = Math.max(0, action.payload);
    },
    setBillingMode: (state, action: PayloadAction<BillingMode>) => {
      state.billingMode = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<BillingState["paymentMethod"]>) => {
      state.paymentMethod = action.payload;
      state.payment = { cash: 0, upi: 0, card: 0, wallet: 0 };
      if (action.payload === "credit") {
        state.creditSale = true;
      } else {
        state.creditSale = false;
        state.amountReceived = 0;
      }
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
    setGenerateGstInvoice: (state, action: PayloadAction<boolean>) => {
      state.generateGstInvoice = action.payload;
    },
    clearBill: (state) => {
      const preserved = {
        saleMode: state.saleMode,
        taxMode: state.taxMode,
        taxEnabled: state.taxEnabled,
        taxRate: state.taxRate,
        billingMode: state.billingMode
      };
      Object.assign(state, initialState, preserved);
    }
  }
});

export const {
  addItem,
  removeItem,
  updateQty,
  updateLinePrice,
  updateItemNotes,
  setDiscount,
  setNotes,
  setCustomer,
  selectCustomer,
  setCreditSale,
  setAmountReceived,
  setBillingMode,
  setSaleMode,
  setTaxMode,
  setPaymentMethod,
  setPaymentAmount,
  setTaxEnabled,
  setTaxRate,
  setGenerateGstInvoice,
  clearBill
} = billingSlice.actions;

export default billingSlice.reducer;
