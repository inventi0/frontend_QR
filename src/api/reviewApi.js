import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

const BASE_URL = "http://79.143.30.97";

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
      invalidatesTags: [{ type: "Reviews", id: "LIST" }],
    }),
  }),
});

export const { useGetReviewsQuery, useCreateReviewMutation } = reviewApi;
