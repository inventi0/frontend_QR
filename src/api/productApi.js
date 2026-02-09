import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:80";

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const session = getSession();
      if (session?.accessToken) {
        headers.set("Authorization", `Bearer ${session.accessToken}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Получить список продуктов
    listProducts: builder.query({
      query: ({ type, size, color, limit = 50, offset = 0 } = {}) => {
        const params = new URLSearchParams();
        if (type) params.append("type", type);
        if (size) params.append("size", size);
        if (color) params.append("color", color);
        params.append("limit", limit);
        params.append("offset", offset);
        return `/products/?${params.toString()}`;
      },
    }),
    // Получить продукт по ID
    getProduct: builder.query({
      query: (productId) => `/products/${productId}`,
    }),
  }),
});

export const { useListProductsQuery, useGetProductQuery } = productApi;
