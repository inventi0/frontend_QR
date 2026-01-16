import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

// ✅ API URL из переменных окружения
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const reviewApi = createApi({
  reducerPath: "reviewApi",
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
  tagTypes: ["Reviews"],
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: ({ skip = 0, limit = 100 } = {}) => ({
        url: "/reviews/",
        params: { skip, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Reviews", id })),
              { type: "Reviews", id: "LIST" },
            ]
          : [{ type: "Reviews", id: "LIST" }],
    }),
    createReview: builder.mutation({
      query: ({ stars, content }) => ({
        url: "/reviews/",
        method: "POST",
        body: { stars, content },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }, { type: "Reviews", id: "MY" }],
    }),
    getMyReview: builder.query({
      query: () => "/reviews/me",
      providesTags: [{ type: "Reviews", id: "MY" }],
    }),
    updateReview: builder.mutation({
      query: ({ reviewId, stars, content }) => ({
        url: `/reviews/${reviewId}`,
        method: "PATCH",
        body: { stars, content },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }, { type: "Reviews", id: "MY" }],
    }),
    deleteReview: builder.mutation({
      query: (reviewId) => ({
        url: `/reviews/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }, { type: "Reviews", id: "MY" }],
    }),
  }),
});

export const { 
  useGetReviewsQuery, 
  useCreateReviewMutation,
  useGetMyReviewQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation
} = reviewApi;
