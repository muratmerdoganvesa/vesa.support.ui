// src/utils/configuration.ts
import { axiosInstance } from "utils/axiosInstance";
import { Configuration } from "./api/generated";
import { apiUrl, resolveApiBaseUrl } from "config/apiBase";

export const getAccessToken = (): string | null => {
    return localStorage.getItem("accessToken");
};

const handleUnauthorizedOrBlocked = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {

        // Eğer token yoksa giriş sayfasına yönlendirin
        window.location.href = "/authentication/sign-in/cover";
        return;
    }

    // Token doğrulama işlemi veya kullanıcı blok kontrolü
    fetch(apiUrl('/api/User/validatetokenAndUser'), {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    }).then(response => {
        if (response.status === 401 || response.status === 403) {

            // Eğer yetkisiz ya da kullanıcı blokeli, giriş sayfasına yönlendir
            localStorage.removeItem("accessToken");

            window.location.href = "/authentication/sign-in/cover";

        }
    }).catch(error => {
        console.error("Token doğrulama sırasında hata oluştu:", error);
        window.location.href = "/authentication/sign-in/cover"; // Hata durumunda da yönlendirme yapılabilir
    });
};

const getConfiguration = () => {
    // handleUnauthorizedOrBlocked(); // Token kontrolünü burada çağır

    const accessToken = getAccessToken();
    return new Configuration({
        basePath: resolveApiBaseUrl(),
        accessToken: accessToken || "",
        baseOptions: {
            axios: axiosInstance
        }
    });
};


export const getConfigurationLogin = () => {

    const accessToken = getAccessToken();
    return new Configuration({
        basePath: resolveApiBaseUrl(),
        accessToken: ""
    });
};
export const getConfigurationAccessTokenLogin = () => {

    const accessToken = getAccessToken();
    return new Configuration({
        basePath: resolveApiBaseUrl(),
        accessToken: accessToken,
        baseOptions: {
            axios: axiosInstance
        }
    });
};


export default getConfiguration;
