import { useAuthStore } from "../store/AuthStore";
import { handleDemoRequest } from "./demoBackend";

export async function refreshAccessToken() {
  const body = await handleDemoRequest("POST", "/auth/refresh", {});

  if (!body?.ok) {
    throw new Error(body?.error?.message || "Refresh failed");
  }

  const token = body?.data?.token;
  if (!token) throw new Error("Token missing in refresh response.");

  const store = useAuthStore.getState();
  store.setToken(token);

  if (body?.data?.admin) {
    store.setUser(body.data.admin);
  }

  return token;
}

async function request(method, url, data) {
  try {
    const responseBody = await handleDemoRequest(method, url, data);
    return { data: responseBody };
  } catch (error) {
    throw error;
  }
}

export const http = {
  get(url) {
    return request("GET", url);
  },
  post(url, data) {
    return request("POST", url, data);
  },
  put(url, data) {
    return request("PUT", url, data);
  },
};

export function getErrorMessage(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong"
  );
}
