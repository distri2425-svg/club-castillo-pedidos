// src/hooks/useOrderStatusSocket.ts
import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Suscribe la vista al destino STOMP del pedido indicado y ejecuta la devolucion
 * de llamada cada vez que el servidor publica un cambio de estado.
 *
 * El endpoint debe coincidir con el registrado en WebSocketConfig del backend
 * (/ws-orders) y con la ubicacion declarada en nginx.conf.
 */
export function useOrderStatusSocket(
    orderId: number | null,
    onStatusChange: (status: string, message: string) => void
) {
    const clientRef = useRef<Client | null>(null);

    // La devolucion de llamada se conserva en una referencia para que un cambio
    // de identidad entre renderizados no obligue a rehacer la conexion.
    const callbackRef = useRef(onStatusChange);
    callbackRef.current = onStatusChange;

    useEffect(() => {
        if (!orderId || Number.isNaN(orderId)) return;

        const client = new Client({
            // La fabrica crea un socket nuevo en cada intento, condicion necesaria
            // para que la reconexion automatica funcione: un SockJS ya cerrado no
            // puede reutilizarse.
            webSocketFactory: () => new SockJS("/ws-orders"),
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/orders/client/${orderId}`, (message) => {
                    try {
                        const payload = JSON.parse(message.body);
                        callbackRef.current(payload.status, payload.message);
                    } catch (e) {
                        console.error("Mensaje de estado no valido:", e);
                    }
                });
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            clientRef.current?.deactivate();
            clientRef.current = null;
        };
    }, [orderId]);
}
