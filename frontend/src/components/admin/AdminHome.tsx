import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    DoorOpen, DoorClosed, Moon, Sun, Zap, Clock, Users,
    TrendingUp, Heart
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "";

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    color: string;
}

const AdminHome: React.FC = () => {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId || user?.restauranteId;
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [statusChanging, setStatusChanging] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [timeStats, setTimeStats] = useState({
        openMinutes: 0,
        closedMinutes: 0,
        totalSwitches: 0
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    // Cargar datos del restaurante
    useEffect(() => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }
        const fetchRestaurant = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/restaurants/${restaurantId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRestaurant(res.data);
            } catch {
                toast.error("Error al cargar datos del restaurante");
            }
            setLoading(false);
        };
        fetchRestaurant();
    }, [restaurantId]);

    // Actualizar tiempo actual
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Generar partículas dinámicas
    useEffect(() => {
        if (!restaurant) return;
        const isOpen = restaurant.status === "OPEN";
        const isClosed = restaurant.status === "CLOSED";

        if (isOpen) {
            const generateParticles = () => {
                const colors = ['#f89b01', '#ffb933', '#ffe066', '#4ecdc4', '#45b7d1'];
                const newParticles = Array.from({ length: 20 }, (_, i) => ({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 10 + 6,
                    delay: Math.random() * 3,
                    duration: Math.random() * 6 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)]
                }));
                setParticles(newParticles);
            };
            generateParticles();
            const interval = setInterval(generateParticles, 9000);
            return () => clearInterval(interval);
        } else if (isClosed) {
            const generateStars = () => {
                const newParticles = Array.from({ length: 32 }, (_, i) => ({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 4 + 1,
                    delay: Math.random() * 4,
                    duration: Math.random() * 5 + 3,
                    color: '#94a3b8'
                }));
                setParticles(newParticles);
            };
            generateStars();
            const interval = setInterval(generateStars, 10000);
            return () => clearInterval(interval);
        } else {
            setParticles([]);
        }
    }, [restaurant?.status]);

    // Toggle de estado
    const handleStatusToggle = async () => {
        if (statusChanging || !restaurant) return;

        const newStatus = restaurant.status === "OPEN" ? "CLOSED" : "OPEN";
        setStatusChanging(true);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(`${API_URL}/restaurants/${restaurantId}`, {
                ...restaurant,
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRestaurant(res.data);
            setTimeStats(prev => ({ ...prev, totalSwitches: prev.totalSwitches + 1 }));
            toast.success(newStatus === "OPEN"
                ? "¡Restaurante abierto! Listo para recibir pedidos"
                : "Restaurante cerrado"
            );
        } catch {
            toast.error("Error al cambiar el estado del restaurante");
        } finally {
            setStatusChanging(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#181818]">
                <p className="text-white text-xl font-bold animate-pulse">Cargando panel de control...</p>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-red-800">
                <div className="text-center text-white">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-3xl font-bold mb-2">Error</h2>
                    <p className="text-xl opacity-80">No se encontró el restaurante</p>
                </div>
            </div>
        );
    }

    const isOpen = restaurant.status === "OPEN";

    return (
        <div className={`
            h-screen flex flex-col items-center justify-center
            p-4
            transition-all duration-1000
            ${isOpen
            ? 'bg-gradient-to-br from-[#7f7f7f] via-[#f9af33] to-[#7f7f7f]'
            : 'bg-gradient-to-br from-[#181818] via-[#2f2f2f] to-[#181818]'
        }
        `}>
            {/* Header: Fecha y hora */}
            <div className="w-full flex justify-center mb-6">
                <div className="bg-white/80 rounded-xl px-3 py-2 sm:px-6 sm:py-2 shadow flex flex-col items-center gap-1 sm:flex-row sm:gap-4">
                    <span className="text-sm sm:text-base font-semibold text-gray-700">
                        {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="hidden sm:inline text-gray-400">|</span>
                    <span className="text-xs sm:text-base text-gray-500">
                        {currentTime.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>

            {/* CARD CENTRAL */}
            <div className="
                relative flex flex-col items-center justify-center
                bg-white/80 shadow-2xl rounded-2xl
                w-full max-w-xs sm:max-w-lg md:max-w-xl lg:max-w-2xl
                px-4 py-6 sm:px-12 sm:py-10
                mx-auto
            ">
                {/* Partículas */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    {particles.map((particle) => (
                        <div
                            key={particle.id}
                            className="absolute animate-float"
                            style={{
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                animationDelay: `${particle.delay}s`,
                                animationDuration: `${particle.duration}s`,
                                filter: isOpen ? 'blur(0px)' : 'blur(1px)'
                            }}
                        >
                            <div
                                className="rounded-full opacity-60 animate-pulse"
                                style={{
                                    width: `${particle.size}px`,
                                    height: `${particle.size}px`,
                                    background: `radial-gradient(circle, ${particle.color}, transparent)`,
                                    boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Estado */}
                <div className="relative z-10 flex flex-col items-center w-full mb-4">
                    <div className="flex items-center justify-center mb-2">
                        {isOpen ? (
                            <Sun className="w-14 h-14 text-yellow-300 drop-shadow-xl animate-spin-slow" />
                        ) : (
                            <Moon className="w-14 h-14 text-blue-400 animate-pulse" />
                        )}
                    </div>
                    <h1 className={`text-2xl sm:text-3xl md:text-4xl font-black mb-2 text-center ${isOpen ? 'text-[#181818]' : 'text-gray-700'}`}>
                        {restaurant.name}
                    </h1>
                    <div className={`text-lg sm:text-xl font-bold mb-4 transition-all ${isOpen ? 'text-[#f89b01]' : 'text-gray-400'}`}>
                        {isOpen ? (
                            <span className="flex items-center gap-2 justify-center">
                                RESTAURANTE ABIERTO
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 justify-center">
                                RESTAURANTE CERRADO
                            </span>
                        )}
                    </div>
                </div>

                {/* Botón principal */}
                <div className="relative z-10 w-full flex justify-center mb-6">
                    <button
                        onClick={handleStatusToggle}
                        disabled={statusChanging}
                        className={`
                            w-full sm:w-80 h-14 sm:h-16 rounded-full font-black text-base sm:text-xl flex items-center justify-center transition-all duration-400 shadow-md
                            ${isOpen
                            ? 'bg-gradient-to-r from-[#f89b01] to-[#ffb933] text-white hover:shadow-[0_0_0_4px_#f89b0122]'
                            : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 hover:shadow-[0_0_0_4px_#c7c7c7aa]'}
                            ${statusChanging ? 'opacity-60' : ''}
                        `}
                        style={{
                            letterSpacing: 2,
                            boxShadow: isOpen
                                ? '0 6px 24px 0 #f89b0177'
                                : '0 6px 24px 0 #b0b0b040'
                        }}
                    >
                        {statusChanging ? 'CAMBIANDO...' : isOpen ? 'CERRAR' : 'ABRIR'}
                        <span className="ml-4">
                            {isOpen
                                ? <DoorOpen className="inline w-8 h-8 text-white" />
                                : <DoorClosed className="inline w-8 h-8 text-gray-500" />
                            }
                        </span>
                    </button>
                </div>

                {/* Estadísticas */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl py-4 flex flex-col items-center">
                        <Users className={`w-6 h-6 mb-2 ${isOpen ? 'text-[#f89b01]' : 'text-gray-400'}`} />
                        <span className={`text-sm font-semibold ${isOpen ? 'text-[#181818]' : 'text-gray-400'}`}>{isOpen ? "Disponible" : "No disponible"}</span>
                        <span className="text-xs text-gray-400">Para pedidos</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl py-4 flex flex-col items-center">
                        <TrendingUp className={`w-6 h-6 mb-2 ${isOpen ? 'text-[#f89b01]' : 'text-gray-400'}`} />
                        <span className={`text-sm font-semibold ${isOpen ? 'text-[#181818]' : 'text-gray-400'}`}>{timeStats.totalSwitches}</span>
                        <span className="text-xs text-gray-400">Cambios de estado</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl py-4 flex flex-col items-center">
                        <Heart className={`w-6 h-6 mb-2 ${isOpen ? 'text-[#f89b01]' : 'text-gray-400'}`} />
                        <span className={`text-sm font-semibold ${isOpen ? 'text-[#181818]' : 'text-gray-400'}`}>{isOpen ? "Activo" : "Inactivo"}</span>
                        <span className="text-xs text-gray-400">Estado actual</span>
                    </div>
                </div>

                {/* Animaciones */}
                <style jsx>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
                        50% { transform: translateY(-30px) rotate(180deg); opacity: 1; }
                    }
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-float {
                        animation: float 8s ease-in-out infinite;
                    }
                    .animate-spin-slow {
                        animation: spin-slow 10s linear infinite;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default AdminHome;