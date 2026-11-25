import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Send, Sparkles, RefreshCw, Crown,
    Clock, MapPin, QrCode, Utensils
} from "lucide-react";
import api from "../../services/api";

// La consulta al modelo de lenguaje se resuelve en el servidor, de modo que la
// credencial del servicio permanezca en el entorno del backend y no viaje dentro
// del paquete de la aplicacion web, donde quedaba a la vista de cualquier
// visitante. El servidor acompaña ademas la consulta con el catalogo real de
// zonas, restaurantes y platos. Si el asistente no esta configurado o el
// servicio externo falla, se responde con el repertorio local y se lo indica.
const RUTA_CHAT = "/assistant/chat";
const RUTA_ESTADO = "/assistant/status";
const ESPERA_MAXIMA = 25000;
const TURNOS_ENVIADOS = 6;

interface Message {
    id: string;
    text: string;
    from: "user" | "ai";
    timestamp: string;
    /** Verdadero cuando la respuesta salio del repertorio local y no del modelo. */
    local?: boolean;
}

export default function AiChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "¡Hola! 👋 Bienvenido al Club Castillo de Amaguaña. Soy tu Asistente Virtual con IA. ¿En qué te puedo colaborar hoy?",
            from: "ai",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [iaDisponible, setIaDisponible] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Contador propio para la clave de cada mensaje: con la marca de tiempo se
    // repetia el identificador cuando dos mensajes se agregaban en el mismo
    // milisegundo, que es el caso de la pregunta y su respuesta local.
    const contadorRef = useRef(1);
    const nuevoId = () => String(++contadorRef.current);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Al abrir la ventana se consulta si el asistente esta configurado, para no
    // anunciar una atencion con inteligencia artificial que no esta operativa.
    useEffect(() => {
        if (!open || iaDisponible !== null) return;
        api.get(RUTA_ESTADO)
            .then(({ data }) => setIaDisponible(!!data?.available))
            .catch(() => setIaDisponible(false));
    }, [open, iaDisponible]);

    // Respuestas rápidas sugeridas
    const quickPrompts = [
        { icon: Clock, label: "Horarios de Atención", query: "¿Cuáles son los horarios de atención del club?" },
        { icon: MapPin, label: "Ubicación & Zonas", query: "¿Dónde queda el club y qué zonas de entrega existen?" },
        { icon: QrCode, label: "Pedidos con QR", query: "¿Cómo hago un pedido escaneando el código QR?" },
        { icon: Utensils, label: "Restaurantes & Menú", query: "¿Qué restaurantes y opciones de comida hay disponibles?" },
    ];

    // Asistente Local con datos del Club Castillo
    const getLocalAssistantResponse = (query: string): string => {
        const q = query.toLowerCase();

        if (q.includes("horario") || q.includes("hora") || q.includes("abierto") || q.includes("atencion")) {
            return "🕒 **Horarios Oficiales:**\n• **Martes a Domingo:** 08:00 AM – 08:00 PM\n• **Lunes:** Mantenimiento programado de instalaciones.";
        }
        if (q.includes("donde") || q.includes("ubicacion") || q.includes("direccion") || q.includes("llegar")) {
            return "📍 **Ubicación Institucional:**\nNos encontramos en la parroquia de Amaguaña, Valle de los Chillos, Quito - Ecuador.\n\n🏖️ **Zonas de Entrega Habilitadas:**\n• Piscina Principal\n• Zonas Deportivas & Canchas\n• Salón Social de Eventos\n• Terrazas Gastronómicas";
        }
        if (q.includes("pedido") || q.includes("qr") || q.includes("pedir") || q.includes("comprar")) {
            return "📱 **Pasos para Realizar un Pedido:**\n1. Escanea el código QR de tu mesa o zona.\n2. Revisa el menú del restaurante deseado.\n3. Selecciona tus alimentos o bebidas.\n4. ¡Confirma la orden y la llevamos directamente a tu ubicación!";
        }
        if (q.includes("menu") || q.includes("comida") || q.includes("bebida") || q.includes("plato") || q.includes("restaurante")) {
            return "🍽️ **Gastronomía del Club:**\nContamos con variedad de restaurantes que ofrecen platillos tradicionales ecuatorianos, parrilladas gourmet, repostería y bebidas frías. Explora el catálogo en vivo desde nuestro sistema.";
        }
        if (q.includes("seguridad") || q.includes("lopdp") || q.includes("datos") || q.includes("privacidad")) {
            return "🛡️ **Protección de Datos LOPDP:**\nTus datos personales y de cuenta se encuentran protegidos bajo estricto cumplimiento del Art. 8 de la Ley Orgánica de Protección de Datos Personales del Ecuador.";
        }
        if (q.includes("hola") || q.includes("buenas") || q.includes("saludos")) {
            return "¡Un gusto saludarte! Estoy listo para responder tus dudas sobre el Club Castillo de Amaguaña, restaurantes, zonas de entrega o soporte para tu pedido.";
        }

        return "🏰 **Asistente Club Castillo:** Con gusto puedo brindarte detalles sobre restaurantes, horarios, zonas del club o ayuda para realizar tu pedido con código QR. ¿Qué información deseas consultar?";
    };

    const responderLocalmente = (msg: string, hora: string) => {
        setMessages((m) => [
            ...m,
            { id: nuevoId(), text: getLocalAssistantResponse(msg), from: "ai", timestamp: hora, local: true },
        ]);
    };

    async function consultarAsistente(msg: string) {
        setLoading(true);
        const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Se envian los ultimos turnos para que el asistente conserve el hilo:
        // antes cada pregunta viajaba suelta y la conversacion no tenia memoria.
        const history = messages
            .slice(-TURNOS_ENVIADOS)
            .map((m) => ({ role: m.from === "user" ? "user" : "model", text: m.text }));

        try {
            const { data } = await api.post(
                RUTA_CHAT,
                { message: msg, history },
                { timeout: ESPERA_MAXIMA }
            );

            if (data?.reply) {
                setIaDisponible(true);
                setMessages((m) => [
                    ...m,
                    { id: nuevoId(), text: data.reply, from: "ai", timestamp: hora },
                ]);
            } else {
                setIaDisponible(false);
                responderLocalmente(msg, hora);
            }
        } catch (error) {
            setIaDisponible(false);
            responderLocalmente(msg, hora);
        } finally {
            setLoading(false);
        }
    }

    const handleSend = async (textToSend?: string) => {
        const query = textToSend || input;
        if (!query.trim() || loading) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsg: Message = {
            id: nuevoId(),
            text: query.trim(),
            from: "user",
            timestamp: timeStr
        };

        setMessages(m => [...m, userMsg]);
        if (!textToSend) setInput("");

        await consultarAsistente(query);
    };

    const handleResetChat = () => {
        setMessages([
            {
                id: nuevoId(),
                text: "¡Hola! 👋 Conversación reiniciada. ¿En qué más te puedo ayudar?",
                from: "ai",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-bottom justify-end sm:p-6 p-2 pointer-events-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="bg-white w-full sm:w-[420px] rounded-3xl shadow-2xl border border-[#f89b01]/30 flex flex-col h-[600px] max-h-[88vh] overflow-hidden"
                >
                    {/* Header Estilo Premium Club Castillo */}
                    <div className="bg-[#181818] p-4 sm:p-5 text-white flex items-center justify-between border-b border-[#f89b01]/30 relative overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#f89b01]/20 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex items-center gap-3.5 relative z-10">
                            <div className="relative">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#f89b01] to-[#ffb933] text-[#181818] flex items-center justify-center font-bold shadow-md">
                                    <Crown className="w-6 h-6" />
                                </div>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-[#181818] rounded-full ${
                                    iaDisponible === false ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                            </div>

                            <div>
                                <h3 className="font-black text-base flex items-center gap-2 text-white">
                                    Asistente Castillo
                                    <Sparkles className="w-4 h-4 text-[#f89b01]" />
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-amber-200/80 font-semibold">
                                    <span>
                                        {iaDisponible === null
                                            ? 'Conectando...'
                                            : iaDisponible
                                                ? 'IA en línea'
                                                : 'Modo básico'}
                                    </span>
                                    <span>·</span>
                                    <span>Atención 24/7</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 relative z-10">
                            <button
                                onClick={handleResetChat}
                                title="Reiniciar chat"
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>

                            <button
                                onClick={onClose}
                                title="Cerrar"
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Fichas de Respuestas Rápidas */}
                    <div className="p-3 bg-amber-50/70 border-b border-amber-200/60 overflow-x-auto flex gap-2 no-scrollbar">
                        {quickPrompts.map((qp, idx) => {
                            const IconComponent = qp.icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(qp.query)}
                                    disabled={loading}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#f89b01]/30 text-[11px] font-black text-slate-800 hover:bg-[#f89b01] hover:text-[#181818] transition-all shadow-sm disabled:opacity-50"
                                >
                                    <IconComponent className="w-3.5 h-3.5 text-[#f89b01] group-hover:text-[#181818]" />
                                    <span>{qp.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Área de Mensajes */}
                    <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/60 font-sans">
                        {messages.map((m) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[88%] space-y-1 ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-3xl text-xs sm:text-sm font-semibold shadow-sm leading-relaxed whitespace-pre-line ${
                                        m.from === 'user'
                                            ? 'bg-[#181818] text-white rounded-tr-none'
                                            : 'bg-white text-slate-900 border border-[#f89b01]/30 rounded-tl-none shadow-sm'
                                    }`}>
                                        {m.text}
                                    </div>
                                    <div className={`text-[10px] text-slate-400 font-bold px-2 flex items-center gap-1.5 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <span>{m.timestamp}</span>
                                        {m.local && (
                                            <span className="text-amber-600/80">· respuesta del repertorio local</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white p-4 rounded-3xl border border-[#f89b01]/30 rounded-tl-none shadow-sm flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-[#f89b01] animate-bounce" />
                                        <span className="w-2 h-2 rounded-full bg-[#f89b01] animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-2 h-2 rounded-full bg-[#f89b01] animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                    <span className="text-xs font-black text-slate-600">Consultando los datos del Castillo...</span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input y Botón de Envío */}
                    <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Escribe un mensaje..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading}
                            className="flex-1 px-4 py-3 disabled:opacity-60 bg-slate-100 border border-slate-200 focus:border-[#f89b01] rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none transition-colors"
                        />

                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            className="p-3 bg-[#f89b01] text-[#181818] hover:bg-[#ffb933] rounded-2xl font-bold shadow-md shadow-amber-500/20 disabled:opacity-40 transition-all flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}