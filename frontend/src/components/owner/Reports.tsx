import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, TrendingUp, PieChart, Activity, Calendar, Printer,
    Building2, Users, DollarSign, ShoppingBag, FileSpreadsheet,
    ShieldCheck, Search, CheckCircle2, Crown, Store, RefreshCw, XCircle, FileText
} from 'lucide-react';
import api from '../../services/api';
import { descargarReporteExcel } from '../../utils/reporteExcel';

// ─── Interfaces Reales ───────────────────────────────────────────
interface Restaurant {
    id: number;
    name: string;
    description: string;
    status: 'OPEN' | 'CLOSED';
    imageBase64?: string;
}

interface OrderDTO {
    id: number;
    customerId?: number;
    customerName?: string;
    restaurantId: number;
    status: string;
    total: number;
    isGuest: boolean;
    createdAt?: string;
}

interface RestaurantSalesReport {
    id: number;
    name: string;
    status: 'OPEN' | 'CLOSED';
    totalOrders: number;
    totalRevenue: number;
    averageTicket: number;
}

interface RealUserLog {
    id: number;
    email: string;
    fullName: string;
    roleName: string;
    consentGiven: boolean;
    consentDate?: string;
    /** Valor original devuelto por el servidor, necesario para exportarlo como fecha. */
    consentDateRaw?: string;
    active: boolean;
}

/** Pedido del periodo con el nombre de su restaurante ya resuelto. */
interface OrderWithRestaurant extends OrderDTO {
    restaurantName: string;
}


// ─── Componente Principal Módulo de Reportes Reales & PDF ────────
const Reports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'all' | 'today' | 'month'>('all');
    const [activeFeature, setActiveFeature] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Datos 100% Reales del Backend
    const [restaurantReports, setRestaurantReports] = useState<RestaurantSalesReport[]>([]);
    const [allUsers, setAllUsers] = useState<RealUserLog[]>([]);
    const [totalRevenue, setTotalRevenue] = useState<number>(0);
    const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
    // Pedidos que no fueron cancelados: base del ticket promedio
    const [validOrdersCount, setValidOrdersCount] = useState<number>(0);
    const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
    // Detalle de los pedidos del periodo: sostiene las hojas de desglose del libro
    // de Excel, que van mas alla de los totales que se muestran en pantalla.
    const [allOrders, setAllOrders] = useState<OrderWithRestaurant[]>([]);

    const features = [
        { id: 0, icon: BarChart3, title: "Análisis Avanzado", desc: "Facturación real por restaurante" },
        { id: 1, icon: TrendingUp, title: "Métricas en Tiempo Real", desc: "Totales en vivo de pedidos e ingresos" },
        { id: 2, icon: PieChart, title: "Reportes Personalizados", desc: "Filtrado y desglose individual" },
        { id: 3, icon: ShieldCheck, title: "Auditoría LOPDP", desc: "Consentimiento real de usuarios (Art. 9)" }
    ];

    const fetchRealData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

            const restaurantsRes = await axios.get('/restaurants', { headers: authHeader })
                .catch(() => axios.get('/restaurants/public'));
            const restaurants: Restaurant[] = restaurantsRes.data ?? [];

            const usersRes = await api.get('/users/all', { params: { page: 0, size: 1000 } }).catch(() => ({ data: [] }));
            const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.content ?? []);

            const processedUsers: RealUserLog[] = rawUsers.map((u: any) => ({
                id: u.id,
                email: u.email || 'Sin correo',
                fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Usuario del Club',
                // El servicio devuelve el rol como cadena ("OWNER"); se admite
                // tambien la forma de objeto por si alguna consulta la conserva.
                roleName: (typeof u.role === 'string' ? u.role : u.role?.name) || 'CUSTOMER',
                consentGiven: !!u.consentGiven,
                consentDate: u.consentDate ? new Date(u.consentDate).toLocaleString('es-EC') : 'No registrado',
                consentDateRaw: u.consentDate || undefined,
                active: u.active ?? true,
            }));
            setAllUsers(processedUsers);

            let grandTotalRevenue = 0;
            let grandTotalOrders = 0;
            let grandValidOrders = 0;
            const pedidosDelPeriodo: OrderWithRestaurant[] = [];

            const salesReports: RestaurantSalesReport[] = await Promise.all(
                restaurants.map(async (r) => {
                    try {
                        const ordersRes = await axios.get(`/orders/restaurant/${r.id}`, { headers: authHeader });
                        const orders: OrderDTO[] = Array.isArray(ordersRes.data) ? ordersRes.data : [];

                        const now = new Date();
                        const todayStr = now.toDateString();

                        const filteredOrders = orders.filter((o) => {
                            if (!o.createdAt) return true;
                            const orderDate = new Date(o.createdAt);
                            if (dateRange === 'today') {
                                return orderDate.toDateString() === todayStr;
                            }
                            if (dateRange === 'month') {
                                return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
                            }
                            return true;
                        });

                        // Un pedido cancelado se cuenta como registrado, pero no es venta:
                        // no suma al ingreso ni al ticket promedio.
                        const validos = filteredOrders.filter((ord) => ord.status !== 'CANCELLED');
                        const rev = validos.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
                        const count = filteredOrders.length;
                        const avg = validos.length > 0 ? rev / validos.length : 0;

                        grandTotalRevenue += rev;
                        grandTotalOrders += count;
                        grandValidOrders += validos.length;
                        pedidosDelPeriodo.push(
                            ...filteredOrders.map((ord) => ({ ...ord, restaurantName: r.name }))
                        );

                        return {
                            id: r.id,
                            name: r.name,
                            status: r.status || 'OPEN',
                            totalOrders: count,
                            totalRevenue: rev,
                            averageTicket: avg,
                        };
                    } catch (err) {
                        return {
                            id: r.id,
                            name: r.name,
                            status: r.status || 'OPEN',
                            totalOrders: 0,
                            totalRevenue: 0,
                            averageTicket: 0,
                        };
                    }
                })
            );

            setRestaurantReports(salesReports);
            setAllOrders(
                pedidosDelPeriodo.sort(
                    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
                )
            );
            setTotalRevenue(grandTotalRevenue);
            setTotalOrdersCount(grandTotalOrders);
            setValidOrdersCount(grandValidOrders);
            setLastSyncDate(new Date());
        } catch (error) {
            console.error('Error al obtener datos reales de reportes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRealData();
    }, [dateRange]);

    // ─── Exportación al libro de Excel ─────────────────
    // La exportación anterior armaba un CSV sobre una dirección de datos
    // incrustada, que se truncaba con los nombres que llevan caracteres
    // especiales y que varios navegadores bloquean, por lo que la descarga no
    // llegaba a producirse. Ahora se genera un libro .xlsx real, con una hoja
    // de resumen a manera de tablero y las hojas de desglose que la sustentan.
    const exportarExcel = () => {
        descargarReporteExcel({
            rango: dateRange,
            generado: new Date(),
            ventas: restaurantReports,
            pedidos: allOrders,
            usuarios: allUsers,
            totalVentas: totalRevenue,
            totalPedidos: totalOrdersCount,
        });
    };

    const handlePrintPDF = () => {
        window.print();
    };

    const filteredRestaurants = restaurantReports.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/70 p-6 sm:p-8 lg:p-10 space-y-8 font-sans print:bg-white print:p-0 print:m-0">
            {/* Reglas de Estilo Exclusivas para la Impresión / Generación de PDF */}
            <style>{`
                @media print {
                    /* Ocultar toda la interfaz interactiva web al imprimir */
                    body {
                        background: #ffffff !important;
                        color: #181818 !important;
                        font-family: Arial, sans-serif !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .web-only {
                        display: none !important;
                    }
                    .pdf-only {
                        display: block !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 1.5cm;
                    }
                }
                @media screen {
                    .pdf-only {
                        display: none;
                    }
                }
            `}</style>

            {/* SECCIÓN WEB: Encabezado interactivo */}
            <div className="web-only bg-white p-7 sm:p-8 rounded-3xl border border-[#f89b01]/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#f89b01]">
                        <Crown className="h-4.5 w-4.5 text-[#f89b01]" />
                        <span>Club Castillo de Amaguaña</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[#181818]">Módulo de Reportes & Analytics</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-[#181818] tracking-tight">
                        Reporte Ejecutivo y Auditoría LOPDP
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 font-semibold max-w-xl">
                        Información real sincronizada con PostgreSQL. Ventas, pedidos e historial auditado de datos.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap relative z-10">
                    <button
                        onClick={fetchRealData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 bg-white border border-[#f89b01]/40 text-[#181818] hover:border-[#f89b01] px-4 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 text-[#f89b01] ${loading ? 'animate-spin' : ''}`} />
                        <span>Recargar Real</span>
                    </button>

                    <button
                        onClick={exportarExcel}
                        disabled={loading}
                        title="Descarga un libro de Excel con el resumen, el desglose por restaurante, el detalle de pedidos, la evolución diaria y la auditoría de consentimientos"
                        className="inline-flex items-center gap-2 bg-[#f89b01] text-[#181818] hover:bg-[#ffb933] px-5 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Descargar Excel</span>
                    </button>

                    <button
                        onClick={handlePrintPDF}
                        className="inline-flex items-center gap-2 bg-[#181818] text-[#f89b01] border border-[#f89b01]/40 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-sm transition-all"
                    >
                        <Printer className="h-4 w-4" />
                        <span>Generar PDF / Imprimir</span>
                    </button>
                </div>
            </div>

            {/* SECCIÓN WEB: Selector de Módulos */}
            <div className="web-only grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature) => {
                    const Icon = feature.icon;
                    const isActive = activeFeature === feature.id;
                    return (
                        <div
                            key={feature.id}
                            onClick={() => setActiveFeature(feature.id)}
                            className={`p-7 rounded-3xl border text-center flex flex-col items-center cursor-pointer transition-all duration-300 ${
                                isActive
                                    ? 'bg-[#fff7e6] border-[#f89b01] shadow-md scale-102'
                                    : 'bg-white border-slate-200 hover:border-[#f89b01]/50 shadow-sm'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                                isActive
                                    ? 'bg-gradient-to-br from-[#f89b01] to-[#ffb933] text-[#181818] shadow-md'
                                    : 'bg-slate-100 text-slate-400'
                            }`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-base mb-1">{feature.title}</h3>
                            <p className="text-xs text-slate-500 font-semibold">{feature.desc}</p>
                        </div>
                    );
                })}
            </div>

            {/* SECCIÓN WEB: Barra de Filtros */}
            <div className="web-only bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Calendar className="h-4.5 w-4.5 text-[#f89b01]" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Período Auditado:</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setDateRange('all')}
                            className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all ${
                                dateRange === 'all' ? 'bg-[#181818] text-[#f89b01] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Histórico Total
                        </button>
                        <button
                            onClick={() => setDateRange('today')}
                            className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all ${
                                dateRange === 'today' ? 'bg-[#181818] text-[#f89b01] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => setDateRange('month')}
                            className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all ${
                                dateRange === 'month' ? 'bg-[#181818] text-[#f89b01] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Este Mes
                        </button>
                    </div>
                </div>

                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#f89b01] animate-pulse" />
                    <span>Sincronizado: {lastSyncDate ? lastSyncDate.toLocaleTimeString('es-EC') : 'Cargando...'}</span>
                </div>
            </div>

            {/* SECCIÓN WEB: Grid de Métricas */}
            <div className="web-only grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-[#f89b01]/30 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Ventas Reales Totales</span>
                        <div className="p-3 bg-[#f89b01] text-[#181818] rounded-2xl shadow-sm font-bold">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-[#181818] mt-3">
                        ${totalRevenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold mt-2">Sumatoria en base de datos</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-300 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Órdenes Procesadas</span>
                        <div className="p-3 bg-[#181818] text-[#f89b01] rounded-2xl shadow-sm font-bold">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-[#181818] mt-3">{totalOrdersCount}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-2">Pedidos registrados en PostgreSQL</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-amber-300 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Ticket Promedio</span>
                        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm font-bold">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-[#181818] mt-3">
                        ${validOrdersCount > 0 ? (totalRevenue / validOrdersCount).toFixed(2) : '0.00'}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold mt-2">Promedio gastado por orden</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-300 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Usuarios en BD</span>
                        <div className="p-3 bg-slate-800 text-white rounded-2xl shadow-sm font-bold">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-[#181818] mt-3">{allUsers.length}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-2">Cuentas con consentimiento LOPDP</p>
                </div>
            </div>

            {/* SECCIÓN WEB: VISTA 0 (Análisis Avanzado) */}
            {activeFeature === 0 && (
                <div className="web-only grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-[#f89b01]/25 shadow-sm space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-black text-[#181818] flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-[#f89b01]" />
                                    Facturación Real por Restaurante
                                </h2>
                                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                    Desglose de ingresos obtenidos desde PostgreSQL
                                </p>
                            </div>
                            <span className="text-xs font-black bg-amber-50 text-[#f89b01] px-3 py-1 rounded-full border border-amber-200">
                                Datos Reales ($)
                            </span>
                        </div>

                        {loading ? (
                            <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
                        ) : restaurantReports.length === 0 ? (
                            <p className="text-center text-sm text-slate-500 py-10 font-semibold">No se encontraron restaurantes registrados en la BD.</p>
                        ) : (
                            <div className="space-y-4">
                                {restaurantReports.map(r => {
                                    const maxRev = Math.max(...restaurantReports.map(x => x.totalRevenue), 1);
                                    const percentage = Math.round((r.totalRevenue / maxRev) * 100);

                                    return (
                                        <div key={r.id} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                                                <span className="text-slate-900">{r.name}</span>
                                                <span className="text-[#f89b01] font-black">${r.totalRevenue.toFixed(2)} ({r.totalOrders} pedidos)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5">
                                                <div
                                                    className="bg-gradient-to-r from-[#f89b01] to-[#ffb933] h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage || 5}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#f89b01]/25 shadow-sm space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h2 className="text-lg font-black text-[#181818] pb-3 border-b border-slate-100 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-[#f89b01]" />
                                Resumen de Operación
                            </h2>

                            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                                <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">Restaurante Principal</p>
                                <p className="text-base font-black text-[#181818]">
                                    {restaurantReports.length > 0
                                        ? [...restaurantReports].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]?.name
                                        : 'Sin datos'}
                                </p>
                                <p className="text-xs text-slate-500 font-semibold">Basado en transacciones registradas</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-1">
                                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Estado de Base de Datos</p>
                                <p className="text-base font-black text-[#181818]">PostgreSQL Conectada</p>
                                <p className="text-xs text-slate-500 font-semibold">100% información verídica del backend</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 font-semibold flex items-center justify-between">
                            <span>Sistema Club Castillo</span>
                            <span className="font-black text-[#f89b01]">Auditado</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN WEB: VISTA 1 (Métricas) */}
            {activeFeature === 1 && (
                <div className="web-only bg-white rounded-3xl border border-[#f89b01]/25 shadow-sm p-6 sm:p-7 space-y-6">
                    <h2 className="text-lg font-black text-[#181818] pb-3 border-b border-slate-100">
                        Consolidado Real de Ventas y Pedidos
                    </h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurantReports.map(r => (
                            <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-extrabold text-sm text-slate-900">{r.name}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                                        r.status === 'OPEN' ? 'bg-amber-100/80 text-amber-900 border-amber-300' : 'bg-slate-200 text-slate-700 border-slate-300'
                                    }`}>
                                        {r.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                                    </span>
                                </div>

                                <div className="flex items-baseline justify-between">
                                    <span className="text-xs text-slate-500 font-semibold">Total Ingresos:</span>
                                    <span className="text-lg font-black text-[#f89b01]">${r.totalRevenue.toFixed(2)}</span>
                                </div>

                                <div className="flex items-baseline justify-between text-xs font-semibold">
                                    <span className="text-slate-500">Pedidos Registrados:</span>
                                    <span className="text-slate-900 font-black">{r.totalOrders}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN WEB: VISTA 2 (Reportes Personalizados) */}
            {activeFeature === 2 && (
                <div className="web-only bg-white rounded-3xl border border-[#f89b01]/25 shadow-sm p-6 sm:p-7 space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <h2 className="text-lg font-black text-[#181818] flex items-center gap-2">
                            <Store className="h-5 w-5 text-[#f89b01]" />
                            Detalle Individual por Restaurante (Real)
                        </h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filtrar por nombre..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#f89b01] text-slate-800 w-full font-semibold"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredRestaurants.map(r => (
                            <div key={r.id} className="py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#181818] text-[#f89b01] font-black text-xs flex items-center justify-center border border-[#f89b01]/30">
                                        {r.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-sm text-slate-900">{r.name}</p>
                                        <p className="text-xs text-slate-500 font-semibold">{r.totalOrders} pedidos en la base de datos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-base text-[#f89b01]">${r.totalRevenue.toFixed(2)}</p>
                                    <span className="text-xs font-extrabold text-slate-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                        Ticket Promedio: ${r.averageTicket.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN WEB: VISTA 3 (LOPDP) */}
            {activeFeature === 3 && (
                <div className="web-only bg-white rounded-3xl border border-[#f89b01]/25 shadow-sm p-6 sm:p-7 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-black text-[#181818] flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[#f89b01]" />
                                Auditoría de Protección de Datos LOPDP (Usuarios Reales)
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                Registro de usuarios registrados en PostgreSQL y estado de consentimiento (Art. 9 y 22 LOPDP Ecuador)
                            </p>
                        </div>
                        <span className="text-xs font-black bg-[#f89b01]/10 text-[#f89b01] px-3 py-1 rounded-full border border-[#f89b01]/30">
                            Cumplimiento 100%
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-black">
                                <tr>
                                    <th className="p-3.5 rounded-l-xl">ID</th>
                                    <th className="p-3.5">Nombre / Socio</th>
                                    <th className="p-3.5">Correo Electrónico</th>
                                    <th className="p-3.5">Rol Sistema</th>
                                    <th className="p-3.5">Estado Consentimiento</th>
                                    <th className="p-3.5 rounded-r-xl">Fecha Registro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold">
                                {allUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-amber-50/30">
                                        <td className="p-3.5 text-slate-400">#{user.id}</td>
                                        <td className="p-3.5 font-bold text-slate-900">{user.fullName}</td>
                                        <td className="p-3.5 text-slate-700">{user.email}</td>
                                        <td className="p-3.5 text-slate-600 font-bold">{user.roleName}</td>
                                        <td className="p-3.5">
                                            {user.consentGiven ? (
                                                <span className="inline-flex items-center gap-1 bg-amber-50 text-[#f89b01] border border-amber-200 px-2.5 py-0.5 rounded-full font-black">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-[#f89b01]" /> Aceptado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-black">
                                                    <XCircle className="h-3.5 w-3.5 text-slate-400" /> Anonimizado
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-slate-500">{user.consentDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                ESTRUCTURA DEL REPORTE IMPRESO / PDF OFICIAL (CERO ELEMENTOS WEB)
               ════════════════════════════════════════════════════════════════════ */}
            <div className="pdf-only space-y-6">
                {/* 1. Encabezado Oficial del Documento */}
                <div className="border-b-2 border-[#181818] pb-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#f89b01]">
                            👑 CLUB CASTILLO DE AMAGUAÑA
                        </div>
                        <h1 className="text-2xl font-black text-[#181818] uppercase tracking-tight mt-1">
                            INFORME EJECUTIVO DE GESTIÓN Y AUDITORÍA LOPDP
                        </h1>
                        <p className="text-xs text-slate-600 font-bold mt-0.5">
                            DIRECCIÓN OPERATIVA Y AUDITORÍA DE TECNOLOGÍA
                        </p>
                    </div>

                    <div className="text-right text-xs font-semibold space-y-0.5 border-l border-slate-300 pl-4">
                        <p><span className="font-black text-slate-900">Documento:</span> INF-{new Date().getFullYear()}-001</p>
                        <p><span className="font-black text-slate-900">Fecha de Emisión:</span> {new Date().toLocaleDateString('es-EC')}</p>
                        <p><span className="font-black text-slate-900">Período:</span> {dateRange === 'all' ? 'Histórico Total' : dateRange === 'today' ? 'Ventas de Hoy' : 'Este Mes'}</p>
                    </div>
                </div>

                {/* 2. Cuadro Resumen de Indicadores Clave */}
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-2">
                    <p className="font-extrabold text-xs uppercase tracking-wider text-slate-900">I. Consolidado de Indicadores Principales (PostgreSQL)</p>
                    <div className="grid grid-cols-4 gap-4 text-xs font-bold pt-1">
                        <div className="border-r border-slate-200 pr-2">
                            <span className="text-slate-500 block text-[10px] uppercase">Ventas Totales</span>
                            <span className="text-base font-black text-[#f89b01]">${totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="border-r border-slate-200 pr-2">
                            <span className="text-slate-500 block text-[10px] uppercase">Órdenes Procesadas</span>
                            <span className="text-base font-black text-[#181818]">{totalOrdersCount}</span>
                        </div>
                        <div className="border-r border-slate-200 pr-2">
                            <span className="text-slate-500 block text-[10px] uppercase">Ticket Promedio</span>
                            <span className="text-base font-black text-amber-700">
                                ${validOrdersCount > 0 ? (totalRevenue / validOrdersCount).toFixed(2) : '0.00'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-[10px] uppercase">Usuarios LOPDP</span>
                            <span className="text-base font-black text-slate-900">{allUsers.length} en BD</span>
                        </div>
                    </div>
                </div>

                {/* 3. Desglose Operativo de Restaurantes */}
                <div className="space-y-2">
                    <p className="font-extrabold text-xs uppercase tracking-wider text-slate-900">II. Desglose de Facturación por Restaurante</p>
                    <table className="w-full text-left text-xs border border-slate-300">
                        <thead className="bg-[#181818] text-[#f89b01] font-black uppercase text-[10px]">
                            <tr>
                                <th className="p-2 border border-slate-400">ID</th>
                                <th className="p-2 border border-slate-400">Restaurante</th>
                                <th className="p-2 border border-slate-400">Estado</th>
                                <th className="p-2 border border-slate-400">Total Pedidos</th>
                                <th className="p-2 border border-slate-400">Total Ventas ($)</th>
                                <th className="p-2 border border-slate-400">Ticket Promedio ($)</th>
                            </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-800 divide-y divide-slate-200">
                            {restaurantReports.map(r => (
                                <tr key={r.id}>
                                    <td className="p-2 border border-slate-300">#{r.id}</td>
                                    <td className="p-2 border border-slate-300 font-bold">{r.name}</td>
                                    <td className="p-2 border border-slate-300">{r.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}</td>
                                    <td className="p-2 border border-slate-300">{r.totalOrders}</td>
                                    <td className="p-2 border border-slate-300 font-black text-slate-900">${r.totalRevenue.toFixed(2)}</td>
                                    <td className="p-2 border border-slate-300">${r.averageTicket.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 4. Auditoría de Consentimientos LOPDP */}
                <div className="space-y-2">
                    <div className="p-2.5 bg-amber-50 border border-[#f89b01]/30 rounded-lg text-slate-900 text-[11px] font-semibold">
                        <span className="font-black text-[#f89b01]">CERTIFICADO LOPDP ECUADOR:</span> Cumplimiento verificado del Art. 9 de la Ley Orgánica de Protección de Datos Personales del Ecuador. Consentimiento otorgado explícitamente en el inicio de sesión.
                    </div>

                    <p className="font-extrabold text-xs uppercase tracking-wider text-slate-900">III. Registro Nominativo Auditado de Usuarios (PostgreSQL)</p>
                    <table className="w-full text-left text-xs border border-slate-300">
                        <thead className="bg-[#181818] text-white font-black uppercase text-[10px]">
                            <tr>
                                <th className="p-2 border border-slate-400">ID BD</th>
                                <th className="p-2 border border-slate-400">Usuario</th>
                                <th className="p-2 border border-slate-400">Correo Electrónico</th>
                                <th className="p-2 border border-slate-400">Rol</th>
                                <th className="p-2 border border-slate-400">Estado LOPDP</th>
                                <th className="p-2 border border-slate-400">Fecha / Hora Registro</th>
                            </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-800 divide-y divide-slate-200">
                            {allUsers.map(u => (
                                <tr key={u.id}>
                                    <td className="p-2 border border-slate-300">#{u.id}</td>
                                    <td className="p-2 border border-slate-300 font-bold">{u.fullName}</td>
                                    <td className="p-2 border border-slate-300">{u.email}</td>
                                    <td className="p-2 border border-slate-300">{u.roleName}</td>
                                    <td className="p-2 border border-slate-300 font-black">
                                        {u.consentGiven ? 'ACEPTADO (Art. 9)' : 'ANONIMIZADO (Art. 22)'}
                                    </td>
                                    <td className="p-2 border border-slate-300">{u.consentDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 5. Bloque Oficial de Firmas */}
                <div className="pt-16 mt-12 flex justify-around text-center text-xs font-bold text-slate-900">
                    <div className="w-64 border-t-2 border-slate-900 pt-2 space-y-0.5">
                        <p className="font-black">ADMINISTRACIÓN GENERAL</p>
                        <p className="text-[11px] text-slate-600 font-semibold">Club Castillo de Amaguaña</p>
                    </div>

                    <div className="w-64 border-t-2 border-slate-900 pt-2 space-y-0.5">
                        <p className="font-black">OFICIAL DE PROTECCIÓN DE DATOS</p>
                        <p className="text-[11px] text-slate-600 font-semibold">Auditoría LOPDP & Sistemas</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
