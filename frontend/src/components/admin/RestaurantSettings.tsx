import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Camera, User, X, Eye, EyeOff, Lock } from 'lucide-react';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_URL = "";

// -------- PERFIL DE USUARIO ---------
interface UserProfileData {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profileImageBase64?: string;
}

// -------- ZONA --------
interface ZoneData {
    id: number;
    name: string;
}

const RestaurantSettings: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const restaurantId = user?.restaurantId;

    // Restaurante
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [showRestImageModal, setShowRestImageModal] = useState(false);
    const [zones, setZones] = useState<ZoneData[]>([]);
    const [form, setForm] = useState({
        name: "",
        description: "",
        imageBase64: "",
        zoneId: "",
        status: ""
    });

    // Usuario
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [userForm, setUserForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        profileImageBase64: ''
    });
    const [userEditMode, setUserEditMode] = useState(false);
    const [userLoading, setUserLoading] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    // Cambiar contraseña
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);
    const [changePasswordMode, setChangePasswordMode] = useState(false);
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        repeatPassword: ''
    });

    // -------- Traer datos restaurante --------
    useEffect(() => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetchRestaurant = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/restaurants/${restaurantId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRestaurant(res.data);
                setForm({
                    name: res.data.name || "",
                    description: res.data.description || "",
                    imageBase64: res.data.imageBase64 || "",
                    zoneId: res.data.zoneId || "",
                    status: res.data.status || "",
                });
            } catch {
                toast.error("Error al cargar datos del restaurante");
            }
            setLoading(false);
        };
        fetchRestaurant();
    }, [restaurantId]);

    // -------- Traer zonas --------
    useEffect(() => {
        const fetchZones = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/zones`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setZones(res.data);
            } catch {
                setZones([]);
            }
        };
        fetchZones();
    }, []);

    // -------- Traer perfil usuario --------
    const fetchProfile = async () => {
        setUserLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<UserProfileData>(`${API_URL}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            setUserForm({
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                email: res.data.email,
                role: res.data.role,
                profileImageBase64: res.data.profileImageBase64 || ''
            });
        } catch (err) {
            toast.error('Error al cargar perfil');
        }
        setUserLoading(false);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // --------- Editar datos restaurante -----------
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Solo imágenes JPG, PNG o WEBP");
            e.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes(",") ? result.split(",")[1] : result;
            setForm((prev) => ({ ...prev, imageBase64: base64 }));
        };
        reader.readAsDataURL(file);
    };
    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        if (!form.zoneId) {
            toast.error("Selecciona una zona");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(`${API_URL}/restaurants/${restaurantId}`, {
                name: form.name,
                description: form.description,
                imageBase64: form.imageBase64,
                status: form.status, // ¡Importante mantener el status!
                zoneId: form.zoneId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Cambios guardados");
            setEditMode(false);
            setRestaurant(res.data);
        } catch (e: any) {
            if (e.response?.status === 403) {
                toast.error("No tienes permisos para editar este restaurante.");
            } else {
                toast.error("No se pudo actualizar la información");
            }
        }
    };
    const handleCancel = () => {
        setEditMode(false);
        if (restaurant) {
            setForm({
                name: restaurant.name || "",
                description: restaurant.description || "",
                imageBase64: restaurant.imageBase64 || "",
                zoneId: restaurant.zoneId || "",
                status: restaurant.status || ""
            });
        }
    };

    // --------- Editar perfil usuario -----------
    const handleUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Solo imágenes JPG, JPEG, PNG o WEBP');
            e.target.value = '';
            setUserForm(prev => ({ ...prev, profileImageBase64: '' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            setUserForm(prev => ({ ...prev, profileImageBase64: base64 }));
        };
        reader.readAsDataURL(file);
    };
    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleUserSave = async () => {
        if (!userForm.firstName.trim() || !userForm.lastName.trim()) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/users/me`, {
                ...userForm
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Perfil actualizado');
            setUserEditMode(false);
            fetchProfile();
            await refreshUser();
        } catch (e: any) {
            if (e.response?.status === 403) {
                toast.error("No tienes permisos para editar tu perfil.");
            } else {
                toast.error('Error al actualizar perfil');
            }
        }
    };
    const handleUserCancel = () => {
        setUserEditMode(false);
        if (profile) {
            setUserForm({
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                role: profile.role,
                profileImageBase64: profile.profileImageBase64 || ''
            });
        }
        setChangePasswordMode(false);
        setPasswords({ oldPassword: '', newPassword: '', repeatPassword: '' });
    };

    // --------- Cambiar contraseña usuario ----------
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleChangePassword = async () => {
        if (!passwords.oldPassword || !passwords.newPassword || !passwords.repeatPassword) {
            toast.error('Completa todos los campos de contraseña');
            return;
        }
        if (passwords.newPassword !== passwords.repeatPassword) {
            toast.error('Las nuevas contraseñas no coinciden');
            return;
        }
        if (passwords.newPassword.length < 3) {
            toast.error('La nueva contraseña debe tener al menos 3 caracteres');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/users/change-password`, {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Contraseña actualizada');
            setChangePasswordMode(false);
            setPasswords({ oldPassword: '', newPassword: '', repeatPassword: '' });
        } catch (e: any) {
            if (e.response?.status === 403) {
                toast.error(e.response.data || "No autorizado para cambiar contraseña");
            } else {
                toast.error(e.response?.data || 'Error al cambiar contraseña');
            }
        }
    };

    if (loading || userLoading || !profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Cargando configuración...</div>
            </div>
        );
    }
    if (!restaurant) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-600">No se encontró el restaurante</div>
            </div>
        );
    }

    const isOwner = userForm.role === 'OWNER';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 py-10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card Restaurante */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Restaurante</h2>
                        <p className="text-gray-600 mb-6 text-center">Información de tu restaurante</p>
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => setShowRestImageModal(true)}
                                className="focus:outline-none"
                                title="Ver imagen grande"
                            >
                                <div className="w-28 h-28 rounded-xl bg-gray-100 border flex items-center justify-center mb-2 overflow-hidden shadow cursor-pointer hover:ring-4 hover:ring-[#f89b01]/40 transition-all">
                                    {form.imageBase64
                                        ? <img src={`data:image/jpeg;base64,${form.imageBase64}`} alt="Restaurante" className="w-28 h-28 object-cover rounded-xl" />
                                        : <Camera className="w-14 h-14 text-gray-400" />}
                                </div>
                            </button>
                            {editMode && !isOwner && (
                                <label className="bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold cursor-pointer hover:bg-orange-700 transition mb-2">
                                    <Camera className="inline mr-2" />
                                    Cambiar imagen
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                        <div className="space-y-4 mt-6">
                            <div>
                                <label className="block font-semibold mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    disabled={!editMode || isOwner}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Nombre del restaurante"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    disabled={!editMode || isOwner}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg"
                                    rows={3}
                                    placeholder="Describe tu restaurante"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Zona</label>
                                {editMode && !isOwner ? (
                                    <select
                                        name="zoneId"
                                        value={form.zoneId}
                                        onChange={handleChange}
                                        className="w-full p-3 border rounded-lg"
                                    >
                                        <option value="">Selecciona una zona...</option>
                                        {zones.map(zone => (
                                            <option key={zone.id} value={zone.id}>
                                                {zone.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={
                                            zones.find(z => z.id === form.zoneId)?.name ||
                                            restaurant?.zone?.name || ''
                                        }
                                        disabled
                                        className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            {!editMode ? (
                                <Button
                                    variant="primary"
                                    onClick={() => !isOwner && setEditMode(true)}
                                    className="flex-1"
                                    disabled={isOwner}
                                >
                                    Editar información
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="success"
                                        onClick={handleSave}
                                        className="flex-1"
                                        disabled={isOwner}
                                    >
                                        Guardar cambios
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancel}
                                        icon={X}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                </>
                            )}
                        </div>
                        {/* Modal imagen restaurante */}
                        {showRestImageModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                                <div className="relative bg-white rounded-2xl shadow-2xl p-4 flex flex-col items-center">
                                    <button
                                        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition"
                                        onClick={() => setShowRestImageModal(false)}
                                        aria-label="Cerrar"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    {form.imageBase64
                                        ? (
                                            <img
                                                src={`data:image/jpeg;base64,${form.imageBase64}`}
                                                alt="Imagen grande restaurante"
                                                className="w-96 h-96 object-cover rounded-xl border shadow-xl"
                                            />
                                        )
                                        : (
                                            <Camera className="w-36 h-36 text-gray-400" />
                                        )
                                    }
                                </div>
                            </div>
                        )}
                        {isOwner && (
                            <div className="mt-6 text-center text-orange-500 text-sm font-medium">
                                Los OWNER no pueden editar los datos del restaurante.
                            </div>
                        )}
                    </div>

                    {/* Card Usuario */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Tu usuario</h2>
                        <p className="text-gray-600 mb-6 text-center">Actualiza tu información personal y foto de perfil</p>
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => !isOwner && setShowImageModal(true)}
                                className={`focus:outline-none ${isOwner ? 'cursor-not-allowed opacity-70' : ''}`}
                                title={isOwner ? "No disponible para OWNER" : "Ver foto de perfil"}
                                disabled={isOwner}
                            >
                                <div className="w-28 h-28 rounded-full bg-gray-100 border flex items-center justify-center mb-2 overflow-hidden shadow cursor-pointer hover:ring-4 hover:ring-[#f89b01]/40 transition-all">
                                    {userForm.profileImageBase64
                                        ? <img src={`data:image/jpeg;base64,${userForm.profileImageBase64}`} alt="Perfil" className="w-28 h-28 object-cover rounded-full" />
                                        : <User className="w-14 h-14 text-gray-400" />}
                                </div>
                            </button>
                            {userEditMode && !isOwner && (
                                <label className="bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold cursor-pointer hover:bg-orange-700 transition mb-2">
                                    <Camera className="inline mr-2" />
                                    Cambiar imagen
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUserImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                        <div className="space-y-4 mt-6">
                            <div>
                                <label className="block font-semibold mb-1">Nombres</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={userForm.firstName}
                                    disabled={!userEditMode || isOwner}
                                    onChange={handleUserChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Nombres"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Apellidos</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={userForm.lastName}
                                    disabled={!userEditMode || isOwner}
                                    onChange={handleUserChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="Apellidos"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Correo electrónico</label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    disabled
                                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        {/* Cambio de contraseña */}
                        {userEditMode && !isOwner && (
                            <div className="space-y-3 mt-4">
                                {!changePasswordMode ? (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setChangePasswordMode(true)}
                                        icon={Lock}
                                    >
                                        Cambiar contraseña
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block font-semibold mb-1">Contraseña actual</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="oldPassword"
                                                    value={passwords.oldPassword}
                                                    onChange={handlePasswordChange}
                                                    className="w-full p-3 border rounded-lg pr-10"
                                                    placeholder="Contraseña actual"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-400"
                                                    tabIndex={-1}
                                                    onClick={() => setShowPassword(val => !val)}
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">Nueva contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    name="newPassword"
                                                    value={passwords.newPassword}
                                                    onChange={handlePasswordChange}
                                                    className="w-full p-3 border rounded-lg pr-10"
                                                    placeholder="Nueva contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-400"
                                                    tabIndex={-1}
                                                    onClick={() => setShowNewPassword(val => !val)}
                                                >
                                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">Repetir nueva contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type={showRepeatPassword ? "text" : "password"}
                                                    name="repeatPassword"
                                                    value={passwords.repeatPassword}
                                                    onChange={handlePasswordChange}
                                                    className="w-full p-3 border rounded-lg pr-10"
                                                    placeholder="Repite la nueva contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-400"
                                                    tabIndex={-1}
                                                    onClick={() => setShowRepeatPassword(val => !val)}
                                                >
                                                    {showRepeatPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="success"
                                                className="flex-1"
                                                onClick={handleChangePassword}
                                            >
                                                Guardar nueva contraseña
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setChangePasswordMode(false);
                                                    setPasswords({ oldPassword: '', newPassword: '', repeatPassword: '' });
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Guardar/cancelar SOLO si NO se está editando contraseña */}
                        {userEditMode && !changePasswordMode && (
                            <div className="flex gap-3 mt-8">
                                <Button
                                    variant="success"
                                    onClick={handleUserSave}
                                    className="flex-1"
                                    disabled={isOwner}
                                >
                                    Guardar cambios
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleUserCancel}
                                    icon={X}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        )}

                        {/* Botón para editar */}
                        {!userEditMode && (
                            <Button
                                variant="primary"
                                onClick={() => !isOwner && setUserEditMode(true)}
                                className="flex-1 mt-8"
                                disabled={isOwner}
                            >
                                Editar información
                            </Button>
                        )}

                        {/* Modal imagen usuario */}
                        {showImageModal && !isOwner && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                                <div className="relative bg-white rounded-2xl shadow-2xl p-4 flex flex-col items-center">
                                    <button
                                        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition"
                                        onClick={() => setShowImageModal(false)}
                                        aria-label="Cerrar"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    {userForm.profileImageBase64
                                        ? (
                                            <img
                                                src={`data:image/jpeg;base64,${userForm.profileImageBase64}`}
                                                alt="Foto de perfil grande"
                                                className="w-96 h-96 object-cover rounded-full border shadow-xl"
                                            />
                                        )
                                        : (
                                            <User className="w-36 h-36 text-gray-400" />
                                        )
                                    }
                                </div>
                            </div>
                        )}
                        {isOwner && (
                            <div className="mt-6 text-center text-orange-500 text-sm font-medium">
                                Los OWNER no pueden editar su información ni contraseña por seguridad.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantSettings;
