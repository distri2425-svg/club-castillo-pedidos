import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    Clock, CheckCircle, ChefHat, Package, AlertCircle, TrendingUp
} from 'lucide-react';
import { Order } from '../../types';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import SockJS from 'sockjs-client';
import { Stomp, CompatClient } from '@stomp/stompjs';

const API_URL = '';

// Estados que se muestran como paneles del tablero (los cancelados se agrupan al final).
const STATUS_ORDER: Order['status'][] = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'DELIVERED',
    'CANCELLED'
];

// Map each status to label/icon/color
const STATUS_META: Record<Order['status'], {
    label: string;
    icon: React.ComponentType<any>;
    badgeColor: string;
    panelColor: string;
}> = {
    PENDING:   { label: 'Pendientes',       icon: AlertCircle, badgeColor: 'bg-yellow-500', panelColor: 'bg-yellow-50' },
    CONFIRMED: { label: 'Confirmados',      icon: CheckCircle, badgeColor: 'bg-blue-500',   panelColor: 'bg-blue-50'   },
    PREPARING: { label: 'En Preparación',    icon: ChefHat,     badgeColor: 'bg-orange-500', panelColor: 'bg-orange-50' },
    READY:     { label: 'Listos',            icon: Package,     badgeColor: 'bg-green-500',  panelColor: 'bg-green-50'  },
    DELIVERED: { label: 'Entregados',        icon: TrendingUp,  badgeColor: 'bg-gray-500',   panelColor: 'bg-gray-100'  },
    CANCELLED: { label: 'Cancelados',        icon: AlertCircle, badgeColor: 'bg-red-500',    panelColor: 'bg-red-50'    },
};

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    // Un administrador puede conducir mas de una unidad. La chef principal de
    // las etapas 1 y 3 del complejo es el caso real, y el panel debe mostrarle
    // los pedidos de ambas cocinas en una sola pantalla.
    const restaurantIds = useMemo<number[]>(() => {
        if (user?.restaurantIds?.length) return user.restaurantIds.map(Number);
        return user?.restaurantId ? [Number(user.restaurantId)] : [];
    }, [user?.restaurantIds, user?.restaurantId]);

    const [orders, setOrders] = useState<Order[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [lastUpdate, setLastUpdate] = useState<string>("");
    const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

    // Usar useRef para mantener la referencia del cliente STOMP
    const stompClientRef = useRef<CompatClient | null>(null);
    const subscriptionRef = useRef<any[]>([]);

    // Track which panels are open
    const [openPanels, setOpenPanels] = useState<Record<Order['status'], boolean>>({
        PENDING:   true,
        CONFIRMED: false,
        PREPARING: false,
        READY:     false,
        DELIVERED: false,
        CANCELLED: false,
    });

    // Función para obtener pedidos
    const fetchOrders = useCallback(async () => {
        if (restaurantIds.length === 0) return;

        try {
            const token = localStorage.getItem('token') ?? '';
            const porUnidad = await Promise.all(
                restaurantIds.map(rid =>
                    axios.get<Order[]>(
                        `${API_URL}/orders/restaurant/${rid}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ).then(res => res.data.map(o => ({ ...o, restaurantId: rid })))
                )
            );
            // Se ordenan por fecha para que las dos cocinas queden intercaladas
            // en un unico flujo cronologico y no agrupadas por unidad.
            const combinados = porUnidad.flat().sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOrders(combinados);
            setLastUpdate(new Date().toLocaleTimeString());
            console.log('Órdenes actualizadas:', combinados.length);
        } catch (err) {
            console.error('Error cargando pedidos:', err);
        }
    }, [restaurantIds]);

    // Mensajes STOMP del destino /topic/orders/{restaurantId}.
    //
    // El servidor publica un OrderStatusMessage con los campos orderId, status,
    // restaurantId y message. El campo status lleva NEW_ORDER cuando ingresa un
    // pedido y el nombre del estado (CONFIRMED, READY, ...) en cada transicion.
    // La version anterior esperaba un campo `type` que el servidor nunca envia,
    // de modo que el panel ignoraba el aviso y dependia del sondeo de respaldo.
    const handleStompMessage = useCallback((message: any, restaurantId: number) => {
        try {
            const data = JSON.parse(message.body);
            const estado: string | undefined = data.status;
            const orderId: number | undefined = data.orderId ?? data.id;

            if (estado === 'NEW_ORDER') {
                // El aviso no transporta el detalle del pedido (productos, total),
                // asi que se recupera por REST en el momento de recibirlo.
                fetchOrders();
            } else if (estado && orderId != null) {
                setOrders(prev => {
                    const existe = prev.some(o => o.id === orderId);
                    if (!existe) {
                        // Transicion de un pedido que el panel aun no conoce
                        // (por ejemplo, creado antes de abrir la vista).
                        fetchOrders();
                        return prev;
                    }
                    return prev.map(order =>
                        order.id === orderId
                            ? {
                                ...order,
                                status: estado as Order['status'],
                                restaurantId: order.restaurantId ?? restaurantId,
                                updatedAt: new Date().toISOString(),
                            }
                            : order
                    );
                });
            }

            setLastUpdate(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error procesando mensaje STOMP:', error);
        }
    }, [fetchOrders]);

    // Función para conectar STOMP
    const connectStomp = useCallback(() => {
        if (restaurantIds.length === 0) return;

        // Desconectar cliente existente
        if (stompClientRef.current) {
            stompClientRef.current.disconnect();
        }

        // Crear nueva conexión SockJS
        const socket = new SockJS(`${API_URL}/ws-orders`);
        const stompClient = Stomp.over(socket);

        // Configurar headers si tienes autenticación
        const headers = {
            // Agregar token si es necesario
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        };

        stompClient.connect(headers,
            // Callback de éxito
            () => {
                console.log('STOMP conectado para las unidades:', restaurantIds.join(', '));
                setIsConnected(true);
                setConnectionAttempts(0);
                setLastUpdate(new Date().toLocaleTimeString());

                // Una suscripcion por cada unidad a cargo del administrador.
                subscriptionRef.current = restaurantIds.map(rid => {
                    const topic = `/topic/orders/${rid}`;
                    console.log('Suscribiéndose a:', topic);
                    return stompClient.subscribe(topic, (msg: any) => handleStompMessage(msg, rid));
                });

            },
            // Callback de error
            (error) => {
                console.error('Error conectando STOMP:', error);
                setIsConnected(false);
                setConnectionAttempts(prev => prev + 1);

                // Reintentar conexión
                if (connectionAttempts < 5) {
                    setTimeout(() => {
                        connectStomp();
                    }, 3000);
                }
            }
        );

        stompClientRef.current = stompClient;
    }, [restaurantIds, handleStompMessage, connectionAttempts]);

    // Update order status via API
    const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
        try {
            const token = localStorage.getItem('token') ?? '';
            const res = await axios.put<Order>(
                `${API_URL}/orders/${orderId}/status?status=${newStatus}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setOrders(prev =>
                prev.map(o => o.id === orderId ? { ...res.data, updatedAt: new Date().toISOString() } : o)
            );

            // Update last update time
            setLastUpdate(new Date().toLocaleTimeString());

        } catch (err) {
            console.error('Error actualizando estado:', err);
        }
    };

    // Toggle panel open/closed
    const togglePanel = (status: Order['status']) => {
        setOpenPanels(p => ({ ...p, [status]: !p[status] }));
    };

    // Conectar STOMP al montar el componente
    useEffect(() => {
        connectStomp();

        // Polling como respaldo cada 60 segundos
        const polling = setInterval(fetchOrders, 60000);

        return () => {
            subscriptionRef.current.forEach((sub: any) => sub?.unsubscribe());
            subscriptionRef.current = [];
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
            }
            clearInterval(polling);
        };
    }, [connectStomp, fetchOrders]);

    // Fetch inicial
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return (
        <div className="p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                    <p className="text-gray-600 mt-1">Gestión de pedidos y restaurante</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-500">
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                        {connectionAttempts > 0 && (
                            <span className="text-xs text-orange-500">
                                (Intentos: {connectionAttempts})
                            </span>
                        )}
                    </div>
                    {lastUpdate && (
                        <span className="text-xs text-gray-400">
                            Última actualización: {lastUpdate}
                        </span>
                    )}
                    <button
                        onClick={fetchOrders}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Actualizar
                    </button>
                    <button
                        onClick={connectStomp}
                        className="text-sm bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
                    >
                        Reconectar
                    </button>
                </div>
            </header>

            {/* Statistics summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {STATUS_ORDER.map(status => {
                    const { label, badgeColor } = STATUS_META[status];
                    const count = orders.filter(o => o.status === status).length;
                    return (
                        <div key={status} className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="text-center">
                                <div className={`${badgeColor} text-white text-2xl font-bold px-4 py-2 rounded-lg mb-2`}>
                                    {count}
                                </div>
                                <div className="text-sm text-gray-600">{label}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Order panels */}
            <div className="space-y-4">
                {STATUS_ORDER.map(status => {
                    const { label, icon: Icon, badgeColor, panelColor } = STATUS_META[status];
                    const bucket = orders.filter(o => o.status === status);
                    const isOpen = openPanels[status];

                    return (
                        <div key={status} className="border rounded-xl overflow-hidden shadow-sm">
                            {/* Panel header */}
                            <button
                                onClick={() => togglePanel(status)}
                                className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="h-6 w-6 text-gray-600" />
                                    <span className="text-xl font-semibold">{label}</span>
                                    <motion.span
                                        className={`${badgeColor} text-white text-sm font-medium px-3 py-1 rounded-full`}
                                        key={bucket.length}
                                        initial={{ scale: 1.2 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {bucket.length}
                                    </motion.span>
                                </div>
                                <motion.span
                                    animate={{ rotate: isOpen ? 90 : 0 }}
                                    className="text-gray-500 transition-transform"
                                >
                                    ▶
                                </motion.span>
                            </button>

                            {/* Panel body */}
                            <motion.div
                                initial={false}
                                animate={{ height: isOpen ? 'auto' : 0 }}
                                className="overflow-hidden"
                            >
                                {isOpen && (
                                    <div className={`${panelColor} p-6 space-y-4`}>
                                        {bucket.length === 0
                                            ? <p className="text-gray-500 text-center py-8">No hay pedidos en este estado.</p>
                                            : bucket.map(order => (
                                                <motion.div
                                                    key={order.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <p className="font-bold text-lg">#{order.id}</p>
                                                                <p className="font-medium">{order.customerName}</p>
                                                            </div>
                                                            <div className="text-sm text-gray-500 space-y-1">
                                                                <p>Creado: {new Date(order.createdAt).toLocaleString()}</p>
                                                                {order.updatedAt !== order.createdAt && (
                                                                    <p>Actualizado: {new Date(order.updatedAt).toLocaleString()}</p>
                                                                )}
                                                                {order.tableNumber && (
                                                                    <p>Mesa: {order.tableNumber}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
                                                            <div className="flex flex-col gap-2">
                                                                {/* Action buttons */}
                                                                {status === 'PENDING' && (
                                                                    <button
                                                                        onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                                                                    >
                                                                        Confirmar
                                                                    </button>
                                                                )}
                                                                {status === 'CONFIRMED' && (
                                                                    <button
                                                                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                                                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                                                                    >
                                                                        Preparar
                                                                    </button>
                                                                )}
                                                                {status === 'PREPARING' && (
                                                                    <button
                                                                        onClick={() => updateOrderStatus(order.id, 'READY')}
                                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                                                                    >
                                                                        Listo
                                                                    </button>
                                                                )}
                                                                {status === 'READY' && (
                                                                    <button
                                                                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                                                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                                                                    >
                                                                        Entregado
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        }
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;