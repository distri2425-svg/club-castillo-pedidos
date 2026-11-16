import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapPin, Search, ChefHat, RefreshCw, Clock, Star, Utensils, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import AiChatButton from "../../components/ia/AiChatButton";
import AiChatModal from "../../components/ia/AiChatModal";

const API_URL = '';

interface Restaurant {
    id: number;
    name: string;
    description: string;
    status: 'OPEN' | 'CLOSED';
    zoneId: number;
    imageBase64?: string;
}

interface Zone {
    id: number;
    name: string;
}

const RestaurantList: React.FC = () => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [activeZone, setActiveZone] = useState<number | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [openAiChat, setOpenAiChat] = useState(false);

    const navigate = useNavigate();

    const fetchAll = async () => {
        setRefreshing(true);
        setLoading(true);
        setError(null);
        try {
            const [resR, resZ] = await Promise.all([
                axios.get(`${API_URL}/restaurants/public`),
                axios.get(`${API_URL}/zones`)
            ]);
            setRestaurants(resR.data);
            setZones(resZ.data);
        } catch {
            setError("No se pudo cargar la información de los restaurantes.");
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const getZoneName = (zoneId: number) => {
        const zone = zones.find(z => z.id === zoneId);
        return zone?.name || 'Zona desconocida';
    };

    const filtered = restaurants.filter(r =>
        (activeZone === 'all' || r.zoneId === activeZone) &&
        (
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.description.toLowerCase().includes(search.toLowerCase()) ||
            getZoneName(r.zoneId).toLowerCase().includes(search.toLowerCase())
        )
    );

    const openRestaurants = filtered.filter(r => r.status === 'OPEN');
    const closedRestaurants = filtered.filter(r => r.status === 'CLOSED');

    const getCurrentGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Buenos días";
        if (hour < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
            <p className="text-lg animate-pulse">Cargando restaurantes...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-64">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                <div className="text-red-400 mb-3">
                    <Utensils className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Oops, algo salió mal</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchAll} className="bg-red-600 hover:bg-red-700">
                    Reintentar
                </Button>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="bg-white border border-yellow-200 rounded-3xl shadow p-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-[#f89b01]" />
                    <span className="text-base font-semibold text-[#f89b01]">{getCurrentGreeting()}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                    Restaurantes del Club Castillo de Amaguaña
                </h1>
                <p className="text-base sm:text-lg text-gray-700 mb-4 max-w-2xl">
                    Disfruta la mejor gastronomía y realiza tus pedidos en nuestros restaurantes.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-yellow-100/90 border border-yellow-200 text-yellow-900 rounded-full px-4 py-2">
                        <Utensils className="h-4 w-4 text-[#f89b01]" />
                        <span className="font-semibold">{restaurants.length} restaurantes</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-full px-4 py-2">
                        <Star className="h-4 w-4 text-blue-400" />
                        <span>Calidad premium</span>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full px-4 py-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>Servicio rápido</span>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">Encuentra tu restaurante ideal</h2>
                        <p className="text-gray-600 text-sm">Explora nuestras opciones disponibles</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
                        <Button
                            icon={RefreshCw}
                            variant="outline"
                            onClick={fetchAll}
                            disabled={refreshing}
                            className="order-2 sm:order-1"
                        >
                            {refreshing ? "Actualizando..." : ""}
                        </Button>
                        <div className="relative order-1 sm:order-2 sm:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar restaurante o zona..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f89b01] focus:border-transparent w-full transition-all"
                            />
                        </div>
                        <AiChatButton onClick={() => setOpenAiChat(true)} />
                        <AiChatModal open={openAiChat} onClose={() => setOpenAiChat(false)} />

                    </div>
                </div>
                {/* Zone Filters */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            className={`px-4 py-2 rounded-full border font-medium transition-all duration-200 flex items-center gap-2 ${
                                activeZone === 'all'
                                    ? 'bg-[#f89b01] text-white border-yellow-500 shadow'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-yellow-50 hover:border-yellow-200'
                            }`}
                            onClick={() => setActiveZone('all')}
                        >
                            <ChefHat className="h-4 w-4" />
                            Todas las Zonas
                        </button>
                        {zones.map(zone => (
                            <button
                                key={zone.id}
                                className={`px-4 py-2 rounded-full border font-medium transition-all duration-200 whitespace-nowrap ${
                                    activeZone === zone.id
                                        ? 'bg-[#f89b01] text-white border-yellow-500 shadow'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-yellow-50 hover:border-yellow-200'
                                }`}
                                onClick={() => setActiveZone(zone.id)}
                            >
                                {zone.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            {restaurants.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <div className="text-2xl font-bold text-green-600">{openRestaurants.length}</div>
                        <div className="text-sm text-gray-600">Abiertos ahora</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <div className="text-2xl font-bold text-gray-600">{closedRestaurants.length}</div>
                        <div className="text-sm text-gray-600">Cerrados</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <div className="text-2xl font-bold text-[#f89b01]">{zones.length}</div>
                        <div className="text-sm text-gray-600">Zonas</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">{filtered.length}</div>
                        <div className="text-sm text-gray-600">Resultados</div>
                    </div>
                </div>
            )}

            {/* Restaurants Grid */}
            <div>
                {openRestaurants.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                            Restaurantes Abiertos
                            <span className="text-sm font-normal text-gray-500">({openRestaurants.length})</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {openRestaurants.map(restaurant => (
                                <RestaurantCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    zoneName={getZoneName(restaurant.zoneId)}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {closedRestaurants.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-2 h-6 bg-gray-400 rounded-full"></div>
                            Restaurantes Cerrados
                            <span className="text-sm font-normal text-gray-500">({closedRestaurants.length})</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {closedRestaurants.map(restaurant => (
                                <RestaurantCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    zoneName={getZoneName(restaurant.zoneId)}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="text-center py-16">
                        <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
                            <ChefHat className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay restaurantes disponibles</h3>
                            <p className="text-gray-600 mb-4">
                                {search || activeZone !== 'all'
                                    ? 'Intenta cambiar los filtros de búsqueda'
                                    : 'No se encontraron restaurantes en esta zona'
                                }
                            </p>
                            {(search || activeZone !== 'all') && (
                                <Button
                                    onClick={() => {
                                        setSearch('');
                                        setActiveZone('all');
                                    }}
                                    variant="outline"
                                >
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const RestaurantCard: React.FC<{
    restaurant: Restaurant;
    zoneName: string;
    navigate: (path: string) => void;
}> = ({ restaurant, zoneName, navigate }) => {
    const isOpen = restaurant.status === 'OPEN';

    return (
        <div
            className={`
                bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden 
                flex flex-col relative transition-all duration-300 hover:shadow-xl
                ${isOpen
                ? "hover:-translate-y-2 cursor-pointer"
                : "opacity-60 cursor-not-allowed"
            }
            `}
            onClick={() => {
                if (isOpen) navigate(`/customer/restaurant/${restaurant.id}`);
            }}
            tabIndex={isOpen ? 0 : -1}
            aria-disabled={!isOpen}
        >
            <div className="relative group">
                <img
                    src={
                        restaurant.imageBase64
                            ? `data:image/jpeg;base64,${restaurant.imageBase64}`
                            : 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
                    }
                    alt={restaurant.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow
                        ${isOpen
                        ? 'bg-[#f89b01] text-white border border-yellow-400'
                        : 'bg-gray-400 text-white border border-gray-300'
                    }`}>
                        {isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
                    </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    <div className="flex items-center text-white text-sm font-medium">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{zoneName}</span>
                    </div>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                    {restaurant.name}
                </h3>
                <p className="text-gray-600 mb-4 text-sm line-clamp-2 flex-1 leading-relaxed">
                    {restaurant.description}
                </p>
                <button
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
                        ${isOpen
                        ? 'bg-[#f89b01] text-white hover:bg-yellow-600 shadow'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!isOpen}
                >
                    {isOpen ? 'Ver Menú' : 'Cerrado'}
                </button>
            </div>
        </div>
    );
};

export default RestaurantList;
