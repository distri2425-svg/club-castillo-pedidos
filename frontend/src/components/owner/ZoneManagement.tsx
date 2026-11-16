import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, MapPin, RefreshCw } from 'lucide-react';
import Button from '../common/Button';
import toast from "react-hot-toast";
import ConfirmDialog from '../common/ConfirmDialog';

interface Zone {
    id: number;
    name: string;
    description: string;
    createdAt: string;
}

const API_URL = '';

const ZoneManagement: React.FC = () => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [showConfirm, setShowConfirm] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch zones
    const fetchZones = async () => {
        setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/zones`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setZones(res.data);
        } catch (err) {
            toast.error('Error al cargar zonas');
        }
        setRefreshing(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchZones().finally(() => setLoading(false));
        // eslint-disable-next-line
    }, []);

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre de la zona es obligatorio');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (editingZone) {
                // Editar zona
                const res = await axios.put(`${API_URL}/zones/${editingZone.id}`, {
                    name: formData.name,
                    description: formData.description
                }, { headers: { Authorization: `Bearer ${token}` } });
                setZones(zones.map(z => z.id === editingZone.id ? res.data : z));
                toast.success('Zona actualizada');
            } else {
                // Crear zona
                const res = await axios.post(`${API_URL}/zones`, {
                    name: formData.name,
                    description: formData.description
                }, { headers: { Authorization: `Bearer ${token}` } });
                setZones([...zones, res.data]);
                toast.success('Zona creada');
            }
            closeModal();
        } catch (err) {
            toast.error('Error al guardar zona');
        }
    };

    const handleEdit = (zone: Zone) => {
        setEditingZone(zone);
        setFormData({ name: zone.name, description: zone.description });
        setShowAddModal(true);
    };

    const handleDeleteRequest = (id: number) => {
        setToDeleteId(id);
        setShowConfirm(true);
    };
    const handleCancelDelete = () => {
        setShowConfirm(false);
        setToDeleteId(null);
    };
    const confirmDeleteZone = async () => {
        if (!toDeleteId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/zones/${toDeleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setZones(zones.filter(z => z.id !== toDeleteId));
            toast.success('Zona eliminada');
        } catch (err) {
            toast.error('Error al eliminar zona');
        } finally {
            setShowConfirm(false);
            setToDeleteId(null);
        }
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingZone(null);
        setFormData({ name: '', description: '' });
    };

    return (
        <div className="min-h-screen bg-gray-50 w-full">
            <div className="p-4 sm:p-6 space-y-6 w-full">
                {/* HEADER: Responsive */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Izquierda: título + subtitulo */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Zonas</h1>
                        <p className="text-gray-600 mt-2">Administra las zonas del club</p>
                    </div>
                    {/* Botones de acción: ocupan full en mobile, horizontal en desktop */}
                    <div className="flex flex-col w-full md:w-auto md:flex-row md:items-center md:gap-2 mt-2 md:mt-0">
                        <div className="flex flex-row md:flex-row w-full md:w-auto gap-2">
                            <Button
                                onClick={fetchZones}
                                variant="outline"
                                icon={RefreshCw}
                                className="w-full md:w-auto"
                                disabled={refreshing}
                            >
                                <span className="md:hidden"></span>
                            </Button>
                            <Button
                                onClick={() => setShowAddModal(true)}
                                variant="primary"
                                icon={Plus}
                                className="w-full md:w-auto"
                            >
                            Nuevo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MODAL CONFIRM ELIMINAR */}
                <ConfirmDialog
                    open={showConfirm}
                    title="Eliminar zona"
                    message="¿Estás seguro de que quieres eliminar esta zona? Esta acción no se puede deshacer."
                    onCancel={handleCancelDelete}
                    onConfirm={confirmDeleteZone}
                />

                {/* Add/Edit Zone Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {editingZone ? 'Editar Zona' : 'Nueva Zona'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre de la Zona
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Zona Piscina"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                                        placeholder="Descripción de la zona"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 mt-6 justify-end">
                                <Button onClick={handleSubmit} variant="primary">
                                    {editingZone ? 'Actualizar' : 'Crear'} Zona
                                </Button>
                                <Button onClick={closeModal} variant="outline">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Zones Grid */}
                {loading ? (
                    <div className="text-center py-16 text-gray-600">Cargando zonas...</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {zones.map((zone) => (
                            <div key={zone.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-100 p-3 rounded-xl">
                                            <MapPin className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{zone.name}</h3>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-6">{zone.description}</p>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={() => handleEdit(zone)}
                                        variant="outline"
                                        size="sm"
                                        icon={Edit}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteRequest(zone.id)}
                                        variant="danger"
                                        size="sm"
                                        icon={Trash2}
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {zones.length === 0 && !loading && (
                    <div className="text-center py-16">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay zonas creadas</h3>
                        <p className="text-gray-600 mb-4">Comienza creando la primera zona del club</p>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            variant="primary"
                            icon={Plus}
                        >
                            Crear Primera Zona
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ZoneManagement;
