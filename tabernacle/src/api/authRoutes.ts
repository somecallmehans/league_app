import type { ApiBuilder } from "./baseApiTypes";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RefreshRequest {
  refresh: string;
}
export interface RefreshResponse {
  access: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export default (builder: ApiBuilder) => ({
  login: builder.mutation<LoginResponse, LoginRequest>({
    query: (credentials) => ({
      url: "api/token/",
      method: "POST",
      body: credentials,
    }),
  }),
  refresh: builder.mutation<RefreshResponse, RefreshRequest>({
    query: (token) => ({
      url: "api/token/refresh/",
      method: "POST",
      body: { refresh: token },
    }),
  }),
  changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
    query: (body) => ({
      url: "change_password/",
      method: "POST",
      body,
    }),
  }),
});
