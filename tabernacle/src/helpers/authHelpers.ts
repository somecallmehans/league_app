import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  exp?: number;
  user_id?: number;
  is_superuser?: boolean;
  is_staff?: boolean;
  [key: string]: unknown;
};

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const getTokenRaw = () => localStorage.getItem(ACCESS_KEY);

const auth = {
  setToken: (access?: string, refresh?: string): void => {
    if (access && refresh) {
      localStorage.setItem(ACCESS_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
    }
  },

  isSuperuser: (): boolean => {
    const decoded = auth.getToken();
    return decoded?.is_superuser === true;
  },

  getToken: (): JwtPayload | null => {
    const token = getTokenRaw();
    if (!token) {
      return null;
    }
    return jwtDecode(token);
  },
  getRefreshToken: (): string | undefined =>
    localStorage.getItem(REFRESH_KEY) || undefined,

  removeToken: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export default auth;
