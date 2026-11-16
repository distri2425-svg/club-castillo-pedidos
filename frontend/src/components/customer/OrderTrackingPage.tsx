import React, { useEffect, useState } from "react";
import {
    Clock, Loader2, CheckCircle, XCircle, BellRing, RefreshCcw,
    ArrowLeft, Package, Utensils, Coffee, ChevronDown, ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrderStatusSocket } from "@/hooks/useOrderStatusSocket";

const STATUS_MAP: Record<string, { label: string; icon: JSX.Element }> = {
    PENDING: { label: "Pendiente", icon: <Clock className="w-6 h-6 text-gray-500" /> },
    CONFIRMED: { label: "Confirmado", icon: <BellRing className="w-6 h-6 text-yellow-500" /> },
    PREPARING: { label: "Preparando", icon: <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> },
    READY: { label: "Listo para retirar", icon: <CheckCircle className="w-6 h-6 text-green-500" /> },
    DELIVERED: { label: "Entregado", icon: <CheckCircle className="w-6 h-6 text-green-700" /> },
    CANCELLED: { label: "Cancelado", icon: <XCircle className="w-6 h-6 text-red-500" /> },
};

export const MSG: Record<string, string> = {
    PENDING: "Estamos revisando tu pedido…",
    CONFIRMED: "¡Pedido confirmado! En breve lo pasamos a cocina.",
    PREPARING: "Tu pedido se está preparando, ten paciencia 😉",
    READY: "¡Listo! Pasa por el mostrador para retirarlo.",
    DELIVERED: "Pedido entregado. ¡Que lo disfrutes! 🍽️",
    CANCELLED: "Tu pedido fue cancelado. Si tienes dudas, acércate al personal."
};

const API_URL = "";
const POLL_MS = 300_000;

const fmtPrice = (p?: number | null) => p == null ? "—" : `$${p.toFixed(2)}`;

const OrderTrackingPage: React.FC = () => {
    const navigate = useNavigate();
    const orderId = localStorage.getItem("orderId");

    const [order, setOrder] = useState<any>(null);
    const [status, setStatus] = useState("PENDING");
    const [lastUpdate, setLastUpdate] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const fetchOrder = async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const r = await fetch(`${API_URL}/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!r.ok) {
                if (r.status === 404) {
                    alert("El pedido ya no existe.");
                    localStorage.removeItem("orderId");
                    navigate("/customer/restaurants");
                }
                return;
            }
            const data = await r.json();
            setOrder(data);
            setStatus(data.status);
            setLastUpdate(new Date().toLocaleTimeString());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!orderId) {
            navigate("/customer/restaurants");
            return;
        }
        fetchOrder();
        // Consulta de reconciliacion de baja frecuencia: no sustituye al canal en
        // tiempo real, sino que lo respalda ante una perdida de conexion que no
        // llegue a detectarse.
        const t = setInterval(fetchOrder, POLL_MS);
        return () => clearInterval(t);
    }, [orderId]);

    // Canal en tiempo real: el servidor publica cada transicion en el destino
    // /topic/orders/client/{orderId}. Los avisos auxiliares que no corresponden a
    // un estado del ciclo de vida (por ejemplo NEW_ORDER) se descartan, ya que de
    // aplicarse dejarian la barra de progreso sin ningun paso seleccionado.
    useOrderStatusSocket(orderId ? Number(orderId) : null, (nuevoEstado) => {
        if (!STATUS_MAP[nuevoEstado]) return;
        setStatus(nuevoEstado);
        setLastUpdate(new Date().toLocaleTimeString());
        fetchOrder();
    });

    const STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"];
    const stepIndex = STEPS.indexOf(status);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="w-full px-4 py-4 bg-white shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate("/customer/restaurants")}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f89b01] to-[#ff8c00] text-white rounded-lg font-medium text-sm sm:text-base hover:from-[#ff8c00] hover:to-[#f89b01] transition-all duration-200 shadow-md">
                        <ArrowLeft className="w-4 h-4" />
                        Menú principal
                    </button>
                    <div className="flex items-center gap-3">
                        <RefreshCcw className={`w-5 h-5 cursor-pointer transition-all duration-200 text-gray-600 ${loading ? "animate-spin" : "hover:text-gray-800"}`}
                                    title="Actualizar" onClick={loading ? undefined : fetchOrder} />
                        {lastUpdate && (
                            <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                                Última act.: {lastUpdate}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Mobile */}
                <div className="lg:hidden space-y-6">
                    {order && (
                        <div className="bg-white rounded-2xl shadow-lg border-t-4 border-[#f89b01] p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#f89b01]/5 to-transparent rounded-full -mr-16 -mt-16"></div>

                            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#f89b01]/10 rounded-lg">
                                        <Package className="w-6 h-6 text-[#f89b01]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-gray-800">Pedido #{order.id}</p>
                                        <p className="text-gray-600">Cliente: {order.customerName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-[#f89b01]">{fmtPrice(order.total)}</p>
                                    <p className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border border-gray-200"
                            >
                                <span className="text-sm font-medium text-gray-700">
                                    {showDetails ? 'Ocultar' : 'Ver'} detalles del pedido
                                </span>
                                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {showDetails && (
                                <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-300">
                                    {order.items?.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Utensils className="w-5 h-5 text-[#f89b01]" />
                                                <h4 className="font-semibold text-gray-800">Comida</h4>
                                            </div>
                                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 space-y-2">
                                                {order.items.map((it: any, i: number) =>
                                                    <div key={i} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 bg-[#f89b01] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                                {it.quantity}
                                                            </span>
                                                            <span className="font-medium">{it.name}</span>
                                                        </div>
                                                        <span className="font-semibold text-gray-800">
                                                            {fmtPrice((it.price ?? it.unitPrice ?? 0) * it.quantity)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {order.beverages?.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Coffee className="w-5 h-5 text-[#f89b01]" />
                                                <h4 className="font-semibold text-gray-800">Bebidas</h4>
                                            </div>
                                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 space-y-2">
                                                {order.beverages.map((b: any, i: number) =>
                                                    <div key={i} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                                {b.quantity}
                                                            </span>
                                                            <span className="font-medium">{b.name}</span>
                                                        </div>
                                                        <span className="font-semibold text-gray-800">
                                                            {fmtPrice((b.price ?? b.unitPrice ?? 0) * b.quantity)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timeline Mobile */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="p-2 bg-[#f89b01]/10 rounded-lg">
                                <Package className="w-5 h-5 text-[#f89b01]" />
                            </div>
                            Estado del pedido
                        </h3>

                        <ul className="space-y-4">
                            {STEPS.map((s, idx) => {
                                const active = status === s;
                                const done = stepIndex > idx;
                                const upcoming = stepIndex < idx;

                                return (
                                    <li key={s} className="relative">
                                        {idx < STEPS.length - 1 && (
                                            <div className={`absolute left-4 top-12 w-0.5 h-8 transition-all duration-500 ${
                                                done ? 'bg-green-500' :
                                                    active ? 'bg-gradient-to-b from-[#f89b01] to-gray-200' :
                                                        'bg-gray-200'
                                            }`}></div>
                                        )}

                                        <div className={`flex items-start gap-3 p-4 rounded-xl transition-all duration-300 ${
                                            active ? 'bg-gradient-to-r from-[#f89b01]/10 to-[#ff8c00]/10 border-2 border-[#f89b01]/30 shadow-lg scale-105' :
                                                done ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' :
                                                    upcoming ? 'bg-gray-50 border-2 border-gray-200' :
                                                        'bg-gray-50 border border-gray-200'
                                        }`}>
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                active ? 'bg-[#f89b01] border-[#f89b01] text-white shadow-lg' :
                                                    done ? 'bg-green-500 border-green-500 text-white' :
                                                        'bg-white border-gray-300'
                                            }`}>
                                                {done ? (
                                                    <CheckCircle className="w-5 h-5" />
                                                ) : active ? (
                                                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                                ) : (
                                                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <p className={`font-bold text-lg ${
                                                    active ? 'text-[#f89b01]' :
                                                        done ? 'text-green-700' :
                                                            'text-gray-600'
                                                }`}>
                                                    {STATUS_MAP[s].label}
                                                </p>
                                                {active && (
                                                    <div className="flex flex-col items-center gap-2 w-full min-h-[50px]">
                                                        <p className="text-sm text-gray-600 mt-1 bg-white/50 p-2 rounded-lg">
                                                            {MSG[s]}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {active && (
                                                <div className="text-[#f89b01] animate-pulse bg-white/20 p-2 rounded-full">
                                                    {STATUS_MAP[s].icon}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* Desktop */}
                <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">
                    <div className="space-y-6">
                        {order && (
                            <div className="bg-white rounded-2xl shadow-lg border-t-4 border-[#f89b01] p-8 relative overflow-hidden h-fit">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#f89b01]/5 to-transparent rounded-full -mr-20 -mt-20"></div>

                                <div className="mb-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-[#f89b01]/10 rounded-xl">
                                            <Package className="w-8 h-8 text-[#f89b01]" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-2xl text-gray-800">Pedido #{order.id}</h2>
                                            <p className="text-gray-600 text-lg">Cliente: {order.customerName}</p>
                                        </div>
                                    </div>
                                    <div className="text-center bg-gradient-to-r from-[#f89b01]/10 to-[#ff8c00]/10 p-6 rounded-xl">
                                        <p className="text-5xl font-bold text-[#f89b01] mb-2">{fmtPrice(order.total)}</p>
                                        <p className="text-gray-500 bg-white px-4 py-2 rounded-full inline-block">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {order.items?.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <Utensils className="w-6 h-6 text-[#f89b01]" />
                                                <h4 className="font-bold text-xl text-gray-800">Comida</h4>
                                            </div>
                                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 space-y-3">
                                                {order.items.map((it: any, i: number) =>
                                                    <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-8 h-8 bg-[#f89b01] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                                {it.quantity}
                                                            </span>
                                                            <span className="font-medium text-lg">{it.name}</span>
                                                        </div>
                                                        <span className="font-bold text-lg text-gray-800">
                                                            {fmtPrice((it.price ?? it.unitPrice ?? 0) * it.quantity)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {order.beverages?.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <Coffee className="w-6 h-6 text-[#f89b01]" />
                                                <h4 className="font-bold text-xl text-gray-800">Bebidas</h4>
                                            </div>
                                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 space-y-3">
                                                {order.beverages.map((b: any, i: number) =>
                                                    <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                                {b.quantity}
                                                            </span>
                                                            <span className="font-medium text-lg">{b.name}</span>
                                                        </div>
                                                        <span className="font-bold text-lg text-gray-800">
                                                            {fmtPrice((b.price ?? b.unitPrice ?? 0) * b.quantity)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline Desktop */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                                <div className="p-3 bg-[#f89b01]/10 rounded-xl">
                                    <Package className="w-7 h-7 text-[#f89b01]" />
                                </div>
                                Estado del pedido
                            </h3>

                            <ul className="space-y-6">
                                {STEPS.map((s, idx) => {
                                    const active = status === s;
                                    const done = stepIndex > idx;
                                    const upcoming = stepIndex < idx;

                                    return (
                                        <li key={s} className="relative">
                                            {idx < STEPS.length - 1 && (
                                                <div className={`absolute left-6 top-16 w-0.5 h-12 transition-all duration-500 ${
                                                    done ? 'bg-green-500' :
                                                        active ? 'bg-gradient-to-b from-[#f89b01] to-gray-200' :
                                                            'bg-gray-200'
                                                }`}></div>
                                            )}

                                            <div className={`flex items-start gap-4 p-6 rounded-xl transition-all duration-300 ${
                                                active ? 'bg-gradient-to-r from-[#f89b01]/10 to-[#ff8c00]/10 border-2 border-[#f89b01]/30 shadow-lg transform scale-105' :
                                                    done ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' :
                                                        upcoming ? 'bg-gray-50 border-2 border-gray-200' :
                                                            'bg-gray-50 border border-gray-200'
                                            }`}>
                                                <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                    active ? 'bg-[#f89b01] border-[#f89b01] text-white shadow-lg' :
                                                        done ? 'bg-green-500 border-green-500 text-white' :
                                                            'bg-white border-gray-300'
                                                }`}>
                                                    {done ? (
                                                        <CheckCircle className="w-7 h-7" />
                                                    ) : active ? (
                                                        <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                                                    ) : (
                                                        <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <p className={`font-bold text-xl mb-2 ${
                                                        active ? 'text-[#f89b01]' :
                                                            done ? 'text-green-700' :
                                                                'text-gray-600'
                                                    }`}>
                                                        {STATUS_MAP[s].label}
                                                    </p>
                                                    {active && (
                                                        <div className="flex flex-col items-center gap-2 w-full min-h-[50px]">
                                                            <p className="text-gray-600 bg-white/70 p-3 rounded-lg">
                                                                {MSG[s]}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {active && (
                                                    <div className="text-[#f89b01] animate-pulse bg-white/20 p-3 rounded-full">
                                                        {STATUS_MAP[s].icon}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;
