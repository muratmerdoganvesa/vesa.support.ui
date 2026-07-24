import React, { useEffect } from "react";
import { useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { clearAuthSession } from "utils/authSession";

const Logout: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        clearAuthSession();
        queryClient.clear();
        navigate("/authentication/sign-in/cover");
    }, [navigate, queryClient]);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                flexDirection: "column",
            }}
        >
            <h2>Çıkış Yapılıyor...</h2>
            <p>Lütfen bekleyin...</p>
        </div>
    );
};

export default Logout;
