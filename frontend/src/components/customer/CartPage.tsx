import React, { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ChefHat,
    ShoppingCart,
    Trash2,
    ChevronLeft,
    CheckCircle,
    CupSoda,
    XCircle,
    AlertCircle,
} from "lucide-react";
import QRScannerModal from "../common/QRScannerModal";

const API_URL = "";

/* ────────────────────────────────────────────────────────────────────────── */
const CartPage: React.FC = () => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user, isGuest } = useAuth();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [searchParams] = useSearchParams();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrError, setQrError] = useState<string | null>(null);

    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);

    const [countdown, setCountdown] = useState(10);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const firstCartItemWithRest = cart.find((i) => (i as any).restaurantId);
    const cartRestaurantId: number | null = firstCartItemWithRest
        ? (firstCartItemWithRest as any).restaurantId
        : null;
    const [sessionInitialized, setSessionInitialized] = useState(false);

    const total = cart.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    /* ─────────────── Marca la primera carga de la página ─────────────────────────── */
    // Antes se borraba aqui el qrCode guardado, y el invitado que llegaba al carrito
    // por el icono de la barra perdia el QR con el que habia entrado: sin camara no
    // podia confirmar. Ahora el QR guardado se conserva y se valida (efecto siguiente).
    useEffect(() => {
        if (!sessionInitialized) setSessionInitialized(true);
    }, [sessionInitialized]);

    /* ─────────────── Sincroniza qrCode de la URL / localStorage ───────────────────── */
    useEffect(() => {
        if (!sessionInitialized) return;

        const fromUrl = searchParams.get("qrCode");

        if (fromUrl) {
            localStorage.setItem("qrCode", fromUrl);
            setQrCode(fromUrl);
        } else if (isGuest) {
            // QR con el que el invitado abrio la carta: se acepta solo si es el
            // QR vigente del restaurante del carrito, igual que uno escaneado.
            const saved = localStorage.getItem("qrCode");
            if (saved && cart.length > 0) {
                handleScanQr(saved);
            } else {
                setQrCode(null);
            }
        } else {
            const saved = localStorage.getItem("qrCode");
            if (saved) setQrCode(saved);
        }
    }, [searchParams, isGuest, sessionInitialized]);

    /* ─────────────── Control del countdown (Confirmar pedido) ─────────────────────── */
    useEffect(() => {
        let t: NodeJS.Timeout;
        const canStart = isGuest ? qrCode !== null : true;

        if (isConfirming && countdown > 0 && canStart) {
            t = setTimeout(() => setCountdown((c) => c - 1), 1_000);
        } else if (isConfirming && countdown === 0 && canStart) {
            handleFinalConfirm();
        }
        return () => clearTimeout(t);
    }, [countdown, isConfirming, qrCode, isGuest]);

    /* ─────────────── Función para abrir el modal de confirmación ─────────────────── */
    const confirmarPedido = () => {
        setShowConfirmPopup(true);
        setCountdown(10);
        setIsConfirming(isGuest ? qrCode !== null : true);
    };

    const handleCancel = () => {
        setShowConfirmPopup(false);
        setIsProcessing(false);
        setIsConfirming(false);
        setCountdown(10);
        setQrError(null);
    };

    /* ─────────────────── Escaneo y validación de QR (backend) ─────────────────────── */
    const handleScanQr = async (rawCode: string) => {
        // 1. Extraer el código puro
        let scanned = rawCode;
        try {
            const url = new URL(rawCode);
            scanned = url.searchParams.get("qrCode") || rawCode;
        } catch {
            /* rawCode no era URL */
        }

        // 2. Restaurante al que pertenece el carrito (de un plato o, si solo hay
        //    bebidas, de la bebida: todo producto guarda el restaurante donde se eligio)
        const firstFood = cart.find((i) => i.type === "food") ?? cart[0];
        const cartRestaurantId = (firstFood as any)?.restaurantId ?? null;

        if (!cartRestaurantId) {
            setQrError("No se pudo determinar el restaurante del pedido.");
            setShowQRScanner(false);
            return;
        }

        // 3. Consultar al backend el QR registrado para ese restaurante
        try {
            const res = await fetch(
                `${API_URL}/qr-codes/restaurant/${cartRestaurantId}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            if (!res.ok) throw new Error("QR no encontrado en el servidor.");
            const { code: backendCode } = await res.json();

            if ((backendCode ?? "").trim() !== scanned.trim()) {
                // Código no coincide
                setQrError(
                    "El QR escaneado no pertenece a este restaurante. Escanea el código correcto."
                );
                setQrCode(null);
                localStorage.removeItem("qrCode");
            } else {
                // OK
                setQrError(null);
                setQrCode(scanned);
                localStorage.setItem("qrCode", scanned);
                if (showConfirmPopup && isGuest) {
                    setIsConfirming(true);
                    setCountdown(10);
                }
            }
        } catch (err) {
            setQrError("No se pudo validar el QR. Intenta de nuevo.");
            setQrCode(null);
            localStorage.removeItem("qrCode");
        } finally {
            setShowQRScanner(false);
        }
    };

    /* ─────────────────── POST /orders ─────────────────────────────────────────────── */
    const handleFinalConfirm = async () => {
        if (isGuest && !qrCode) {
            setShowQRScanner(true);
            setIsConfirming(false);
            return;
        }

        setIsProcessing(true);

        const items = cart
            .filter((i) => i.type === "food")
            .map(({ id, quantity }) => ({ menuItemId: id, quantity }));
        const beverages = cart
            .filter((i) => i.type === "beverage")
            .map(({ id, quantity }) => ({ beverageId: id, quantity }));

        const params: string[] = [];

        if (isGuest) {
            params.push(`qrCode=${qrCode}`);
        } else {
            // Si el pedido solo tiene bebidas, el restaurante se toma de ellas:
            // todo producto del carrito guarda el restaurante donde se eligio.
            const firstFood = cart.find((i) => i.type === "food") ?? cart[0];
            const restId = user?.restaurantId ?? (firstFood as any)?.restaurantId;
            if (!restId) {
                alert("No se encontró restaurante. Vuelve al menú.");
                setIsProcessing(false);
                return;
            }
            params.push(`restaurantId=${restId}`);
        }

        const endpoint = `${API_URL}/orders${params.length ? "?" + params.join("&") : ""
        }`;

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ items, beverages }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            localStorage.setItem("orderId", data.id);
            clearCart();
            if (isGuest) {
                localStorage.removeItem("qrCode");
                setQrCode(null);
            }
            navigate("/customer/order/tracking");
        } catch {
            alert("Error al confirmar el pedido");
            setIsProcessing(false);
            setShowConfirmPopup(false);
        }
    };

    /* ─────────────────── Carrito vacío ────────────────────────────────────────────── */
    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-600 px-4">
                <ShoppingCart className="w-16 h-16 mb-4 text-[#f89b01]" />
                <p className="text-xl mb-4 text-center">Tu carrito está vacío</p>
                <button
                    onClick={() => navigate("/customer/restaurants")}
                    className="px-6 py-3 rounded-lg bg-[#f89b01] text-white font-bold shadow hover:bg-[#181818] transition"
                >
                    Ver restaurantes
                </button>
            </div>
        );
    }

    /* ─────────────────── Render principal ─────────────────────────────────────────── */
    return (
        <div className="min-h-screen pb-16 bg-gray-50">
            <div className="max-w-2xl mx-auto pt-6 px-4">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                    <button
                        onClick={() => {
                            if (cartRestaurantId) {
                                const qrParam =
                                    isGuest && qrCode ? `?qrCode=${qrCode}` : "";
                                navigate(
                                    `/customer/restaurant/${cartRestaurantId}${qrParam}`
                                );
                            } else {
                                navigate("/customer/restaurants");
                            }
                        }}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#f89b01] bg-white text-[#f89b01] font-semibold shadow hover:bg-[#f89b01] hover:text-white transition"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Seguir pidiendo
                    </button>
                    <h1 className="text-2xl font-black text-[#181818] flex items-center gap-2 flex-1">
                        Tu pedido
                    </h1>
                    <button
                        onClick={clearCart}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                    >
                        <Trash2 className="h-4 w-4" /> Vaciar
                    </button>
                </div>

                {/* Lista de ítems */}
                <div className="space-y-4">
                    {cart.map((item) => (
                        <div
                            key={`${item.id}-${item.type}`}
                            className="bg-white rounded-2xl shadow-sm border border-[#f89b01]/10 p-4"
                        >
                            <div className="flex items-center gap-4">
                                {item.imageBase64 ? (
                                    <img
                                        src={`data:image/jpeg;base64,${item.imageBase64}`}
                                        alt={item.name}
                                        className="h-16 w-16 rounded-xl object-cover border-2 border-[#f89b01] flex-shrink-0"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-xl bg-[#f89b01]/10 flex items-center justify-center flex-shrink-0">
                                        {item.type === "beverage" ? (
                                            <CupSoda className="h-8 w-8 text-[#f89b01]" />
                                        ) : (
                                            <ChefHat className="h-8 w-8 text-[#f89b01]" />
                                        )}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-lg truncate">{item.name}</p>
                                    <p className="text-sm text-gray-500">
                                        ${item.price.toFixed(2)} c/u
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() =>
                                            updateQuantity(
                                                item.id,
                                                item.type,
                                                Math.max(1, item.quantity - 1)
                                            )
                                        }
                                        className="w-8 h-8 rounded-full border-2 border-[#f89b01] text-[#f89b01] font-bold hover:bg-[#f89b01] hover:text-white transition flex items-center justify-center"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-bold text-[#f89b01] text-lg">
                    {item.quantity}
                  </span>
                                    <button
                                        onClick={() =>
                                            updateQuantity(item.id, item.type, item.quantity + 1)
                                        }
                                        className="w-8 h-8 rounded-full border-2 border-[#f89b01] text-[#f89b01] font-bold hover:bg-[#f89b01] hover:text-white transition flex items-center justify-center"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.id, item.type)}
                                        className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total + botón Confirmar */}
                <div className="sticky bottom-4 mt-8 bg-white rounded-2xl shadow-lg border border-[#f89b01]/20 p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-sm text-gray-600 mb-1">Total del pedido</p>
                            <p className="text-2xl font-bold text-[#f89b01]">
                                ${total.toFixed(2)}
                            </p>
                        </div>
                        <button
                            onClick={confirmarPedido}
                            className="w-full sm:w-auto bg-[#f89b01] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#181818] transition-all duration-200 hover:shadow-xl transform hover:scale-105"
                        >
                            Confirmar pedido
                        </button>
                    </div>
                </div>

                {/* --------------- Modal de Confirmación --------------- */}
                {showConfirmPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[#f89b01] to-[#ff8c00] p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                                    {isProcessing ? (
                                        <div className="w-8 h-8 border-4 border-[#f89b01] border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <AlertCircle className="w-8 h-8 text-[#f89b01]" />
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">
                                    {isProcessing ? "Procesando pedido…" : "¿Confirmar pedido?"}
                                </h2>
                                <p className="text-white/90 text-sm">
                                    {isProcessing
                                        ? "Estamos creando tu pedido"
                                        : "Esta acción no se puede deshacer"}
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {!isProcessing ? (
                                    <>
                                        {/* Alerta roja dentro del modal si el QR es inválido */}
                                        {qrError && (
                                            <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg flex gap-2 items-start text-sm">
                                                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                <span>{qrError}</span>
                                            </div>
                                        )}

                                        {/* Invitado: estado del QR o botón escanear */}
                                        {isGuest && (
                                            <div className="mb-4 p-3 border rounded-lg">
                                                {qrCode ? (
                                                    <div className="flex items-center gap-2 text-green-600 text-sm">
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span>✅ QR verificado</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <p className="flex items-center gap-2 justify-center text-red-600 text-sm mb-2">
                                                            <XCircle className="h-4 w-4" />
                                                            QR requerido
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                setQrError(null);
                                                                setShowQRScanner(true);
                                                            }}
                                                            className="bg-[#f89b01] text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-[#ff8c00] transition"
                                                        >
                                                            Escanear QR
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Resumen del pedido */}
                                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                            <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-600">
                          Items en el pedido:
                        </span>
                                                <span className="font-semibold">
                          {cart.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Total a pagar:</span>
                                                <span className="font-bold text-[#f89b01] text-lg">
                          ${total.toFixed(2)}
                        </span>
                                            </div>
                                        </div>

                                        {/* Botones */}
                                        <div className="space-y-4">
                                            <button
                                                onClick={handleFinalConfirm}
                                                disabled={isGuest && !qrCode}
                                                className={`relative w-full py-4 rounded-xl font-bold text-white bg-[#f89b01] overflow-hidden group hover:bg-[#ff8c00] transition-colors ${isGuest && !qrCode ? "opacity-50 cursor-not-allowed" : ""
                                                }`}
                                            >
                                                {/* barra de countdown */}
                                                <div
                                                    className="absolute inset-0 bg-gradient-to-r from-[#181818] to-[#333] transition-all duration-1000 ease-linear"
                                                    style={{
                                                        width:
                                                            isConfirming &&
                                                            (isGuest ? qrCode : true)
                                                                ? `${100 - (countdown / 10) * 100}%`
                                                                : "0%",
                                                        opacity:
                                                            isConfirming &&
                                                            (isGuest ? qrCode : true)
                                                                ? 1
                                                                : 0,
                                                    }}
                                                />
                                                <div className="relative z-10 flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-5 h-5" />
                                                    {isConfirming && (isGuest ? qrCode : true)
                                                        ? `Confirmar (${countdown}s)`
                                                        : isGuest && !qrCode
                                                            ? "Escanea QR primero"
                                                            : "Confirmar pedido"}
                                                </div>
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-5 h-5" /> Cancelar
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#f89b01] border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-gray-600">Creando tu pedido…</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal escáner */}
                <QRScannerModal
                    open={showQRScanner}
                    onScan={handleScanQr}
                    onClose={() => setShowQRScanner(false)}
                />
            </div>
        </div>
    );
};

export default CartPage;
