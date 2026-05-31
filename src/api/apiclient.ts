import axios from "axios";

const apiClient = axios.create({
    baseURL: "https://localhost:44363", // OpenAPI'de belirtilen API base URL
    withCredentials: true, // Çerez kullanıyorsan ekle
});

// 401 Hatalarını Yakala ve Yönlendir
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Yetkisiz giriş. Login sayfasına yönlendiriliyor...");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default apiClient;
