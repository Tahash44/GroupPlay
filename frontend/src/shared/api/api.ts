import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "fa",
  },
});


api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});


api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        // اگر access token منقضی شده بود
        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refresh_token");

            if (refreshToken) {
                try {
                    const response = await axios.post(
                        `${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh/`,
                        {
                            refresh_token: refreshToken,
                        }
                    );

                    const newAccessToken = response.data.access_token;

                    localStorage.setItem(
                        "access_token",
                        newAccessToken
                    );

                    originalRequest.headers.Authorization =
                        `Bearer ${newAccessToken}`;

                    return api(originalRequest);

                } catch (refreshError) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");

                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);


export default api;