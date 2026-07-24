import { RoleMenuApi } from "api/generated";
import getConfiguration from "confiuration";
import { useQuery } from "react-query";
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePlatform } from "platform";
import { isReAuthOpen, subscribeReAuth } from "utils/reAuthGate";

const PrivateRoute: React.FC = () => {
  const location = useLocation();
  const { isModule } = usePlatform();
  const currentPath = location.pathname;
  const LOGIN_ROUTE = "/authentication/sign-in/cover";

  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"));
  const [reAuthOpen, setReAuthOpen] = useState(isReAuthOpen());

  useEffect(() => subscribeReAuth(setReAuthOpen), []);

  useEffect(() => {
    const handleStorageChange = () => {
      setAccessToken(localStorage.getItem("accessToken"));
    };

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("accessToken");
      if (currentToken !== accessToken) {
        setAccessToken(currentToken);
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [accessToken]);

  const { data: permissions = [], isLoading } = useQuery(
    "roleMenuPermissions",
    async () => {
      const conf = getConfiguration();
      const api = new RoleMenuApi(conf);
      const result = await api.apiRoleMenuGetAuthByUserGet();
      return result.data;
    },
    {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled: !!accessToken && !reAuthOpen,
    }
  );

  const normalizedPath = "/" + currentPath.split("/").slice(1, 2).join("/");
  const normalizeUrl = (url: string) => "/" + url.split("/").slice(1, 2).join("/");

  const hasAccess = permissions.some(
    (permission) => normalizeUrl(permission.href) === normalizedPath
  );

  if (!accessToken && !reAuthOpen) {
    if (isModule) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Oturum hazırlanıyor…
        </div>
      );
    }

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

  if (isLoading && !reAuthOpen) {
    return <div></div>;
  }

  if (!hasAccess && !reAuthOpen) {
    if (normalizedPath === "/tickets" || normalizedPath === "/solveAllTicket") {
      return <Outlet />;
    }
    if (isModule) {
      return <Outlet />;
    }
    if (normalizedPath === "/documentation") {
      return <Outlet />;
    }
    return <Navigate to="/NotAuthorization" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
