// src/utils/axiosInstance.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import globalAxios from 'axios';

// localStorage'dan oku veya default değer kullan
const getLastValidationTime = (): number => {
    const stored = localStorage.getItem('lastTokenValidation');
    return stored ? parseInt(stored, 10) : 0;
};

const setLastValidationTime = (time: number): void => {
    localStorage.setItem('lastTokenValidation', time.toString());
};

let isTokenValid = true;
let validationPromise: Promise<boolean> | null = null;
const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 dakika

const validateTokenIfNeeded = async (token: string): Promise<boolean> => {
    const now = Date.now();
    const lastValidationTime = getLastValidationTime(); // ← localStorage'dan oku
    
    // 1. Cache kontrolü - Son 5 dakika içinde validation yapıldı mı?
    if (now - lastValidationTime < VALIDATION_INTERVAL) {
        // console.log('✅ Token validation CACHE\'den döndürüldü (API çağrısı YOK)');
        // console.log(`⏱️ Son validation: ${Math.floor((now - lastValidationTime) / 1000)} saniye önce`);
        return isTokenValid;
    }

    // 2. Devam eden validation var mı? Varsa onu bekle
    if (validationPromise) {
        // console.log('⏳ Başka bir validation devam ediyor, bekleniyor...');
        return validationPromise;
    }

    // 3. Yeni validation başlat
    // console.log('🔄 YENİ token validation yapılıyor (API çağrısı VAR)...');
    
    validationPromise = (async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_PATH}/api/User/validatetokenAndUser`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            isTokenValid = response.ok;
            setLastValidationTime(Date.now()); // ← localStorage'a yaz

            // console.log(`✅ Token validation tamamlandı. Sonuç: ${isTokenValid ? 'GEÇERLİ' : 'GEÇERSİZ'}`);

            if (!isTokenValid) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("lastTokenValidation"); // ← Temizle
                window.location.href = "/authentication/sign-in/cover";
            }

            return isTokenValid;
        } catch (error) {
            if (error instanceof TypeError) {
                // Network hatası (internet yok, server geçici kapalı vb.)
                // isTokenValid'i false YAPMA — mevcut token ile devam et.
                // Aksi hâlde F5 anında geçici ağ titremesi tüm API çağrılarını bloklar.
                // lastValidationTime'ı da güncelleme: bir sonraki istekte tekrar denensin.
            } else {
                // Gerçek 401/403 veya başka HTTP hatası → token geçersiz
                isTokenValid = false;
                localStorage.removeItem("accessToken");
                localStorage.removeItem("lastTokenValidation");
                window.location.href = "/authentication/sign-in/cover";
            }
            
            return isTokenValid; // network hatasında true (devam), auth hatasında false (block)
        } finally {
            validationPromise = null;
        }
    })();

    return validationPromise;
};

// GLOBAL AXIOS'A INTERCEPTOR EKLE
globalAxios.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        const token = localStorage.getItem("accessToken");

        if (!token) {
            console.log('❌ Token bulunamadı');
            
            // Public endpoint'ler
            const publicEndpoints = [
                '/api/Auth/CreateToken',
                '/api/User/CheckSSOEmailControl',
                '/api/ForgotPassword/forgot-password',
                '/api/ForgotPassword/verify-reset-code',
                '/api/ForgotPassword/change-pw'
            ];
            
            const isPublicEndpoint = publicEndpoints.some(endpoint => 
                config.url?.includes(endpoint)
            );
            
            if (!isPublicEndpoint) {
                // Zaten login sayfasındaysa redirect yapma
                const currentPath = window.location.pathname;
                const isLoginPage = currentPath.includes('/authentication/') || 
                                   currentPath.includes('/sign-in') ||
                                   currentPath.includes('/reset-password');
                
                if (!isLoginPage) {
                    // console.log('🔄 Login sayfasına yönlendiriliyor...');
                    localStorage.removeItem("lastTokenValidation");
                    window.location.href = "/authentication/sign-in/cover";
                } else {
                    // console.log('⚠️ Zaten login sayfasındasınız, request iptal ediliyor');
                }
                
                // Her durumda request'i reject et
                return Promise.reject({
                    message: 'Token bulunamadı',
                    config,
                });
            }
            
            return config; // Public endpoint için devam et
        }

        // Token varsa normal işlemler
        config.headers.Authorization = `Bearer ${token}`;
        
        if (!config.url?.includes('validatetokenAndUser')) {
            const isValid = await validateTokenIfNeeded(token);
            
            if (!isValid) {
                // console.log('❌ Request iptal edildi (token geçersiz)');
                
                // Zaten login sayfasındaysa redirect yapma
                const currentPath = window.location.pathname;
                const isLoginPage = currentPath.includes('/authentication/') || 
                                   currentPath.includes('/sign-in');
                
                if (!isLoginPage) {
                    window.location.href = "/authentication/sign-in/cover";
                }
                
                return Promise.reject({
                    message: 'Token geçersiz, lütfen tekrar giriş yapın',
                    config,
                });
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const redirectToLogin = (): void => {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('/authentication/') || currentPath.includes('/sign-in');
    if (!isLoginPage) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("lastTokenValidation");
        isTokenValid = false;
        window.location.href = "/authentication/sign-in/cover";
    }
};

// Custom instance'ı da export et
const createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: import.meta.env.VITE_BASE_PATH || '',
        timeout: 30000,
    });

    // Request interceptor — token ekle + proaktif validation
    instance.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                const publicEndpoints = [
                    '/api/Auth/CreateToken',
                    '/api/User/CheckSSOEmailControl',
                    '/api/ForgotPassword/forgot-password',
                    '/api/ForgotPassword/verify-reset-code',
                    '/api/ForgotPassword/change-pw',
                ];
                const isPublicEndpoint = publicEndpoints.some(ep => config.url?.includes(ep));

                if (!isPublicEndpoint) {
                    redirectToLogin();
                    return Promise.reject({ message: 'Token bulunamadı', config });
                }
                return config;
            }

            config.headers.Authorization = `Bearer ${token}`;

            if (!config.url?.includes('validatetokenAndUser')) {
                const isValid = await validateTokenIfNeeded(token);
                if (!isValid) {
                    redirectToLogin();
                    return Promise.reject({ message: 'Token geçersiz, lütfen tekrar giriş yapın', config });
                }
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor — sunucudan gelen 401'i yakala
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                redirectToLogin();
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

export const axiosInstance = createAxiosInstance();