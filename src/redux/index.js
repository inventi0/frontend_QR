import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApi } from "../api/authApi";
import { reviewApi } from "../api/reviewApi";
import { accountApi } from "../api/accountApi";
import { productApi } from "../api/productApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [accountApi.reducerPath]: accountApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      reviewApi.middleware,
      accountApi.middleware,
      productApi.middleware
    ),
});

setupListeners(store.dispatch);
