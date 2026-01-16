import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

// ✅ API URL из переменных окружения
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const authApi = createApi({
  reducerPath: "authApi",
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
    register: builder.mutation({
      query: ({ email, username, password, avatar }) => {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("username", username);
        formData.append("password", password);
        if (avatar) {
          formData.append("avatar", avatar);
        }

        return {
          url: "/auth/register",
          method: "POST",
          body: formData,
        };
      },
    }),

    login: builder.mutation({
      query: ({ username, password }) => ({
        url: "/auth/jwt/login",
        method: "POST",
        body: new URLSearchParams({
          grant_type: "password",
          username,
          password,
          scope: "",
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    }),

    getMe: builder.query({
      query: () => ({ url: "/users/me", method: "GET" }),
      providesTags: ["Me"],
    }),
    updateUser: builder.mutation({
      query: (formData) => ({
        url: "/users/me/avatar",
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Me"],
    }),
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: "/users/me",
        method: "PATCH",
        body: data,
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["Me"],
    }),
    setActiveTemplate: builder.mutation({
      query: ({ templateId, baseUrl }) => ({
        url: "/users/me/active-template",
        method: "PATCH",
        body: {
          template_id: templateId,
          base_url: baseUrl || window.location.origin,
        },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["Me", "Templates"],
    }),
    getPublicProfile: builder.query({
      query: (userId) => ({
        url: `/users/${userId}/profile`,
        method: "GET",
      }),
      providesTags: (result, error, userId) => [{ type: "Profile", id: userId }],
    }),
    logout: builder.mutation({
      query: () => ({ url: "/auth/jwt/logout", method: "POST" }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useUpdateUserMutation,
  useUpdateUserProfileMutation,
  useSetActiveTemplateMutation,
  useGetPublicProfileQuery,
  useLogoutMutation,
} = authApi;
