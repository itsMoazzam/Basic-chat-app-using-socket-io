import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (name: string, email: string, password: string) =>
    api.post("/auth/register", { name, email, password }).then((r) => r.data),
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const chatAPI = {
  getChats: () => api.get("/chats").then((r) => r.data),
  getOrCreateChat: (participantId: string) =>
    api.post("/chats", { participantId }).then((r) => r.data),
  getMessages: (chatId: string) =>
    api.get(`/chats/${chatId}/messages`).then((r) => r.data),
};

export const userAPI = {
  list: () => api.get("/users").then((r) => r.data),
};

export default api;
