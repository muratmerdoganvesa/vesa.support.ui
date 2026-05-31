import { Menu, RoleMenuApi } from "api/generated";
import getConfiguration from "confiuration";
import { useQuery } from "react-query";
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const PrivateRoute: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const LOGIN_ROUTE = "/authentication/sign-in/cover";
  
  // accessToken'ı reactive yapmak için state olarak tut
  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"));

  // accessToken değişimlerini izle
  useEffect(() => {
    const handleStorageChange = () => {
      setAccessToken(localStorage.getItem("accessToken"));
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("accessToken");
      if (currentToken !== accessToken) {
        setAccessToken(currentToken);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [accessToken]);

  const { data: permissions = [], isLoading, error } = useQuery(
    "roleMenuPermissions",
    async () => {
      console.log('🔄 Role Menu Permissions yükleniyor...');
      const conf = getConfiguration();
      const api = new RoleMenuApi(conf);
      const result = await api.apiRoleMenuGetAuthByUserGet();
      console.log('✅ Role Menu Permissions yüklendi!');
      return result.data;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 dakika fresh
      cacheTime: 1000 * 60 * 10, // 10 dakika cache
      refetchOnWindowFocus: false,
      refetchOnMount: false, // ← EKLENDİ
      refetchOnReconnect: false, // ← EKLENDİ
      enabled: !!accessToken, // accessToken state'ine bağlı (reactive)
    }
  );

  const normalizedPath = "/" + currentPath.split("/").slice(1, 2).join("/");
  const normalizeUrl = (url: string) => "/" + url.split("/").slice(1, 2).join("/");
  
  const hasAccess = permissions.some(
    (permission) => normalizeUrl(permission.href) === normalizedPath
  );

  if (!accessToken) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    const params = new URLSearchParams({ returnTo });

    return (
      <Navigate
        to={`${LOGIN_ROUTE}?${params.toString()}`}
        replace
        state={{ returnTo }}
      />
    );
  }

  if (isLoading) {
    return <div></div>; // Yüklenme mesajı
  }

  if (!hasAccess) {
    if (normalizedPath === "/tickets") {
      return <Outlet />
    }
    if (normalizedPath === "/documentation") {
      return <Outlet />
    }
    return <Navigate to="/NotAuthorization" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
