import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Users, Building2, MapPin, Grape, FileText,
    TrendingUp, DollarSign, RefreshCw, AlertCircle,
    Search, ChevronRight, Store, ShoppingBag, ArrowUpRight, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// ─── Interfaces ──────────────────────────────────────────────────
interface Restaurant {
    id: number;
    name: string;
    description: string;
    status: 'OPEN' | 'CLOSED';
    imageBase64?: string;
    zone?: { id: number; name: string };
}

interface DashboardStats {
    totalRestaurants: number;
    openRestaurants: number;
    closedRestaurants: number;
    totalUsers: number;
    totalZones: number;
    totalOrders: number;
    totalOrdersToday: number;
    totalRevenueToday: number;
    recentRestaurants: Restaurant[];
}

// Pedido tal como lo entrega GET /orders/restaurant/{id}
interface OrderSummary {
    status?: string;
    total?: number | string;
    createdAt?: string;
}

// ─── Tarjeta KPI Castillo (Sin Verde - Solo Dorado, Negro y Ámbar) 
interface CastilloKpiProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ElementType;
    badgeText?: string;
    variant: 'gold' | 'charcoal' | 'amber';
    loading: boolean;
}

const CastilloKpi: React.FC<CastilloKpiProps> = ({
    title, value, subtitle, icon: Icon, badgeText, variant, loading
}) => {
    const variantStyles = {
        gold: {
            border: 'border-[#f89b01]/30 hover:border-[#f89b01]',
            iconBg: 'bg-[#f89b01] text-[#181818]',
            badge: 'bg-[#f89b01]/10 text-[#f89b01] border-[#f89b01]/30',
            glow: 'from-[#f89b01]/15',
        },
        charcoal: {
            border: 'border-slate-300 hover:border-[#181818]',
            iconBg: 'bg-[#181818] text-[#f89b01]',
            badge: 'bg-slate-100 text-[#181818] border-slate-300',
            glow: 'from-slate-400/15',
        },
        amber: {
            border: 'border-amber-300 hover:border-amber-500',
            iconBg: 'bg-amber-500 text-white',
            badge: 'bg-amber-50 text-amber-800 border-amber-300',
            glow: 'from-amber-400/15',
        },
    };

    const style = variantStyles[variant];

    return (
        <div className={`relative overflow-hidden bg-white rounded-3xl p-6 sm:p-7 border ${style.border} shadow-sm hover:shadow-lg transition-all duration-300 group`}>
            <div className={`absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-gradient-to-br ${style.glow} to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none`} />

            <div className="flex items-center justify-between relative z-10">
                <span className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider">
                    {title}
                </span>
                <div className={`p-3 sm:p-3.5 rounded-2xl ${style.iconBg} font-bold shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between relative z-10">
                {loading ? (
                    <div className="h-10 w-24 bg-slate-100 rounded-xl animate-pulse" />
                ) : (
                    <span className="text-3xl sm:text-4xl font-black text-[#181818] tracking-tight">
                        {value}
                    </span>
                )}

                {badgeText && (
                    <span className={`text-xs font-black px-3 py-1 rounded-full border ${style.badge}`}>
                        {badgeText}
                    </span>
                )}
            </div>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 font-semibold relative z-10">
                {subtitle}
            </p>
        </div>
    );
};

// ─── Componente Principal Dashboard Sin Verde ──────────────────
const OwnerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalRestaurants: 0,
        openRestaurants: 0,
        closedRestaurants: 0,
        totalUsers: 0,
        totalZones: 0,
        totalOrders: 0,
        totalOrdersToday: 0,
        totalRevenueToday: 0,
        recentRestaurants: [],
    });
    const [ordersSynced, setOrdersSynced] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

            const [restaurantsRes, usersRes, zonesRes] = await Promise.allSettled([
                axios.get('/restaurants', { headers: authHeader })
                    .catch(() => axios.get('/restaurants/public')),
                api.get('/users/all', { params: { page: 0, size: 1000 } }),
                axios.get('/zones', { headers: authHeader }),
            ]);

            const restaurants: Restaurant[] = restaurantsRes.status === 'fulfilled'
                ? (restaurantsRes.value.data ?? []) : [];

            const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : null;
            const users: unknown[] = Array.isArray(usersData)
                ? usersData
                : (usersData?.content ?? []);

            const zones: unknown[] = zonesRes.status === 'fulfilled'
                ? (zonesRes.value.data ?? []) : [];

            const openCount = restaurants.filter(r => r.status === 'OPEN').length;
            const closedCount = restaurants.filter(r => r.status === 'CLOSED').length;

            // Pedidos de cada unidad, con la misma fuente que el reporte ejecutivo
            const ordersByRestaurant = await Promise.allSettled(
                restaurants.map(r => axios.get(`/orders/restaurant/${r.id}`, { headers: authHeader }))
            );
            const orders: OrderSummary[] = ordersByRestaurant.flatMap(res =>
                res.status === 'fulfilled' && Array.isArray(res.value.data) ? res.value.data : []
            );
            const todayStr = new Date().toDateString();
            // Las ventas del dia excluyen los pedidos cancelados, que no generan ingreso
            const todayOrders = orders.filter(o =>
                o.status !== 'CANCELLED' && !!o.createdAt && new Date(o.createdAt).toDateString() === todayStr
            );
            const revenueToday = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

            setOrdersSynced(ordersByRestaurant.every(res => res.status === 'fulfilled'));
            setStats({
                totalRestaurants: restaurants.length,
                openRestaurants: openCount,
                closedRestaurants: closedCount,
                totalUsers: users.length,
                totalZones: zones.length,
                totalOrders: orders.length,
                totalOrdersToday: todayOrders.length,
                totalRevenueToday: revenueToday,
                recentRestaurants: restaurants,
            });
            setLastUpdated(new Date());
        } catch (err) {
            setError('Error al sincronizar datos con el servidor.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const filteredRestaurants = stats.recentRestaurants.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-slate-50/70 p-6 sm:p-8 lg:p-10 space-y-8 font-sans">
            {/* Header del Castillo (Sin Verde) */}
            <div className="bg-white p-7 sm:p-8 rounded-3xl border border-[#f89b01]/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#f89b01]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f89b01]">
                        <Crown className="h-4.5 w-4.5 text-[#f89b01]" />
                        <span>Club Castillo de Amaguaña</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[#181818]">Panel de Control</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-[#181818] tracking-tight">
                        Panel General de Administración
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 font-semibold max-w-xl">
                        Supervisión operativa en tiempo real de restaurantes, usuarios y estado financiero.
                    </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap relative z-10">
                    <button
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="inline-flex items-center gap-2.5 bg-white border border-[#f89b01]/40 hover:border-[#f89b01] text-[#181818] px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 text-[#f89b01] ${loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar Datos</span>
                    </button>

                    <div className="inline-flex items-center gap-2.5 bg-[#181818] text-[#f89b01] border border-[#f89b01]/40 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f89b01] animate-pulse" />
                        <span>Sistema Activo</span>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                            <span className="font-bold">{error}</span>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="font-black underline hover:no-underline text-xs sm:text-sm"
                        >
                            Reintentar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid de 4 Métricas (Dorado, Negro, Ámbar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <CastilloKpi
                    title="Total Restaurantes"
                    value={stats.totalRestaurants}
                    subtitle={`${stats.openRestaurants} abiertos · ${stats.closedRestaurants} cerrados`}
                    icon={Building2}
                    badgeText={`${stats.openRestaurants} Activos`}
                    variant="gold"
                    loading={loading}
                />

                <CastilloKpi
                    title="Usuarios Registrados"
                    value={stats.totalUsers}
                    subtitle="Socios, admins e invitados"
                    icon={Users}
                    badgeText="Registrados"
                    variant="charcoal"
                    loading={loading}
                />

                <CastilloKpi
                    title="Zonas del Club"
                    value={stats.totalZones}
                    subtitle="Puntos de entrega habilitados"
                    icon={MapPin}
                    badgeText="Operativas"
                    variant="amber"
                    loading={loading}
                />

                <CastilloKpi
                    title="Pedidos Registrados"
                    value={stats.totalOrders}
                    subtitle="Total acumulado en el sistema"
                    icon={TrendingUp}
                    badgeText="En vivo"
                    variant="gold"
                    loading={loading}
                />
            </div>

            {/* Sección Principal: Directorio + Resumen Financiero */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Directorio de Restaurantes (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-[#f89b01]/25 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-[#181818] flex items-center gap-2.5">
                                    <Store className="h-5.5 w-5.5 text-[#f89b01]" />
                                    Restaurantes del Club
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                                    Catálogo oficial de establecimientos gastronómicos
                                </p>
                            </div>

                            {/* Filtros */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar restaurante..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-[#f89b01] text-slate-800 w-40 sm:w-52 font-semibold shadow-sm"
                                    />
                                </div>

                                <div className="flex bg-slate-200/70 p-1 rounded-2xl border border-slate-200">
                                    <button
                                        onClick={() => setStatusFilter('ALL')}
                                        className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                                            statusFilter === 'ALL'
                                                ? 'bg-[#181818] text-[#f89b01] shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('OPEN')}
                                        className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                                            statusFilter === 'OPEN'
                                                ? 'bg-[#f89b01] text-[#181818] shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Abiertos
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('CLOSED')}
                                        className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                                            statusFilter === 'CLOSED'
                                                ? 'bg-slate-700 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Cerrados
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Restaurantes */}
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredRestaurants.length === 0 ? (
                            <div className="p-10 text-center text-sm text-slate-500 font-semibold">
                                No se encontraron restaurantes registrados.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredRestaurants.map((restaurant) => (
                                    <div
                                        key={restaurant.id}
                                        className="p-5 hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            {restaurant.imageBase64 ? (
                                                <img
                                                    src={`data:image/jpeg;base64,${restaurant.imageBase64}`}
                                                    alt={restaurant.name}
                                                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-[#181818] text-[#f89b01] font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm border border-[#f89b01]/30">
                                                    {restaurant.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-black text-sm sm:text-base text-[#181818] group-hover:text-[#f89b01] transition-colors truncate">
                                                    {restaurant.name}
                                                </p>
                                                <p className="text-xs sm:text-sm text-slate-500 truncate font-semibold">
                                                    {restaurant.description || 'Sin descripción asignada'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black border ${
                                                restaurant.status === 'OPEN'
                                                    ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                <span className={`w-2 h-2 rounded-full ${restaurant.status === 'OPEN' ? 'bg-[#f89b01] animate-pulse' : 'bg-slate-400'}`} />
                                                {restaurant.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                                            </span>

                                            <button
                                                onClick={() => navigate('/owner/restaurants')}
                                                className="text-xs sm:text-sm text-[#f89b01] font-black hover:underline inline-flex items-center gap-1"
                                            >
                                                <span>Editar</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                        <button
                            onClick={() => navigate('/owner/restaurants')}
                            className="text-xs sm:text-sm text-[#f89b01] font-black hover:underline inline-flex items-center gap-1"
                        >
                            Gestionar todos los restaurantes <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Resumen Financiero (Sin Verde - Dorado, Negro y Ámbar) */}
                <div className="bg-white rounded-3xl border border-[#f89b01]/30 shadow-md p-6 sm:p-7 flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h2 className="text-base sm:text-lg font-black text-[#181818] flex items-center gap-2">
                                <DollarSign className="h-5.5 w-5.5 text-[#f89b01]" />
                                Resumen Financiero
                            </h2>
                            <span className="text-xs font-black bg-[#f89b01]/10 text-[#f89b01] px-3 py-1 rounded-full border border-[#f89b01]/30">
                                Registro Diario
                            </span>
                        </div>

                        <div className="space-y-4 text-xs sm:text-sm">
                            {/* Ventas del Día - Dorado Oficial */}
                            <div className="p-4 rounded-2xl bg-amber-50/80 border border-[#f89b01]/30 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="bg-[#f89b01] p-2.5 rounded-xl text-[#181818] shadow-sm font-bold">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm">Ventas del Día</p>
                                        <p className="text-xs text-slate-500 font-semibold">Todas las zonas del club</p>
                                    </div>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-[#f89b01]">
                                    ${stats.totalRevenueToday.toFixed(2)}
                                </span>
                            </div>

                            {/* Pedidos del Día - Negro Institucional */}
                            <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-300/80 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="bg-[#181818] p-2.5 rounded-xl text-[#f89b01] shadow-sm font-bold">
                                        <ShoppingBag className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm">Pedidos del Día</p>
                                        <p className="text-xs text-slate-500 font-semibold">Órdenes registradas</p>
                                    </div>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-[#181818]">
                                    {stats.totalOrdersToday}
                                </span>
                            </div>

                            {/* Promedio por Pedido - Ámbar Dorado */}
                            <div className="p-4 rounded-2xl bg-amber-100/60 border border-amber-300 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-sm font-bold">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm">Promedio por Pedido</p>
                                        <p className="text-xs text-slate-500 font-semibold">Ticket promedio</p>
                                    </div>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-amber-700">
                                    ${stats.totalOrdersToday > 0 ? (stats.totalRevenueToday / stats.totalOrdersToday).toFixed(2) : '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                        <span>Estado de transacciones</span>
                        {ordersSynced ? (
                            <span className="font-black text-[#f89b01] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#f89b01] animate-pulse" />
                                Sincronizado
                            </span>
                        ) : (
                            <span className="font-black text-red-600 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-600" />
                                Pedidos incompletos
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Accesos Directos (Sin Verde) */}
            <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-black text-[#181818] flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#f89b01]" />
                    Módulos Administrativos
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <motion.button
                        whileHover={{ y: -4 }}
                        onClick={() => navigate('/owner/restaurants')}
                        className="p-5 sm:p-6 rounded-3xl bg-white border border-[#f89b01]/30 hover:border-[#f89b01] shadow-md hover:shadow-lg transition-all text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-amber-50 text-[#f89b01] font-bold group-hover:scale-110 transition-transform shadow-sm">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-extrabold text-sm sm:text-base text-[#181818] group-hover:text-[#f89b01] transition-colors">
                                    Restaurantes
                                </p>
                                <p className="text-xs text-slate-500 font-semibold">
                                    Gestión de catálogo
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-[#f89b01] group-hover:translate-x-0.5 transition-all" />
                    </motion.button>

                    <motion.button
                        whileHover={{ y: -4 }}
                        onClick={() => navigate('/owner/zones')}
                        className="p-5 sm:p-6 rounded-3xl bg-white border border-[#f89b01]/30 hover:border-[#181818] shadow-md hover:shadow-lg transition-all text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-slate-100 text-[#181818] font-bold group-hover:scale-110 transition-transform shadow-sm">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-extrabold text-sm sm:text-base text-[#181818] transition-colors">
                                    Zonas del Club
                                </p>
                                <p className="text-xs text-slate-500 font-semibold">
                                    Puntos de entrega
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-[#181818] group-hover:translate-x-0.5 transition-all" />
                    </motion.button>

                    <motion.button
                        whileHover={{ y: -4 }}
                        onClick={() => navigate('/owner/beverages')}
                        className="p-5 sm:p-6 rounded-3xl bg-white border border-[#f89b01]/30 hover:border-amber-500 shadow-md hover:shadow-lg transition-all text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-700 font-bold group-hover:scale-110 transition-transform shadow-sm">
                                <Grape className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-extrabold text-sm sm:text-base text-[#181818] group-hover:text-amber-700 transition-colors">
                                    Bebidas
                                </p>
                                <p className="text-xs text-slate-500 font-semibold">
                                    Catálogo de productos
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                    </motion.button>

                    <motion.button
                        whileHover={{ y: -4 }}
                        onClick={() => navigate('/owner/users')}
                        className="p-5 sm:p-6 rounded-3xl bg-white border border-[#f89b01]/30 hover:border-[#181818] shadow-md hover:shadow-lg transition-all text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-slate-100 text-[#181818] font-bold group-hover:scale-110 transition-transform shadow-sm">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-extrabold text-sm sm:text-base text-[#181818] transition-colors">
                                    Usuarios & Roles
                                </p>
                                <p className="text-xs text-slate-500 font-semibold">
                                    Control de accesos
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-[#181818] group-hover:translate-x-0.5 transition-all" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;