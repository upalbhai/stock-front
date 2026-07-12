import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/lib/types";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  outletId: string | null;
  businessId: string | null;
  impersonating: boolean;
  outlets: any[];
}

const initialState: AuthState = {
  user: null,
  token: null,
  outletId: null,
  businessId: null,
  impersonating: false,
  outlets: [],
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string; impersonating?: boolean }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.businessId = action.payload.user.businessId || null;
      state.outlets = action.payload.user.outlets || [];
      if (action.payload.impersonating !== undefined) {
        state.impersonating = action.payload.impersonating;
      } else {
        try {
          const payload = JSON.parse(atob(action.payload.token.split(".")[1]));
          state.impersonating = !!payload.impersonating;
        } catch {
          state.impersonating = false;
        }
      }
    },
    setOutlet: (state, action: PayloadAction<string | null>) => {
      state.outletId = action.payload;
    },
    setOutlets: (state, action: PayloadAction<any[]>) => {
      state.outlets = action.payload;
      if (state.user) {
        state.user.outlets = action.payload;
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.outletId = null;
      state.businessId = null;
      state.impersonating = false;
      state.outlets = [];
    },
    updateUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      if (action.payload.outlets) {
        state.outlets = action.payload.outlets;
      }
    }
  },
});

export const { setAuth, setOutlet, setOutlets, clearAuth, updateUser } = authSlice.actions;

export default authSlice.reducer;
