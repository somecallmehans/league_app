import { jwtDecode } from "jwt-decode";

export const getTokenRaw = () => localStorage.getItem("access_token");

const auth = {
  setToken: (access?: string, refresh?: string): void => {
    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    }
  },

  getToken: () => {
    const token = getTokenRaw();
    if (!token) {
      return null;
    }
    return jwtDecode(token);
  },
  getRefreshToken: (): string | undefined =>
    localStorage.getItem("refresh_token") || undefined,
  removeToken: (): void => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

export default auth;
