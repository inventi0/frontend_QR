import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

// ✅ API URL из переменных окружения
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const accountApi = createApi({
  reducerPath: "accountApi",
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
  tagTypes: ["Qr", "Templates", "Orders"],
  endpoints: (builder) => ({
    getUserQr: builder.query({
      query: (userId) => `/qr/by-user/${userId}`,
      providesTags: ["Qr"],
    }),
    listUserTemplates: builder.query({
      query: ({ userId, includeGlobal = true, limit = 50, offset = 0 }) => ({
        url: `/templates/by-user/${userId}`,
        params: { include_global: includeGlobal, limit, offset },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({ type: "Templates", id: item.id })),
              { type: "Templates", id: "LIST" },
            ]
          : [{ type: "Templates", id: "LIST" }],
    }),
    setQrTemplate: builder.mutation({
      query: ({ template_id }) => ({
        url: "/qr/set-template",
        method: "PATCH",
        body: { template_id },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["Qr"],
    }),
    listOrders: builder.query({
      query: ({ email, limit = 20, offset = 0 } = {}) => {
        const params = { limit, offset };
        if (email) params.email = email;
        return {
          url: "/orders/",
          params,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({ type: "Orders", id: item.id })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
    }),
    listMyOrders: builder.query({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: "/orders/me",
        params: { limit, offset },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({ type: "Orders", id: item.id })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
    }),
    createOrder: builder.mutation({
      query: ({ items }) => ({
        url: "/orders",
        method: "POST",
        body: { items },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),
    createTemplate: builder.mutation({
      query: ({ file, name, description }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (name) formData.append("name", name);
        if (description) formData.append("description", description);
        return {
          url: "/templates",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: "Templates", id: "LIST" }],
    }),
    deleteTemplate: builder.mutation({
      query: (templateId) => ({
        url: `/templates/${templateId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Templates", id: "LIST" }],
    }),
  }),
});

export const {
  useGetUserQrQuery,
  useListUserTemplatesQuery,
  useSetQrTemplateMutation,
  useListOrdersQuery,
  useListMyOrdersQuery,
  useCreateOrderMutation,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
} = accountApi;
