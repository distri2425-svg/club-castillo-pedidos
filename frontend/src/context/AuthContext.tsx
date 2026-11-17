// src/context/AuthContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import api from "../services/api";
import { AuthState, User } from "../types";

interface AuthContextType extends AuthState {
    /**
     * Verdadero mientras se restablece la sesión a partir del token guardado.
     * Las rutas protegidas deben esperar a que termine: de lo contrario evalúan
     * la autenticación cuando todavía no se consultó al servidor y devuelven al
     * acceso a un usuario que sí tiene una sesión válida, que era lo que ocurría
     * al recargar la página o al abrir una dirección directa, como el enlace del
     * código QR.
     */
    isRestoringSession: boolean;
    /** Genera sesión de invitado (pide token guest al backend) */
    loginAsGuest: (restId?: string) => Promise<void>;
    /** Cierra sesión */
    logout: () => void;
    /** Vuelve a consultar /users/me para refrescar datos */
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

interface Props {
    children: ReactNode;
}

// ────────────────────────────────────────────────────────────────────────────────
// IMPLEMENTACIÓN
// ────────────────────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<Props> = ({ children }) => {
    /* --- estado global --- */
    const [auth, setAuth] = useState<AuthState>({
        user: null,
        isGuest: false,
        isAuthenticated: false,
        guestRestId: undefined,
    });

    // Solo hay sesión que restablecer si existe un token guardado; sin él la
    // aplicación puede resolver de inmediato y mostrar la pantalla pública.
    const [isRestoringSession, setIsRestoringSession] = useState<boolean>(
        () => !!localStorage.getItem("token")
    );

    /* --- helpers --- */
    const clearGuestArtifacts = () => {
        localStorage.removeItem("orderId");
        localStorage.removeItem("qrCode");
        localStorage.removeItem("customer_cart");
    };

    /* ------------------------------------------------------------------------ */
    /* REFRESH USER (token ⇒ /users/me)                                        */
    /* ------------------------------------------------------------------------ */
    const refreshUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const { data } = await api.get("/users/me");

            const restaurantIds: number[] =
                data.restauranteIds ?? data.restaurantIds ?? [];
            const restaurantId =
                data.restaurantId ?? data.restauranteId ?? restaurantIds[0] ?? undefined;

            const user: User = {
                id: data.id,
                name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
                email: data.email,
                role: data.role,
                restaurantId,
                restaurantIds,
                createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
                profileImageBase64: data.profileImageBase64 ?? "",
            };

            // Si el backend devuelve role ≠ INVITED cancelamos modo invitado
            const isGuest = user.role === "INVITED";

            // Los restos de la sesion de invitado solo se limpian cuando un
            // invitado pasa a identificarse con su cuenta. Antes se limpiaban en
            // cada restablecimiento de sesion, de modo que al recargar la pagina
            // el socio perdia su carrito y el pedido que estaba siguiendo.
            if (!isGuest && auth.isGuest) clearGuestArtifacts();

            setAuth((prev) => ({
                ...prev,
                user,
                isGuest,
                isAuthenticated: true,
            }));
        } catch (err) {
            console.error("Error refreshing user:", err);
            localStorage.removeItem("token");
            clearGuestArtifacts();
            setAuth({
                user: null,
                isGuest: false,
                isAuthenticated: false,
                guestRestId: undefined,
            });
        }
    };

    /* Al montar, si existe token, refrescamos */
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setIsRestoringSession(false);
            return;
        }
        refreshUser().finally(() => setIsRestoringSession(false));
    }, []);

    /* ------------------------------------------------------------------------ */
    /* LOGIN COMO INVITADO                                                     */
    /* ------------------------------------------------------------------------ */
    const loginAsGuest = async (restId?: string) => {
        try {
            const { data } = await api.post("/auth/guest-login");
            localStorage.setItem("token", data.token);

            await refreshUser(); // ahora user.role = INVITED

            setAuth((prev) => ({
                ...prev,
                isGuest: true,
                isAuthenticated: true,
                guestRestId: restId,
            }));
        } catch (err) {
            console.error("Error login invited:", err);
        }
    };

    /* ------------------------------------------------------------------------ */
    /* LOGOUT                                                                  */
    /* ------------------------------------------------------------------------ */
    const logout = () => {
        localStorage.removeItem("token");
        clearGuestArtifacts();
        setAuth({
            user: null,
            isGuest: false,
            isAuthenticated: false,
            guestRestId: undefined,
        });
    };

    /* ------------------------------------------------------------------------ */
    /* CONTEXTO                                                                 */
    /* ------------------------------------------------------------------------ */
    const value: AuthContextType = {
        ...auth,
        isRestoringSession,
        loginAsGuest,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
