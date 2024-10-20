import { jwtDecode } from "jwt-decode";

export const getTokenRaw = () => localStorage.getItem("access_token");

const auth = {
  setToken: (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },

  getToken: () => {
    const token = getTokenRaw();
    if (!token) {
      return null;
    }
    return jwtDecode(token);
  },
  getRefreshToken: () => localStorage.getItem("refresh_token"),
  removeToken: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

export default auth;
