import React, { useEffect, useState } from "react";
import {
    ShoppingCart,
    User,
    Package,
    Dot,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../customer/CartProvider";

const CustomerTopbar: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { cart } = useCart();
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

    /* ------------ pedido activo ------------- */
    const [hasActiveOrder, setHasActiveOrder] = useState(false);
    useEffect(() => {
        setHasActiveOrder(Boolean(localStorage.getItem("orderId")));
        const onStorage = () =>
            setHasActiveOrder(Boolean(localStorage.getItem("orderId")));
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    /* ------------ helpers ------------------- */
    const translateRole = (r: string) =>
        (
            {
                CUSTOMER: "Cliente",
                OWNER: "SuperAdmin",
                RESTAURANT_ADMIN: "Admin Restaurante",
                INVITED: "Invitado",
            } as any
        )[r] || r;

    const getProfileImageSrc = () => {
        const b64 = user?.profileImageBase64;
        return b64 && b64.length > 30 ? `data:image/jpeg;base64,${b64}` : null;
    };

    const restIdFromUrl = () => {
        const m = location.pathname.match(/\/customer\/restaurant\/(\d+)/);
        return m ? m[1] : "";
    };

    /* ------------ navigation ---------------- */
    const goHome = () => navigate("/customer/restaurants");
    const goCart = () => navigate("/customer/cart");
    const goProfile = () => {
        const restId = restIdFromUrl();
        navigate(`/customer/profile${restId ? `?restId=${restId}` : ""}`);
    };
    const goTracking = () => navigate("/customer/order/tracking");

    /* ------------ ui ------------------------ */
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#181818] border-b border-[#f89b01]/20 shadow-2xl h-16">
            <div className="flex items-center justify-between h-full px-4">
                {/* logo */}
                <button
                    onClick={goHome}
                    className="flex items-center gap-2 px-6 py-1 rounded-lg hover:bg-[#232323]/50 transition-colors group"
                >
                    <img
                        src="/escudo-castillo.png"
                        alt="Club Castillo de Amaguaña"
                        className="h-14 w-auto hidden sm:block"
                    />
                </button>

                {/* acciones derecha */}
                <div className="flex items-center gap-5">
                    {/* botón tracking */}
                    {hasActiveOrder && (
                        <button
                            onClick={goTracking}
                            title="Ver estado de mi pedido"
                            className="relative flex items-center group"
                        >
                            <Package className="h-7 w-7 text-[#f89b01]" />
                            <Dot className="absolute -top-0.5 -right-1 text-green-500 animate-pulse" />
                        </button>
                    )}

                    {/* carrito */}
                    <button
                        onClick={goCart}
                        aria-label="Ver carrito"
                        className="relative flex items-center group"
                    >
                        <ShoppingCart className="h-7 w-7 text-[#f89b01]" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 border-2 border-[#181818] animate-pulse">
                {cartCount}
              </span>
                        )}
                    </button>

                    {/* login / perfil */}
                    {!user ? (
                        <button
                            onClick={() => {
                                const restId = restIdFromUrl();
                                navigate(`/login${restId ? `?restId=${restId}` : ""}`);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f89b01] text-[#181818] font-bold shadow hover:bg-[#ffb933] transition"
                        >
                            <User className="w-6 h-6 mr-1" />
                            Iniciar sesión
                        </button>
                    ) : (
                        <div
                            onClick={goProfile}
                            title="Ir a perfil"
                            className="flex items-center gap-2 px-2 py-1 rounded-full bg-[#181818]/90 border border-[#f89b01]/30 shadow cursor-pointer hover:bg-[#181818]/95 transition"
                        >
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#f89b01] to-[#ffb933]" />
                                {getProfileImageSrc() ? (
                                    <img
                                        src={getProfileImageSrc()!}
                                        className="relative z-10 w-full h-full object-cover rounded-full border-2 border-white"
                                    />
                                ) : (
                                    <User className="relative z-10 w-7 h-7 text-gray-300 mx-auto my-auto" />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                <span className="font-bold text-[#ececec] text-sm leading-tight truncate">
                  {user?.name}
                </span>
                                <span className="inline-block px-2 py-0.5 rounded-full bg-[#f89b01]/15 text-[#f89b01] text-xs font-semibold tracking-wide shadow-inner">
                  {translateRole(user?.role ?? "CUSTOMER")}
                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default CustomerTopbar;
