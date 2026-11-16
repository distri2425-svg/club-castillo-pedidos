import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, User, Mail, Shield, RefreshCw, Search } from 'lucide-react';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import ConfirmDialog from '../common/ConfirmDialog';

// --- TIPOS ---
export type RoleType = 'OWNER' | 'RESTAURANT_ADMIN' | 'CUSTOMER';

export interface UserItem {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: RoleType;
    profileImageBase64?: string | null;
}

interface Pagination {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
}

const API_URL = '';

const roleLabels: Record<RoleType, string> = {
    OWNER: 'SuperAdmin',
    RESTAURANT_ADMIN: 'Admin Restaurante',
    CUSTOMER: 'Cliente'
};

const roleColors: Record<RoleType, string> = {
    OWNER: 'bg-purple-100 text-purple-800',
    RESTAURANT_ADMIN: 'bg-blue-100 text-blue-800',
    CUSTOMER: 'bg-green-100 text-green-800'
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [userImages, setUserImages] = useState<Record<number, string>>({});
    const [pagination, setPagination] = useState<Pagination>({
        page: 0,
        size: 10,
        totalPages: 1,
        totalElements: 0
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'CUSTOMER' as RoleType,
        password: '',
        profileImageBase64: ''
    });
    const [showConfirm, setShowConfirm] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Record<RoleType, boolean>>({
        OWNER: true,
        RESTAURANT_ADMIN: false,
        CUSTOMER: false
    });
    const [loading, setLoading] = useState(false);

    // --- Fetch users paginated ---
    const fetchUsers = async (page = 0) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {
                page,
                size: pagination.size,
                search: search.trim() || undefined,
            };
            const res = await axios.get(`${API_URL}/api/users`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.users || []);
            setPagination(prev => ({
                ...prev,
                page: res.data.currentPage,
                totalPages: res.data.totalPages,
                totalElements: res.data.totalElements
            }));
            const ids = (res.data.users || []).map((u: UserItem) => u.id);
            fetchUserImages(ids);
        } catch {
            toast.error('Error al cargar usuarios');
        }
        setLoading(false);
    };

    // --- Fetch images for visible users only ---
    const fetchUserImages = async (userIds: number[]) => {
        if (!userIds || userIds.length === 0) {
            setUserImages({});
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/users/images`, {
                params: { userIds: userIds.join(',') },
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserImages(res.data || {});
        } catch {
            setUserImages({});
        }
    };

    useEffect(() => {
        fetchUsers(0);
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        fetchUsers(0);
        // eslint-disable-next-line
    }, [search]);

    // --- Agrupar usuarios por rol ---
    const groupedUsers: Record<RoleType, UserItem[]> = {
        OWNER: [],
        RESTAURANT_ADMIN: [],
        CUSTOMER: []
    };
    users.forEach(u => {
        if (groupedUsers[u.role]) groupedUsers[u.role].push(u);
    });

    // --- Filtro búsqueda ---
    const filterFn = (user: UserItem) =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase())
        || user.email.toLowerCase().includes(search.toLowerCase())
        || user.role.toLowerCase().includes(search.toLowerCase());

    // --- Imagen de perfil base64 (solo para editar/crear) ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Solo imágenes JPG, PNG o WEBP');
            e.target.value = '';
            setFormData(prev => ({ ...prev, profileImageBase64: '' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            setFormData(prev => ({ ...prev, profileImageBase64: base64 }));
        };
        reader.readAsDataURL(file);
    };

    // --- Crear / editar usuario ---
    const handleSubmit = async () => {
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.role) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (editingUser) {
                await axios.put(`${API_URL}/api/users/${editingUser.id}`, {
                    ...formData,
                    id: editingUser.id,
                    password: formData.password || undefined
                }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success('Usuario actualizado');
            } else {
                await axios.post(`${API_URL}/api/users`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Usuario creado');
            }
            setShowAddModal(false);
            setFormData({ firstName: '', lastName: '', email: '', role: 'CUSTOMER', password: '', profileImageBase64: '' });
            setEditingUser(null);
            fetchUsers(pagination.page);
        } catch {
            toast.error('Error al guardar usuario');
        }
    };

    // --- Editar usuario ---
    const handleEdit = (user: UserItem) => {
        setEditingUser(user);
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            password: '',
            profileImageBase64: userImages[user.id] || ''
        });
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

    const confirmDeleteUser = async () => {
        if (!toDeleteId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/users/${toDeleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Usuario eliminado');
            fetchUsers(pagination.page);
        } catch {
            toast.error('Error al eliminar usuario');
        } finally {
            setShowConfirm(false);
            setToDeleteId(null);
        }
    };

    const toggleExpanded = (role: RoleType) => {
        setExpanded(prev => ({ ...prev, [role]: !prev[role] }));
    };

    const goToPage = (page: number) => {
        fetchUsers(page);
    };

    return (
        <div className="min-h-screen bg-gray-50 w-full">
            <div className="p-4 sm:p-6 space-y-6 w-full">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                        <p className="text-gray-600 mt-2">Administra todos los usuarios del sistema</p>
                    </div>
                    <div className="flex flex-col w-full md:w-auto md:flex-row md:items-center md:gap-2 mt-2 md:mt-0">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                            />
                        </div>
                        <br/>
                        <div className="flex flex-row md:flex-row w-full md:w-auto gap-2 mt-2 md:mt-0">
                            <Button icon={RefreshCw} variant="outline" onClick={() => fetchUsers(pagination.page)} />
                            <Button icon={Plus} variant="primary" onClick={() => { setShowAddModal(true); setEditingUser(null); }}>
                                Nuevo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Confirm Dialog */}
                <ConfirmDialog
                    open={showConfirm}
                    title="Eliminar usuario"
                    message="¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
                    onCancel={handleCancelDelete}
                    onConfirm={confirmDeleteUser}
                />

                {/* Modal crear/editar */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <div className="grid gap-4">
                                <div className="flex flex-col md:flex-row gap-2">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombres
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="Nombres"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Apellidos
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="Apellidos"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        placeholder="usuario@email.com"
                                        disabled={!!editingUser}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rol del Usuario
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as RoleType })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        disabled={editingUser?.role === 'OWNER'}
                                    >
                                        <option value="CUSTOMER">Cliente</option>
                                        <option value="RESTAURANT_ADMIN">Administrador de Restaurante</option>
                                        <option value="OWNER">Propietario</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña {editingUser && '(dejar vacío si no desea cambiar)'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        placeholder="Contraseña"
                                        disabled={editingUser?.role === 'OWNER'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Imagen de Perfil
                                    </label>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handleFileChange}
                                        className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#f89b01] file:text-[#181818] hover:file:bg-[#ffb933] file:cursor-pointer file:shadow-sm transition-all bg-amber-50/50 p-2.5 border border-[#f89b01]/30 rounded-2xl cursor-pointer"
                                    />
                                    {formData.profileImageBase64 && (
                                        <img
                                            src={`data:image/jpeg;base64,${formData.profileImageBase64}`}
                                            alt="Vista previa"
                                            className="w-28 h-28 object-cover mt-2 rounded-full border"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="flex space-x-3 mt-6 justify-end">
                                <Button onClick={handleSubmit} variant="primary">
                                    {editingUser ? 'Actualizar' : 'Crear'} Usuario
                                </Button>
                                <Button onClick={() => { setShowAddModal(false); setEditingUser(null); setFormData({ firstName: '', lastName: '', email: '', role: 'CUSTOMER', password: '', profileImageBase64: '' }); }} variant="outline">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS POR ROL */}
                <div className="space-y-4 w-full">
                    {(['OWNER', 'RESTAURANT_ADMIN', 'CUSTOMER'] as RoleType[]).map(role => (
                        <div key={role} className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full">
                            <button
                                onClick={() => toggleExpanded(role)}
                                className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-200 font-bold text-lg text-left group focus:outline-none"
                            >
                                <span className={`flex items-center gap-2`}>
                                    {role === 'OWNER' && <Shield className="h-5 w-5 text-purple-600" />}
                                    {role === 'RESTAURANT_ADMIN' && <User className="h-5 w-5 text-blue-600" />}
                                    {role === 'CUSTOMER' && <User className="h-5 w-5 text-green-600" />}
                                    {roleLabels[role]}
                                </span>
                                <span className="text-gray-400 group-hover:text-black transition-transform">
                                    {expanded[role] ? '▼' : '▶'}
                                </span>
                            </button>
                            {expanded[role] && (
                                <div className="divide-y divide-gray-200">
                                    {groupedUsers[role].length === 0 && (
                                        <div className="p-6 text-center text-gray-500">No hay usuarios de este tipo.</div>
                                    )}
                                    {groupedUsers[role].map((user) => (
                                        <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="bg-gray-100 p-3 rounded-full flex-shrink-0">
                                                    {userImages[user.id] ? (
                                                        <img src={`data:image/jpeg;base64,${userImages[user.id]}`} alt={user.firstName} className="h-10 w-10 rounded-full object-cover" />
                                                    ) : (
                                                        <User className="h-8 w-8 text-gray-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</h3>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                        <span className="text-gray-600 truncate">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${roleColors[user.role]} whitespace-nowrap`}>
                                                    {role === 'OWNER' && <Shield className="h-4 w-4" />}
                                                    {role !== 'OWNER' && <User className="h-4 w-4" />}
                                                    <span>{roleLabels[user.role]}</span>
                                                </div>
                                                <Button onClick={() => handleEdit(user)} variant="outline" size="sm" icon={Edit}>
                                                    Editar
                                                </Button>
                                                {user.role !== 'OWNER' && (
                                                    <Button onClick={() => handleDeleteRequest(user.id)} variant="danger" size="sm" icon={Trash2}>
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Paginación */}
                <div className="flex justify-center items-center gap-3 mt-8">
                    <Button variant="outline" disabled={pagination.page === 0} onClick={() => goToPage(pagination.page - 1)}>
                        Anterior
                    </Button>
                    <span className="text-gray-700">Página {pagination.page + 1} de {pagination.totalPages}</span>
                    <Button variant="outline" disabled={pagination.page + 1 >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>
                        Siguiente
                    </Button>
                </div>

                {users.length === 0 && (
                    <div className="text-center py-16">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay usuarios</h3>
                        <p className="text-gray-600 mb-4">Comienza agregando el primer usuario</p>
                        <Button onClick={() => setShowAddModal(true)} variant="primary" icon={Plus}>
                            Crear Primer Usuario
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
