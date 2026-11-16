import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, GlassWater, Eye, EyeOff, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import ConfirmDialog from '../common/ConfirmDialog';

interface Category {
    id: number;
    name: string;
}

interface Beverage {
    id: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    categoryName: string;
    imageBase64?: string;
    available: boolean;
}

const API_URL = '';

const BeverageManagement: React.FC = () => {
    // Estados
    const [beverages, setBeverages] = useState<Beverage[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
    // Modales
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [editingBeverage, setEditingBeverage] = useState<Beverage | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<number | null>(null);

    // Formularios
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        categoryId: 0,
        imageBase64: '',
        available: true,
    });
    const [newCategory, setNewCategory] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Función para truncar descripción
    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Toggle descripción expandida
    const toggleDescription = (beverageId: number) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [beverageId]: !prev[beverageId]
        }));
    };

    // Fetch categorías
    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/categories/beverages`, {
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
        } catch (err) {
            toast.error('Error al cargar categorías');
        }
    };

    // Fetch bebidas
    const fetchBeverages = async () => {
        setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<Beverage[]>(`${API_URL}/beverages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBeverages(res.data);
        } catch (err) {
            toast.error('Error al cargar bebidas');
        }
        setRefreshing(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchCategories();
        fetchBeverages().finally(() => setLoading(false));
    }, []);

    // Crear categoría
    const handleCreateCategory = async () => {
        if (!newCategory.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/categories/beverages`, { name: newCategory.trim() }, {
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

    // Manejo imagen base64
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

    // Crear/editar bebida
    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.categoryId || formData.price <= 0) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (editingBeverage) {
                await axios.put(`${API_URL}/beverages/${editingBeverage.id}`, {
                    ...formData,
                }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success('Bebida actualizada');
            } else {
                await axios.post(`${API_URL}/beverages`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Bebida creada');
            }
            setShowAddModal(false);
            setEditingBeverage(null);
            setFormData({ name: '', description: '', price: 0, categoryId: 0, imageBase64: '', available: true });
            fetchBeverages();
        } catch (err: any) {
            toast.error('Error al guardar bebida');
        }
    };

    // Editar
    const handleEdit = (bev: Beverage) => {
        setEditingBeverage(bev);
        setFormData({
            name: bev.name,
            description: bev.description,
            price: bev.price,
            categoryId: bev.categoryId,
            imageBase64: bev.imageBase64 || '',
            available: bev.available
        });
        setShowAddModal(true);
    };

    // Eliminar
    const handleDeleteRequest = (id: number) => {
        setToDeleteId(id);
        setShowConfirm(true);
    };

    const handleCancelDelete = () => {
        setShowConfirm(false);
        setToDeleteId(null);
    };

    const confirmDeleteBeverage = async () => {
        if (!toDeleteId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/beverages/${toDeleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Bebida eliminada');
            fetchBeverages();
        } catch (err) {
            toast.error('Error al eliminar bebida');
        } finally {
            setShowConfirm(false);
            setToDeleteId(null);
        }
    };

    // Toggle disponibilidad
    const toggleAvailability = async (bev: Beverage) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/beverages/${bev.id}`, {
                ...bev,
                available: !bev.available
            }, { headers: { Authorization: `Bearer ${token}` } });
            fetchBeverages();
        } catch {
            toast.error('Error actualizando disponibilidad');
        }
    };

    // Filtrar búsqueda
    const filterFn = (bev: Beverage) =>
        bev.name.toLowerCase().includes(search.toLowerCase()) ||
        (bev.categoryName || '').toLowerCase().includes(search.toLowerCase());

    // Render
    return (
        <div className="min-h-screen bg-gray-50 w-full">
            <div className="p-4 sm:p-6 space-y-6 w-full">
                {/* HEADER: Responsive */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Izquierda: título + subtítulo */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Bebidas</h1>
                        <p className="text-gray-600 mt-2">Catálogo central de bebidas para todos los restaurantes</p>
                    </div>
                    {/* Buscador y botones, responsivo */}
                    <div className="flex flex-col w-full md:w-auto md:flex-row md:items-center md:gap-2 mt-2 md:mt-0">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o categoría"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                            />
                        </div>
                        <div className="flex flex-row w-full md:w-auto gap-2 mt-2 md:mt-0">
                            <Button
                                icon={RefreshCw}
                                variant="outline"
                                onClick={() => { fetchBeverages(); fetchCategories(); }}
                                className="w-full md:w-auto"
                            />
                            <Button
                                icon={Plus}
                                variant="outline"
                                onClick={() => setShowAddCategory(true)}
                                className="w-full md:w-auto"
                            >
                                Categoría
                            </Button>
                            <Button
                                icon={Plus}
                                variant="primary"
                                onClick={() => { setShowAddModal(true); setEditingBeverage(null); }}
                                className="w-full md:w-auto"
                            >
                                Nuevo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modal Crear Categoría */}
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

                {/* Confirm Dialog */}
                <ConfirmDialog
                    open={showConfirm}
                    title="Eliminar bebida"
                    message="¿Estás seguro de eliminar esta bebida? Esta acción no se puede deshacer."
                    onCancel={handleCancelDelete}
                    onConfirm={confirmDeleteBeverage}
                />

                {/* Modal crear/editar bebida */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {editingBeverage ? 'Editar Bebida' : 'Nueva Bebida'}
                            </h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        placeholder="Ej: Coca Cola"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        placeholder="Descripción de la bebida"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Precio
                                        </label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Categoría
                                        </label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Imagen de la bebida
                                    </label>
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
                                    {editingBeverage ? 'Actualizar' : 'Crear'} Bebida
                                </Button>
                                <Button onClick={() => {
                                    setShowAddModal(false);
                                    setEditingBeverage(null);
                                    setFormData({ name: '', description: '', price: 0, categoryId: 0, imageBase64: '', available: true });
                                }} variant="outline">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menú expand/collapse de categorías */}
                <div className="space-y-4 w-full">
                    {categories.map(category => {
                        const categoryBeverages = beverages.filter(bev => bev.categoryId === category.id).filter(filterFn);
                        return (
                            <div key={category.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full">
                                <button
                                    onClick={() => setExpanded(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                                    className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-200 font-bold text-lg text-left group focus:outline-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <GlassWater className="h-5 w-5 text-blue-500" />
                                        {category.name}
                                    </span>
                                    <span className="text-gray-400 group-hover:text-black transition-transform">
                                        {expanded[category.id] ? '▼' : '▶'}
                                    </span>
                                </button>
                                {expanded[category.id] && (
                                    <div className="divide-y divide-gray-200">
                                        {categoryBeverages.length === 0 && (
                                            <div className="p-6 text-center text-gray-500">
                                                No hay bebidas en esta categoría.
                                            </div>
                                        )}
                                        {categoryBeverages.map(beverage => (
                                            <div key={beverage.id}
                                                 className="p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                                    {/* Datos principales */}
                                                    <div className="flex items-start space-x-4 flex-1 w-full min-w-0">
                                                        <div className="bg-gray-100 p-3 rounded-full flex-shrink-0">
                                                            {beverage.imageBase64 ? (
                                                                <img src={`data:image/jpeg;base64,${beverage.imageBase64}`} alt={beverage.name} className="h-10 w-10 rounded-full object-cover" />
                                                            ) : (
                                                                <GlassWater className="h-8 w-8 text-gray-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{beverage.name}</h3>
                                                            <div className="mb-2">
                                                                {beverage.description && (
                                                                    <div>
                                                                        <p className="text-gray-600 text-sm leading-relaxed">
                                                                            {expandedDescriptions[beverage.id]
                                                                                ? beverage.description
                                                                                : truncateText(beverage.description, 100)
                                                                            }
                                                                        </p>
                                                                        {beverage.description.length > 100 && (
                                                                            <button
                                                                                onClick={() => toggleDescription(beverage.id)}
                                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 flex items-center gap-1"
                                                                            >
                                                                                {expandedDescriptions[beverage.id] ? (
                                                                                    <>
                                                                                        Ver menos
                                                                                        <ChevronUp className="h-3 w-3" />
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        Ver más
                                                                                        <ChevronDown className="h-3 w-3" />
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-blue-600 font-bold text-lg">${beverage.price.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    {/* Acciones */}
                                                    <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:items-end">
                                                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${beverage.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {beverage.available ? 'Disponible' : 'No disponible'}
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                onClick={() => handleEdit(beverage)}
                                                                variant="outline"
                                                                size="sm"
                                                                icon={Edit}
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDeleteRequest(beverage.id)}
                                                                variant="danger"
                                                                size="sm"
                                                                icon={Trash2}
                                                            >
                                                                Eliminar
                                                            </Button>
                                                            <Button
                                                                onClick={() => toggleAvailability(beverage)}
                                                                variant={beverage.available ? 'success' : 'outline'}
                                                                size="sm"
                                                                icon={beverage.available ? Eye : EyeOff}
                                                            >
                                                                {beverage.available ? 'Ocultar' : 'Mostrar'}
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

                {/* Empty State */}
                {beverages.length === 0 && (
                    <div className="text-center py-16">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GlassWater className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay bebidas</h3>
                        <p className="text-gray-600 mb-4">Comienza agregando la primera bebida al catálogo</p>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            variant="primary"
                            icon={Plus}
                        >
                            Crear Primera Bebida
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BeverageManagement;