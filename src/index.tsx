/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import "regenerator-runtime/runtime"
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import App from "App";
import "i18n";
import './index.css';
import {
  isPlatformModuleMode,
  PlatformHashRouter,
  PlatformProvider,
} from "platform";
import { loadApiConfig } from "config/apiConfig";


import { BusyProvider } from "layouts/pages/hooks/useBusy";
import { AlertProvider } from "layouts/pages/hooks/useAlert";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { UserProvider } from "layouts/pages/hooks/userName";
import { registerChunkPreloadErrorHandler } from "utils/chunkReload";

registerChunkPreloadErrorHandler();

const root = createRoot(document.getElementById("root"));

import { QueryClient, QueryClientProvider } from 'react-query';
import { TooltipProvider } from "components/ui/tooltip";
const isLocalhost = window.location.hostname === "localhost";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika fresh
      cacheTime: 1000 * 60 * 60, // 1 saat cache
      refetchOnWindowFocus: false, // Pencere focus olduğunda refetch yapma
      refetchOnMount: false, // Her mount'ta refetch yapma (ÖNEMLİ!)
      refetchOnReconnect: false, // İnternet bağlantısı geri geldiğinde refetch yapma
      retry: 1, // Hata durumunda tekrar deneme sayısı
    },
  },
});
const msalConfig = isLocalhost
  ? {
    auth: {
      clientId: "28116fc8-fd64-4ccb-ab4d-96d2f3653846", // Uygulama (istemci) kimliği
      authority: "https://login.microsoftonline.com/8b3326df-62dc-4c93-84c2-db8f6f28f4bb", // Kiracı ID'si (authority)
      redirectUri: "http://localhost:3000", // Azure portalda tanımlı geri dönüş URI'si
    },
  }
  : {
    auth: {
      clientId: "1a4e7070-9c88-4097-9805-caf72e245e79", // Uygulama (istemci) kimliği
      authority: "https://login.microsoftonline.com/8b3326df-62dc-4c93-84c2-db8f6f28f4bb", // Dizin (kiracı) kimliği
      redirectUri: "https://support.vesa-tech.com", // Azure portalda tanımlı SPA geri dönüş URI'si
    },
    cache: {
      cacheLocation: "localStorage", // Token'ları saklamak için kullanılacak yer (localStorage veya sessionStorage)
      storeAuthStateInCookie: true, // Çerez kullanımı (tarayıcı uyumluluğu için önerilir)
    },
  };



const msalInstance = new PublicClientApplication(msalConfig);
const isPlatformModule = isPlatformModuleMode();
const RouterComponent = isPlatformModule ? PlatformHashRouter : BrowserRouter;

void loadApiConfig().then(() => {
  root.render(
    <RouterComponent>
      <PlatformProvider>
        <BusyProvider>
          <AlertProvider>
            <UserProvider>
              <TooltipProvider>
                <MsalProvider instance={msalInstance}>
                  <QueryClientProvider client={queryClient}>
                    <App />
                  </QueryClientProvider>
                  <Suspense fallback={null} />
                </MsalProvider>
              </TooltipProvider>
            </UserProvider>
          </AlertProvider>
        </BusyProvider>
      </PlatformProvider>
    </RouterComponent>
  );
});
