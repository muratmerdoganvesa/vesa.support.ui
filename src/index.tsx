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
import { bootstrapPlatformModule } from "platform/bootstrapPlatformModule";
import { loadApiConfig } from "config/apiConfig";


import { BusyProvider } from "layouts/pages/hooks/useBusy";
import { AlertProvider } from "layouts/pages/hooks/useAlert";
import { MsalProvider } from "@azure/msal-react";
import { UserProvider } from "layouts/pages/hooks/userName";
import { registerChunkPreloadErrorHandler } from "utils/chunkReload";
import { msalInstance } from "auth/msalApp";

registerChunkPreloadErrorHandler();

const isPlatformModule = isPlatformModuleMode();
bootstrapPlatformModule();

const root = createRoot(document.getElementById("root"));

import { QueryClient, QueryClientProvider } from 'react-query';
import { TooltipProvider } from "components/ui/tooltip";
import SessionExpiredModal from "components/auth/SessionExpiredModal";

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
                    <SessionExpiredModal />
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
