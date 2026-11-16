import SockJS from "sockjs-client";
import { Client, over } from "stompjs";

let stompClient: Client | null = null;

export const connectWebSocket = (restaurantId: string | number, onMessage: (message: any) => void) => {
    const socket = new SockJS("/ws-orders");
    stompClient = over(socket);

    stompClient.connect({}, () => {
        console.log("📡 Conectado al WebSocket cliente");

        stompClient?.subscribe(`/topic/orders/${restaurantId}`, (msg) => {
            const body = JSON.parse(msg.body);
            console.log("📥 Pedido actualizado (cliente):", body);
            onMessage(body);
        });
    });
};

export const disconnectWebSocket = () => {
    if (stompClient) {
        stompClient.disconnect(() => {
            console.log("🔌 WebSocket desconectado");
        });
        stompClient = null;
    }
};
