import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, MapPin, User, RefreshCw, Search } from 'lucide-react';
import Button from '../common/Button';
import toast from "react-hot-toast";
import ConfirmDialog from '../common/ConfirmDialog';

interface Restaurant {
    id: number;
    name: string;
    description: string;
    status: 'OPEN' | 'CLOSED';
    zoneId: number;
    adminId: number;
    active: boolean;
    imageBase64?: string;
}

interface Zone {
    id: number;
    name: string;
}

interface Admin {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

const API_URL = '';

const RestaurantManagement: React.FC = () => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // Modal de confirmación
    const [showConfirm, setShowConfirm] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<number | null>(null);

    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        description: '',
        zoneId: '',
        adminId: '',
        image: '',
    });

    // Editar restaurante
    const [showEditModal, setShowEditModal] = useState(false);
    const [editRestaurant, setEditRestaurant] = useState<Restaurant | null>(null);
    const [editImage, setEditImage] = useState<string>('');

    // Refrescar datos (usado también para el botón)
    const fetchData = async () => {
        setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const [resR, resZ, resA] = await Promise.all([
                axios.get(`${API_URL}/restaurants`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/users/all?role=RESTAURANT_ADMIN`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setRestaurants(resR.data);
            setZones(resZ.data);
            setAdmins(resA.data);
        } catch (err) {
            toast.error('Error al cargar datos');
        }
        setRefreshing(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
        // eslint-disable-next-line
    }, []);

    // Filtro búsqueda
    const filterFn = (restaurant: Restaurant) =>
        restaurant.name.toLowerCase().includes(search.toLowerCase()) ||
        restaurant.description.toLowerCase().includes(search.toLowerCase()) ||
        getZoneName(restaurant.zoneId).toLowerCase().includes(search.toLowerCase()) ||
        getAdminName(restaurant.adminId).toLowerCase().includes(search.toLowerCase());

    // Convertir imagen a base64 (crear)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Solo se permiten imágenes JPG, JPEG, PNG o WEBP');
            e.target.value = '';
            setNewRestaurant(prev => ({ ...prev, image: '' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            setNewRestaurant(prev => ({ ...prev, image: base64 }));
        };
        reader.readAsDataURL(file);
    };

    // Convertir imagen a base64 (editar)
    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Solo se permiten imágenes JPG, JPEG, PNG o WEBP');
            e.target.value = '';
            setEditImage('');
            if (editRestaurant) setEditRestaurant({ ...editRestaurant, imageBase64: '' });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            setEditImage(base64);
            if (editRestaurant) setEditRestaurant({ ...editRestaurant, imageBase64: base64 });
        };
        reader.readAsDataURL(file);
    };

    // Crear restaurante
    const addRestaurant = async () => {
        if (!newRestaurant.name || !newRestaurant.zoneId || !newRestaurant.adminId) {
            toast.error('Completa todos los campos');
            return;
        }
        if (!newRestaurant.image) {
            toast.error('Debes subir una imagen válida');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/restaurants`, {
                name: newRestaurant.name,
                description: newRestaurant.description,
                zoneId: Number(newRestaurant.zoneId),
                adminId: Number(newRestaurant.adminId),
                status: 'OPEN',
                active: true,
                imageBase64: newRestaurant.image,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setRestaurants((prev) => [...prev, res.data]);
            setShowAddModal(false);
            setNewRestaurant({ name: '', description: '', zoneId: '', adminId: '', image: '' });
            toast.success('Restaurante creado');
        } catch (err: any) {
            toast.error('Error al crear el restaurante');
        }
    };

    // Confirmar/eliminar restaurante
    const handleDeleteRequest = (id: number) => {
        setToDeleteId(id);
        setShowConfirm(true);
    };
    const handleCancelDelete = () => {
        setShowConfirm(false);
        setToDeleteId(null);
    };
    const confirmDeleteRestaurant = async () => {
        if (!toDeleteId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/restaurants/${toDeleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRestaurants((prev) => prev.filter(r => r.id !== toDeleteId));
            toast.success('Restaurante eliminado');
        } catch (err) {
            toast.error('Error al eliminar restaurante');
        } finally {
            setShowConfirm(false);
            setToDeleteId(null);
        }
    };

    // Abrir modal editar
    const handleEdit = (restaurant: Restaurant) => {
        setEditRestaurant({ ...restaurant });
        setEditImage(restaurant.imageBase64 || '');
        setShowEditModal(true);
    };

    // Guardar cambios al editar
    const saveEditRestaurant = async () => {
        if (!editRestaurant) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/restaurants/${editRestaurant.id}`, {
                name: editRestaurant.name,
                description: editRestaurant.description,
                zoneId: editRestaurant.zoneId,
                adminId: editRestaurant.adminId,
                status: editRestaurant.status,
                active: editRestaurant.active,
                imageBase64: editImage,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setRestaurants(prev =>
                prev.map(r => (r.id === editRestaurant.id ? res.data : r))
            );
            setShowEditModal(false);
            setEditRestaurant(null);
            setEditImage('');
            toast.success('Restaurante actualizado');
        } catch (err: any) {
            toast.error('Error al actualizar restaurante');
        }
    };

    // Helpers
    const getZoneName = (zoneId: number) => {
        const zone = zones.find(z => z.id === zoneId);
        return zone?.name || 'Zona desconocida';
    };

    const getAdminName = (adminId: number) => {
        const admin = admins.find(a => a.id === adminId);
        return admin ? `${admin.firstName} ${admin.lastName}` : 'Administrador';
    };

    // Filtrar restaurantes
    const filteredRestaurants = restaurants.filter(filterFn);

    return (
        <div className="min-h-screen bg-gray-50 w-full">
            <div className="p-4 sm:p-6 space-y-6 w-full">
                {/* HEADER: Responsive igual que usuarios */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Izquierda: título + subtitulo */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Restaurantes</h1>
                        <p className="text-gray-600 mt-2">Administra todos los restaurantes del club</p>
                    </div>
                    {/* MOBILE: buscador ocupa 100%, botones colapsan abajo */}
                    <div className="flex flex-col w-full md:w-auto md:flex-row md:items-center md:gap-2 mt-2 md:mt-0">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar restaurantes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                            />
                        </div>
                        <br/>
                        {/* Botones de acción: ocupan full en mobile, horizontal en desktop */}
                        <div className="flex flex-row md:flex-row w-full md:w-auto gap-2 mt-2 md:mt-0">
                            <Button
                                icon={RefreshCw}
                                variant="outline"
                                onClick={fetchData}
                                disabled={refreshing}
                                className="w-full md:w-auto"
                            >
                                <span className="md:hidden"></span>
                            </Button>
                            <Button
                                icon={Plus}
                                variant="primary"
                                onClick={() => setShowAddModal(true)}
                                className="w-full md:w-auto"
                            >
                                Nuevo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MODAL DE CONFIRMACIÓN ELIMINAR */}
                <ConfirmDialog
                    open={showConfirm}
                    title="Eliminar restaurante"
                    message="¿Estás seguro de que quieres eliminar este restaurante? Esta acción no se puede deshacer."
                    onCancel={handleCancelDelete}
                    onConfirm={confirmDeleteRestaurant}
                />

                {/* Modal de creación */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Nuevo Restaurante</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Restaurante</label>
                                        <input
                                            type="text"
                                            value={newRestaurant.name}
                                            onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="Ej: La Terraza"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                        <textarea
                                            value={newRestaurant.description}
                                            onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg h-20"
                                            placeholder="Descripción del restaurante"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
                                        <select
                                            value={newRestaurant.zoneId}
                                            onChange={(e) => setNewRestaurant({ ...newRestaurant, zoneId: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Seleccionar zona</option>
                                            {zones.map(zone => (
                                                <option key={zone.id} value={zone.id}>{zone.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            onChange={handleFileChange}
                                            className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#f89b01] file:text-[#181818] hover:file:bg-[#ffb933] file:cursor-pointer file:shadow-sm transition-all bg-amber-50/50 p-2.5 border border-[#f89b01]/30 rounded-2xl cursor-pointer"
                                        />
                                        {newRestaurant.image && (
                                            <img
                                                src={`data:image/jpeg;base64,${newRestaurant.image}`}
                                                alt="Vista previa"
                                                className="w-full h-40 object-cover mt-2 rounded-lg border"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Datos del Administrador</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Administrador</label>
                                        <select
                                            value={newRestaurant.adminId}
                                            onChange={(e) => setNewRestaurant({ ...newRestaurant, adminId: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Seleccionar admin</option>
                                            {admins.map(admin => (
                                                <option key={admin.id} value={admin.id}>
                                                    {admin.firstName} {admin.lastName} ({admin.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h5 className="font-medium text-blue-900 mb-2">Información Importante</h5>
                                        <ul className="text-sm text-blue-800 space-y-1">
                                            <li>• Debe existir un administrador con el rol RESTAURANT_ADMIN</li>
                                            <li>• El administrador podrá gestionar el menú y pedidos</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6 justify-end">
                                <Button onClick={addRestaurant} variant="primary" className="w-full sm:w-auto">
                                    Crear Restaurante
                                </Button>
                                <Button onClick={() => setShowAddModal(false)} variant="outline" className="w-full sm:w-auto">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Editar Restaurante */}
                {showEditModal && editRestaurant && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Editar Restaurante</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        value={editRestaurant.name}
                                        onChange={e => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                    <textarea
                                        value={editRestaurant.description}
                                        onChange={e => setEditRestaurant({ ...editRestaurant, description: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg h-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
                                    <select
                                        value={editRestaurant.zoneId}
                                        onChange={e => setEditRestaurant({ ...editRestaurant, zoneId: Number(e.target.value) })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Seleccionar zona</option>
                                        {zones.map(zone => (
                                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Administrador</label>
                                    <select
                                        value={editRestaurant.adminId}
                                        onChange={e => setEditRestaurant({ ...editRestaurant, adminId: Number(e.target.value) })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Seleccionar admin</option>
                                        {admins.map(admin => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.firstName} {admin.lastName} ({admin.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                                    <select
                                        value={editRestaurant.status}
                                        onChange={e => setEditRestaurant({ ...editRestaurant, status: e.target.value as 'OPEN' | 'CLOSED' })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    >
                                        <option value="OPEN">Abierto</option>
                                        <option value="CLOSED">Cerrado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handleEditFileChange}
                                        className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#f89b01] file:text-[#181818] hover:file:bg-[#ffb933] file:cursor-pointer file:shadow-sm transition-all bg-amber-50/50 p-2.5 border border-[#f89b01]/30 rounded-2xl cursor-pointer"
                                    />
                                    {editImage && (
                                        <img
                                            src={`data:image/jpeg;base64,${editImage}`}
                                            alt="Vista previa"
                                            className="w-full h-40 object-cover mt-2 rounded-lg border"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6 justify-end">
                                <Button onClick={saveEditRestaurant} variant="primary" className="w-full sm:w-auto">
                                    Guardar cambios
                                </Button>
                                <Button onClick={() => { setShowEditModal(false); setEditRestaurant(null); setEditImage(''); }} variant="outline" className="w-full sm:w-auto">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grid responsive mejorado */}
                {loading ? (
                    <div className="text-center py-12 text-gray-700">Cargando restaurantes...</div>
                ) : (
// Cambiar esta línea:
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full px-4">
                        {filteredRestaurants.map((restaurant) => (
                            <div key={restaurant.id} className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                                <div className="relative">
                                    <img
                                        src={
                                            restaurant.imageBase64
                                                ? `data:image/jpeg;base64,${restaurant.imageBase64}`
                                                : 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
                                        }
                                        alt={restaurant.name}
                                        className="w-full h-48 sm:h-56 object-cover"
                                    />
                                    {/* Badge de estado arriba a la derecha */}
                                    <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium shadow 
                            ${restaurant.status === 'OPEN'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            {restaurant.status === 'OPEN' ? '🟢 Abierto' : '🔴 Cerrado'}
                        </span>
                                    </div>
                                </div>
                                <div className="p-4 sm:p-6 flex flex-col flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 truncate">{restaurant.name}</h3>
                                    <p className="text-gray-600 mb-4 text-sm line-clamp-2 flex-1">{restaurant.description}</p>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">{getZoneName(restaurant.zoneId)}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <User className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">Dueño/a: {getAdminName(restaurant.adminId)}</span>
                                        </div>
                                    </div>
                                    <div className="flex w-full justify-end mt-auto space-x-2">
                                        <button
                                            onClick={() => handleEdit(restaurant)}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRequest(restaurant.id)}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredRestaurants.length === 0 && !loading && search && (
                    <div className="text-center py-16">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron restaurantes</h3>
                        <p className="text-gray-600 mb-4">Intenta con otros términos de búsqueda</p>
                        <Button
                            onClick={() => setSearch('')}
                            variant="outline"
                        >
                            Limpiar búsqueda
                        </Button>
                    </div>
                )}

                {restaurants.length === 0 && !loading && !search && (
                    <div className="text-center py-16">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay restaurantes</h3>
                        <p className="text-gray-600 mb-4">Comienza creando tu primer restaurante</p>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            variant="primary"
                            icon={Plus}
                        >
                            Crear Primer Restaurante
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantManagement;