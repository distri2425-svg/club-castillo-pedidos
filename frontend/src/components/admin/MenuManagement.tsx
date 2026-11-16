import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Plus, Edit, Trash2, Package, Eye, EyeOff, RefreshCw,
    Search, ChevronDown, ChevronUp, CupSoda, Info
} from 'lucide-react';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

// ---------- INTERFACES ----------
interface Category {
    id: number;
    name: string;
}
interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    categoryName: string;
    imageBase64?: string;
    active: boolean;
    available: boolean;
}
interface Beverage {
    id: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    categoryName?: string;
    imageBase64?: string;
    available: boolean;
}
interface MyBeverage {
    beverageId: number;
    beverageName: string;
    beverageDescription: string;
    beveragePrice: number;
    beverageCategoryId: number;
    beverageCategoryName?: string;
    beverageImageBase64?: string;
    available: boolean;
}

const API_URL = '';

const MenuManagement: React.FC = () => {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId;

    // ---------- STATE GENERAL ----------
    // Tabs principales: 0 = Mis Bebidas, 1 = Catálogo Global
    const [mainTab, setMainTab] = useState<0 | 1>(0);

    // PLATOS
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        categoryId: 0,
        imageBase64: '',
        active: true,
        available: true,
        restaurantId: restaurantId ?? 0
    });

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            restaurantId: restaurantId ?? 0
        }));
    }, [restaurantId, showAddModal]);

    const [newCategory, setNewCategory] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // ---------- BEBIDAS ----------
    const [beverages, setBeverages] = useState<Beverage[]>([]);
    const [loadingBeverages, setLoadingBeverages] = useState(false);
    const [myBeverages, setMyBeverages] = useState<MyBeverage[]>([]);
    const [loadingMyBeverages, setLoadingMyBeverages] = useState(false);

    // Estados para descripciones expandidas de bebidas
    const [expandedBeverageDescriptions, setExpandedBeverageDescriptions] = useState<Record<number, boolean>>({});
    const [expandedMyBeverageDescriptions, setExpandedMyBeverageDescriptions] = useState<Record<number, boolean>>({});

    // Tabs secundarias por categoría en bebidas (por tab principal)
    const [globalBeverageCat, setGlobalBeverageCat] = useState<number | 'all'>('all');
    const [myBeverageCat, setMyBeverageCat] = useState<number | 'all'>('all');

    // IDs de bebidas del menú del restaurante
    const myBeverageIds = myBeverages.map(b => b.beverageId);

    // ---------- FETCH DATA ----------
    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/categories/food`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data);
            setExpanded(prev => {
                const state: Record<number, boolean> = { ...prev };
                res.data.forEach((cat: Category) => {
                    if (typeof state[cat.id] === 'undefined') state[cat.id] = false;
                });
                return state;
            });
        } catch {
            toast.error('Error al cargar categorías');
        }
    };

    const fetchMenuItems = async () => {
        if (!restaurantId) return;
        setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<MenuItem[]>(`${API_URL}/menu-items/restaurant/${restaurantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMenuItems(res.data);
        } catch {
            toast.error('Error al cargar platos');
        }
        setRefreshing(false);
    };

    const fetchBeverages = async () => {
        if (!restaurantId) return;
        setLoadingBeverages(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<Beverage[]>(`${API_URL}/beverages/restaurant/${restaurantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBeverages(res.data);
        } catch {
            toast.error('Error al cargar bebidas');
        }
        setLoadingBeverages(false);
    };

    const fetchMyBeverages = async () => {
        if (!restaurantId) return;
        setLoadingMyBeverages(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<MyBeverage[]>(`${API_URL}/restaurant-beverages/${restaurantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyBeverages(res.data);
        } catch {
            toast.error('Error al cargar tus bebidas');
        }
        setLoadingMyBeverages(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchCategories();
        fetchMenuItems();
        fetchBeverages();
        fetchMyBeverages();
        setLoading(false);
        // eslint-disable-next-line
    }, [restaurantId]);

    // ---------- CRUD Y HANDLERS ----------
    const handleCreateCategory = async () => {
        if (!newCategory.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/categories/food`, { name: newCategory.trim() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Categoría creada');
            setShowAddCategory(false);
            setNewCategory('');
            fetchCategories();
        } catch {
            toast.error('Error al crear categoría');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Solo imágenes JPG, PNG o WEBP');
            e.target.value = '';
            setFormData(prev => ({ ...prev, imageBase64: '' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            setFormData(prev => ({ ...prev, imageBase64: base64 }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.categoryId || formData.price <= 0) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }
        if (!formData.restaurantId) {
            toast.error('Restaurante no válido');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (editingItem) {
                await axios.put(`${API_URL}/menu-items/${editingItem.id}`, {
                    ...formData,
                    restaurantId: formData.restaurantId
                }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success('Plato actualizado');
            } else {
                await axios.post(`${API_URL}/menu-items`, {
                    ...formData,
                    restaurantId: formData.restaurantId
                }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success('Plato creado');
            }
            setShowAddModal(false);
            setEditingItem(null);
            setFormData({ name: '', description: '', price: 0, categoryId: 0, imageBase64: '', active: true, available: true, restaurantId: restaurantId ?? 0 });
            fetchMenuItems();
        } catch (err) {
            toast.error('Error al guardar plato');
        }
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setShowAddModal(true);
        setFormData({
            name: item.name,
            description: item.description,
            price: item.price,
            categoryId: item.categoryId,
            imageBase64: item.imageBase64 || '',
            active: item.active,
            available: item.available ?? true,
            restaurantId: restaurantId ?? 0
        });
    };

    const handleDeleteRequest = (id: number) => {
        setToDeleteId(id);
        setShowConfirm(true);
    };

    const handleCancelDelete = () => {
        setShowConfirm(false);
        setToDeleteId(null);
    };

    const confirmDeleteMenuItem = async () => {
        if (!toDeleteId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/menu-items/${toDeleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Plato eliminado');
            fetchMenuItems();
        } catch {
            toast.error('Error al eliminar plato');
        } finally {
            setShowConfirm(false);
            setToDeleteId(null);
        }
    };

    const toggleAvailability = async (item: MenuItem) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/menu-items/${item.id}`, {
                ...item,
                available: !item.available,
                restaurantId: restaurantId ?? 0
            }, { headers: { Authorization: `Bearer ${token}` } });
            fetchMenuItems();
        } catch {
            toast.error('Error actualizando disponibilidad');
        }
    };

    // ---------- CRUD BEBIDAS LOCAL (MI MENÚ) ----------
    const handleAddBeverageToMenu = async (beverageId: number) => {
        if (!restaurantId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/restaurant-beverages/${restaurantId}/${beverageId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Bebida añadida a tu menú');
            fetchMyBeverages();
        } catch {
            toast.error('No se pudo añadir bebida');
        }
    };

    const handleRemoveBeverageFromMenu = async (beverageId: number) => {
        if (!restaurantId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/restaurant-beverages/${restaurantId}/${beverageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Bebida eliminada de tu menú');
            fetchMyBeverages();
        } catch {
            toast.error('No se pudo quitar bebida');
        }
    };

    const handleToggleMyBeverageAvailability = async (beverageId: number, available: boolean) => {
        if (!restaurantId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/restaurant-beverages/${restaurantId}/${beverageId}/available?available=${available}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMyBeverages();
        } catch {
            toast.error('No se pudo cambiar disponibilidad');
        }
    };

    // ---------- HELPERS ----------
    const truncateText = (text: string, maxLength: number = 70) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // --- Tabs de categoría únicos por id/nombre ---
    const globalBeverageCategories = Object.entries(
        beverages.reduce((acc, b) => {
            if (b.categoryId && b.categoryName) acc[b.categoryId] = b.categoryName;
            return acc;
        }, {} as Record<number, string>)
    );
    const myBeverageCategories = Object.entries(
        myBeverages.reduce((acc, b) => {
            if (b.beverageCategoryId && b.beverageCategoryName) acc[b.beverageCategoryId] = b.beverageCategoryName;
            return acc;
        }, {} as Record<number, string>)
    );

    // ---------- RENDER ----------
    return (
        <div className="min-h-screen bg-gray-50 w-full">
            <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 w-full max-w-[1400px] mx-auto">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Menú</h1>
                        <p className="text-gray-600 mt-2 text-sm sm:text-base">Administra los platos y bebidas de tu restaurante</p>
                    </div>
                    <div className="flex flex-col w-full md:w-auto md:flex-row md:items-center md:gap-2 mt-2 md:mt-0">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o categoría"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
                            />
                        </div>
                        <div className="flex flex-row w-full md:w-auto gap-2 mt-2 md:mt-0">
                            <Button icon={RefreshCw} variant="outline" onClick={() => { fetchMenuItems(); fetchCategories(); fetchBeverages(); fetchMyBeverages(); }} />
                            <Button icon={Plus} variant="outline" onClick={() => setShowAddCategory(true)}>Categoría</Button>
                            <Button icon={Plus} variant="primary" onClick={() => { setShowAddModal(true); setEditingItem(null); }}>Nuevo</Button>
                        </div>
                    </div>
                </div>

                {/* MODALES */}
                {showAddCategory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Nueva Categoría</h3>
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Nombre de la categoría"
                                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                            />
                            <div className="flex space-x-3">
                                <Button onClick={handleCreateCategory} variant="primary">Agregar</Button>
                                <Button onClick={() => setShowAddCategory(false)} variant="outline">Cancelar</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Crear/Editar Plato */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {editingItem ? 'Editar Plato' : 'Nuevo Plato'}
                            </h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        placeholder="Ej: Paella"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        placeholder="Descripción del plato"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            min={0}
                                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                        >
                                            <option value={0}>Seleccionar categoría</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del plato</label>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handleFileChange}
                                        className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#f89b01] file:text-[#181818] hover:file:bg-[#ffb933] file:cursor-pointer file:shadow-sm transition-all bg-amber-50/50 p-2.5 border border-[#f89b01]/30 rounded-2xl cursor-pointer"
                                    />
                                    {formData.imageBase64 && (
                                        <img
                                            src={`data:image/jpeg;base64,${formData.imageBase64}`}
                                            alt="Vista previa"
                                            className="w-28 h-28 object-cover mt-2 rounded-full border"
                                        />
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.available}
                                        onChange={e => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                                    />
                                    <label className="text-gray-700 text-sm">Disponible</label>
                                </div>
                            </div>
                            <div className="flex space-x-3 mt-6 justify-end">
                                <Button onClick={handleSubmit} variant="primary">
                                    {editingItem ? 'Actualizar' : 'Crear'} Plato
                                </Button>
                                <Button onClick={() => {
                                    setShowAddModal(false);
                                    setEditingItem(null);
                                    setFormData({ name: '', description: '', price: 0, categoryId: 0, imageBase64: '', active: true, available: true, restaurantId: restaurantId ?? 0 });
                                }} variant="outline">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmación Eliminar */}
                <ConfirmDialog
                    open={showConfirm}
                    title="Eliminar plato"
                    message="¿Estás seguro de eliminar este plato? Esta acción no se puede deshacer."
                    onCancel={handleCancelDelete}
                    onConfirm={confirmDeleteMenuItem}
                />

                {/* PLATOS POR CATEGORÍA */}
                <div className="space-y-4 w-full">
                    {categories.map(category => {
                        const categoryItems = menuItems.filter(item => item.categoryId === category.id).filter(
                            item => item.name.toLowerCase().includes(search.toLowerCase()) ||
                                (item.categoryName || '').toLowerCase().includes(search.toLowerCase())
                        );
                        return (
                            <div key={category.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full">
                                <button
                                    onClick={() => setExpanded(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                                    className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-200 font-bold text-lg text-left group focus:outline-none"
                                >
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                      {category.name}
                  </span>
                                    <span className="text-gray-400 group-hover:text-black transition-transform">
                    {expanded[category.id] ? '▼' : '▶'}
                  </span>
                                </button>
                                {expanded[category.id] && (
                                    <div className="divide-y divide-gray-200">
                                        {categoryItems.length === 0 && (
                                            <div className="p-6 text-center text-gray-500">
                                                No hay platos en esta categoría.
                                            </div>
                                        )}
                                        {categoryItems.map(item => (
                                            <div key={item.id}
                                                 className="p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                                    <div className="flex items-start space-x-4 flex-1 w-full min-w-0">
                                                        <div className="bg-gray-100 p-3 rounded-full flex-shrink-0">
                                                            {item.imageBase64 ? (
                                                                <img src={`data:image/jpeg;base64,${item.imageBase64}`} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
                                                            ) : (
                                                                <Package className="h-8 w-8 text-gray-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                                                            <div className="mb-2">
                                                                {item.description && (
                                                                    <div>
                                                                        <p className="text-gray-600 text-sm leading-relaxed">
                                                                            {expandedDescriptions[item.id]
                                                                                ? item.description
                                                                                : truncateText(item.description, 100)
                                                                            }
                                                                        </p>
                                                                        {item.description && item.description.length > 100 && (
                                                                            <button
                                                                                onClick={() => setExpandedDescriptions(prev => ({
                                                                                    ...prev,
                                                                                    [item.id]: !prev[item.id]
                                                                                }))}
                                                                                className="text-orange-600 hover:text-orange-800 text-sm font-medium mt-1 flex items-center gap-1"
                                                                            >
                                                                                {expandedDescriptions[item.id] ? (
                                                                                    <>Ver menos <ChevronUp className="h-3 w-3" /></>
                                                                                ) : (
                                                                                    <>Ver más <ChevronDown className="h-3 w-3" /></>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-orange-600 font-bold text-lg">${item.price.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:items-end">
                            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {item.available ? 'Disponible' : 'No disponible'}
                            </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                onClick={() => handleEdit(item)}
                                                                variant="outline"
                                                                size="sm"
                                                                icon={Edit}
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDeleteRequest(item.id)}
                                                                variant="danger"
                                                                size="sm"
                                                                icon={Trash2}
                                                            >
                                                                Eliminar
                                                            </Button>
                                                            <Button
                                                                onClick={() => toggleAvailability(item)}
                                                                variant={item.available ? 'success' : 'outline'}
                                                                size="sm"
                                                                icon={item.available ? Eye : EyeOff}
                                                            >
                                                                {item.available ? 'Ocultar' : 'Mostrar'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* ---------- TABS PRINCIPALES DE BEBIDAS ---------- */}
                <div className="mt-6">
                    <div className="flex w-full gap-2 mb-4">
                        <button
                            onClick={() => setMainTab(0)}
                            className={`flex-1 py-2 rounded-xl font-bold transition border ${mainTab === 0 ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
                        >
                            <CupSoda className="inline-block mr-1" /> Mis Bebidas
                        </button>
                        <button
                            onClick={() => setMainTab(1)}
                            className={`flex-1 py-2 rounded-xl font-bold transition border ${mainTab === 1 ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
                        >
                            <CupSoda className="inline-block mr-1" /> Catálogo Global
                        </button>
                    </div>

                    {/* --- TAB 0: MIS BEBIDAS --- */}
                    {mainTab === 0 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="h-4 w-4 text-blue-500" />
                                <p className="text-sm text-gray-600">
                                    Las bebidas son gestionadas por el Club. Solo puedes mostrar/ocultar las que has añadido a tu menú.
                                </p>
                            </div>

                            {/* Tabs de categoría */}
                            <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto">
                                <button
                                    className={`px-4 py-2 rounded-full border transition-colors ${myBeverageCat === 'all' ? 'bg-green-100 text-green-700 border-green-400' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'}`}
                                    onClick={() => setMyBeverageCat('all')}
                                >
                                    Todas
                                </button>
                                {myBeverageCategories.map(([catId, catName]) => (
                                    <button
                                        key={catId}
                                        className={`px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${myBeverageCat === Number(catId) ? 'bg-green-100 text-green-700 border-green-400' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'}`}
                                        onClick={() => setMyBeverageCat(Number(catId))}
                                    >
                                        {catName}
                                    </button>
                                ))}
                            </div>

                            {/* Grid de bebidas - 3 por fila en desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {loadingMyBeverages && (
                                    <div className="col-span-full flex justify-center py-8">
                                        <div className="text-gray-500">Cargando mis bebidas...</div>
                                    </div>
                                )}

                                {!loadingMyBeverages && myBeverages.length === 0 && (
                                    <div className="col-span-full text-gray-500 text-center py-8">
                                        <CupSoda className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No tienes bebidas añadidas a tu menú.</p>
                                    </div>
                                )}

                                {!loadingMyBeverages && myBeverages.filter(b => myBeverageCat === 'all' || b.beverageCategoryId === myBeverageCat).map(rb => (
                                    <div
                                        key={rb.beverageId}
                                        className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="flex-shrink-0">
                                                {rb.beverageImageBase64 ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${rb.beverageImageBase64}`}
                                                        alt={rb.beverageName}
                                                        className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                                                        <CupSoda className="h-8 w-8 text-green-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{rb.beverageName}</h3>
                                                <div className="mb-2">
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {expandedMyBeverageDescriptions[rb.beverageId]
                                                            ? rb.beverageDescription
                                                            : truncateText(rb.beverageDescription, 80)
                                                        }
                                                    </p>
                                                    {rb.beverageDescription && rb.beverageDescription.length > 80 && (
                                                        <button
                                                            onClick={() => setExpandedMyBeverageDescriptions(prev => ({
                                                                ...prev,
                                                                [rb.beverageId]: !prev[rb.beverageId]
                                                            }))}
                                                            className="text-green-600 hover:text-green-800 text-sm font-medium mt-1 flex items-center gap-1"
                                                        >
                                                            {expandedMyBeverageDescriptions[rb.beverageId] ? (
                                                                <>Ver menos <ChevronUp className="h-3 w-3" /></>
                                                            ) : (
                                                                <>Ver más <ChevronDown className="h-3 w-3" /></>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-orange-600 font-bold text-lg">${rb.beveragePrice?.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full text-center ${rb.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {rb.available ? 'Disponible' : 'No disponible'}
                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleToggleMyBeverageAvailability(rb.beverageId, !rb.available)}
                                                    variant={rb.available ? 'success' : 'outline'}
                                                    size="sm"
                                                    className="flex-1"
                                                    icon={rb.available ? Eye : EyeOff}
                                                >
                                                    {rb.available ? 'Ocultar' : 'Mostrar'}
                                                </Button>
                                                <Button
                                                    onClick={() => handleRemoveBeverageFromMenu(rb.beverageId)}
                                                    variant="danger"
                                                    size="sm"
                                                    className="flex-1"
                                                    icon={Trash2}
                                                >
                                                    Quitar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB 1: CATÁLOGO GLOBAL --- */}
                    {mainTab === 1 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="h-4 w-4 text-blue-500" />
                                <p className="text-sm text-gray-600">
                                    Catálogo de bebidas gestionado por el Club. Añade las que desees ofrecer en tu restaurante.
                                </p>
                            </div>

                            {/* Tabs de categoría */}
                            <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto">
                                <button
                                    className={`px-4 py-2 rounded-full border transition-colors ${globalBeverageCat === 'all' ? 'bg-blue-100 text-blue-700 border-blue-400' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'}`}
                                    onClick={() => setGlobalBeverageCat('all')}
                                >
                                    Todas
                                </button>
                                {globalBeverageCategories.map(([catId, catName]) => (
                                    <button
                                        key={catId}
                                        className={`px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${globalBeverageCat === Number(catId) ? 'bg-blue-100 text-blue-700 border-blue-400' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'}`}
                                        onClick={() => setGlobalBeverageCat(Number(catId))}
                                    >
                                        {catName}
                                    </button>
                                ))}
                            </div>

                            {/* Grid de bebidas - 3 por fila en desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {loadingBeverages && (
                                    <div className="col-span-full flex justify-center py-8">
                                        <div className="text-gray-500">Cargando bebidas...</div>
                                    </div>
                                )}

                                {!loadingBeverages && beverages.length === 0 && (
                                    <div className="col-span-full text-gray-500 text-center py-8">
                                        <CupSoda className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hay bebidas disponibles en el catálogo global.</p>
                                    </div>
                                )}

                                {!loadingBeverages && beverages.filter(b => globalBeverageCat === 'all' || b.categoryId === globalBeverageCat).map(b => (
                                    <div
                                        key={b.id}
                                        className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="flex-shrink-0">
                                                {b.imageBase64 ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${b.imageBase64}`}
                                                        alt={b.name}
                                                        className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <CupSoda className="h-8 w-8 text-blue-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{b.name}</h3>
                                                <div className="mb-2">
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {expandedBeverageDescriptions[b.id]
                                                            ? b.description
                                                            : truncateText(b.description, 80)
                                                        }
                                                    </p>
                                                    {b.description && b.description.length > 80 && (
                                                        <button
                                                            onClick={() => setExpandedBeverageDescriptions(prev => ({
                                                                ...prev,
                                                                [b.id]: !prev[b.id]
                                                            }))}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 flex items-center gap-1"
                                                        >
                                                            {expandedBeverageDescriptions[b.id] ? (
                                                                <>Ver menos <ChevronUp className="h-3 w-3" /></>
                                                            ) : (
                                                                <>Ver más <ChevronDown className="h-3 w-3" /></>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-orange-600 font-bold text-lg">${b.price.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full text-center ${b.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {b.available ? 'Disponible' : 'No disponible'}
                            </span>
                                            <Button
                                                onClick={() => handleAddBeverageToMenu(b.id)}
                                                variant={myBeverageIds.includes(b.id) ? 'success' : 'outline'}
                                                size="sm"
                                                disabled={!b.available || myBeverageIds.includes(b.id)}
                                                className="w-full"
                                                icon={myBeverageIds.includes(b.id) ? Eye : Plus}
                                            >
                                                {myBeverageIds.includes(b.id) ? 'En tu menú' : b.available ? 'Añadir a menú' : 'No disponible'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

            );
};

export default MenuManagement;
