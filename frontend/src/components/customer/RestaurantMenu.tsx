import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    ChevronLeft,
    ChefHat,
    ChevronDown,
    ChevronUp,
    ShoppingCart,
    CupSoda,
} from "lucide-react";
import { useCart } from "./CartProvider";

const API_URL = "";

interface RestaurantData {
    id: number;
    name: string;
    description: string;
    imageBase64?: string;
    status: string;
    zoneName?: string;
}

interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    imageBase64?: string;
    available: boolean;
    categoryId: number;
    categoryName: string;
    restaurantId: number; // ← ya viene del backend
}

const RestaurantMenu: React.FC = () => {
    const { restaurantId } = useParams<{ restaurantId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { addToCart, cart } = useCart();

    const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [beverages, setBeverages] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    /* -------------------------------------------------- */
    /* QR en la URL: si existe, guárdalo en localStorage   */
    /* -------------------------------------------------- */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const qrCodeFromUrl = params.get("qrCode");
        if (qrCodeFromUrl) localStorage.setItem("qrCode", qrCodeFromUrl);
    }, [location.search]);

    /* -------------------------------------------------- */
    /* Carga de restaurante + menú + bebidas              */
    /* -------------------------------------------------- */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resRest = await axios.get(
                    `${API_URL}/restaurants/public/${restaurantId}`
                );
                setRestaurant(resRest.data);

                const resMenu = await axios.get(
                    `${API_URL}/menu-items/restaurant/${restaurantId}`
                );
                setMenuItems(resMenu.data);

                const resBeverages = await axios.get(
                    `${API_URL}/beverages/restaurant/${restaurantId}`
                );
                const bebidasConCategoria = resBeverages.data.map((b: any) => ({
                    ...b,
                    categoryName: b.categoryName || "Bebidas",
                }));
                setBeverages(bebidasConCategoria);
            } catch (err) {
                setError("Restaurante no encontrado o menú no disponible");
            } finally {
                setLoading(false);
            }
        };

        if (restaurantId) fetchData();
    }, [restaurantId]);

    /* -------------------------------------------------- */
    /* Preparar listado filtrado                          */
    /* -------------------------------------------------- */
    const combinedItems = [...menuItems, ...beverages];
    const categories = Array.from(
        new Set(combinedItems.map((item) => item.categoryName))
    ).filter(Boolean);

    const filteredItems = selectedCategory
        ? combinedItems.filter((item) => item.categoryName === selectedCategory)
        : combinedItems;

    const qrCode = localStorage.getItem("qrCode");

    // Flujo alterno B del caso de uso CU-01: la unidad cerrada se informa y no
    // admite pedidos. Se comprueba aqui porque el enlace del QR llega directo a
    // esta vista sin pasar por el listado; el servidor lo rechaza igualmente.
    const restaurantClosed = restaurant?.status === "CLOSED";

    /* -------------------------------------------------- */
    /* Loading / Error                                    */
    /* -------------------------------------------------- */
    if (loading)
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 text-xl">
                Cargando menú…
            </div>
        );

    if (error || !restaurant)
        return (
            <div className="flex items-center justify-center h-64 text-red-600 text-lg">
                {error || "Restaurante no encontrado"}
            </div>
        );

    /* -------------------------------------------------- */
    /* Render                                             */
    /* -------------------------------------------------- */
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto py-4 px-2 sm:px-6 relative z-10">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-5">
                    <button
                        onClick={() => navigate("/customer/restaurants")}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#f89b01] bg-white text-[#f89b01] font-semibold shadow hover:bg-[#f89b01] hover:text-white transition"
                    >
                        <ChevronLeft className="h-5 w-5" /> Volver al listado
                    </button>

                    {qrCode && cart.length > 0 && (
                        <button
                            onClick={() => navigate(`/customer/cart?qrCode=${qrCode}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#f89b01] text-white rounded-lg font-bold shadow hover:bg-[#181818] transition"
                        >
                            <ShoppingCart className="w-5 h-5" /> Ver carrito ({cart.length})
                        </button>
                    )}
                </div>

                {/* Hero */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg mb-10 border border-[#f89b01]/40">
                    <img
                        src={
                            restaurant.imageBase64
                                ? `data:image/jpeg;base64,${restaurant.imageBase64}`
                                : "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg"
                        }
                        alt={restaurant.name}
                        className="w-full h-64 sm:h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/80 via-[#181818]/30 to-transparent rounded-2xl" />
                    <div
                        className="absolute bottom-0 left-0 right-0 p-8 pb-6 flex flex-col rounded-b-2xl"
                        style={{
                            background: "rgba(255,255,255,0.13)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                        }}
                    >
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow">
                            {restaurant.name}
                        </h1>
                        <p className="text-white/90 mt-2 max-w-2xl drop-shadow">
                            {restaurant.description}
                        </p>
                        {restaurant.zoneName && (
                            <span className="inline-block mt-4 px-3 py-1 text-sm bg-[#f89b01]/90 text-white rounded-full font-semibold self-start shadow">
                {restaurant.zoneName}
              </span>
                        )}
                    </div>
                </div>

                {restaurantClosed && (
                    <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 font-semibold">
                        Este restaurante se encuentra cerrado en este momento y no recibe pedidos.
                        Puedes consultar la carta y volver cuando se encuentre abierto.
                    </div>
                )}

                {/* Filtros */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                            !selectedCategory
                                ? "bg-[#f89b01] text-white"
                                : "bg-gray-100 text-gray-900"
                        }`}
                    >
                        Todos
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg font-bold transition ${
                                selectedCategory === cat
                                    ? "bg-[#f89b01] text-white"
                                    : "bg-gray-100 text-gray-900"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid de platos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.length === 0 ? (
                        <div className="col-span-full text-gray-500 text-center">
                            No hay productos disponibles en esta categoría.
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <PlatoCard
                                key={item.id}
                                item={item}
                                beverages={beverages}
                                addToCart={addToCart}
                                restaurantId={Number(restaurantId)} // ← pasa el id
                                disabled={restaurantClosed}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

/* -------------------------------------------------- */
/* Tarjeta individual                                 */
/* -------------------------------------------------- */
interface PlatoCardProps {
    item: MenuItem;
    beverages: MenuItem[];
    addToCart: (item: any) => void;
    restaurantId: number;
    /** Verdadero cuando la unidad esta cerrada: la carta se consulta pero no se pide. */
    disabled?: boolean;
}

const PlatoCard: React.FC<PlatoCardProps> = ({
                                                 item,
                                                 beverages,
                                                 addToCart,
                                                 restaurantId,
                                                 disabled = false,
                                             }) => {
    const [expanded, setExpanded] = useState(false);
    const isBeverage = beverages.some((b) => b.id === item.id);
    const canOrder = item.available && !disabled;

    return (
        <div className="bg-white rounded-2xl shadow-md border border-[#f89b01]/15 flex flex-col p-5 group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-200 relative">
            {/* header */}
            <div className="flex items-center gap-3 mb-3">
                {item.imageBase64 ? (
                    <img
                        src={`data:image/jpeg;base64,${item.imageBase64}`}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover border-2 border-[#f89b01] shadow"
                    />
                ) : isBeverage ? (
                    <CupSoda className="h-16 w-16 text-[#f89b01]" />
                ) : (
                    <ChefHat className="h-16 w-16 text-[#f89b01]" />
                )}

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <span className="text-lg font-bold text-[#f89b01]">
            ${item.price.toFixed(2)}
          </span>
                    <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ml-2 ${
                            item.available
                                ? "bg-green-50 text-green-800 border border-green-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                    >
            {item.available ? "Disponible" : "No disponible"}
          </span>
                </div>
            </div>

            {/* descripción */}
            <div className="text-gray-600 text-sm mb-2">
                {expanded
                    ? item.description
                    : item.description.length > 80
                        ? `${item.description.slice(0, 80)}…`
                        : item.description}
                {item.description.length > 80 && (
                    <button
                        className="text-[#f89b01] hover:underline ml-2 inline-flex items-center"
                        onClick={() => setExpanded((e) => !e)}
                    >
                        {expanded ? (
                            <>
                                Ver menos <ChevronUp className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Ver más <ChevronDown className="h-4 w-4" />
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* botón */}
            <div className="flex items-center gap-2 mt-auto">
                <button
                    disabled={!canOrder}
                    onClick={() =>
                        addToCart({
                            id: item.id,
                            restaurantId, // ✅ ahora lo guardamos
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                            imageBase64: item.imageBase64,
                            type: isBeverage ? "beverage" : "food",
                        })
                    }
                    className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-150 ${
                        canOrder
                            ? "bg-[#181818] hover:bg-[#f89b01] hover:text-white text-white shadow active:scale-95"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    {isBeverage ? (
                        <CupSoda className="w-5 h-5" />
                    ) : (
                        <ChefHat className="w-5 h-5" />
                    )}
                    {disabled ? "Restaurante cerrado" : item.available ? "Pedir" : "No disponible"}
                </button>
            </div>

            <div className="text-xs italic text-gray-400 mt-2">
                {item.available ? "¡Recién preparado para ti!" : "No disponible en este momento"}
            </div>
        </div>
    );
};

export default RestaurantMenu;
