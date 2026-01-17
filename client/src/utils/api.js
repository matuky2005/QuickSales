const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const apiFetch = async (path, options = {}) => {
  const storedUser = localStorage.getItem("qs-user");
  let user = null;
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(user?._id ? { "x-user-id": user._id } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || "Error en la API";
    throw new Error(message);
  }

  return response.json();
};
