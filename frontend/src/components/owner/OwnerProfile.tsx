import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, X } from 'lucide-react';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext'; // Importar useAuth

const API_URL = '';

interface OwnerProfileData {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImageBase64?: string;
}

const OwnerProfile: React.FC = () => {
    const { refreshUser } = useAuth(); // Obtener función de refresh
    const [profile, setProfile] = useState<OwnerProfileData | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        profileImageBase64: ''
    });
    const [loading, setLoading] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    // Traer datos del OWNER al iniciar
    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get<OwnerProfileData>(`${API_URL}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            setFormData({
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                email: res.data.email,
                profileImageBase64: res.data.profileImageBase64 || ''
            });
        } catch (err) {
            toast.error('Error al cargar perfil');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Manejo imagen de perfil
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Solo imágenes JPG, JPEG, PNG o WEBP');
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

    // Guardar cambios de perfil
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/users/me`, {
                ...formData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Perfil actualizado');
            fetchProfile();
            // Refrescar los datos del usuario en el contexto para que se actualice el navbar
            await refreshUser();
        } catch {
            toast.error('Error al actualizar perfil');
        }
    };

    if (loading || !profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Cargando perfil...</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8 mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Perfil</h2>
            <p className="text-gray-600 mb-6 text-center">Actualiza tu información personal y foto de perfil</p>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => setShowImageModal(true)}
                        className="focus:outline-none"
                        title="Ver foto de perfil"
                    >
                        <div className="w-28 h-28 rounded-full bg-gray-100 border flex items-center justify-center mb-2 overflow-hidden shadow cursor-pointer hover:ring-4 hover:ring-[#f89b01]/40 transition-all">
                            {formData.profileImageBase64
                                ? <img src={`data:image/jpeg;base64,${formData.profileImageBase64}`} alt="Perfil" className="w-28 h-28 object-cover rounded-full" />
                                : <User className="w-14 h-14 text-gray-400" />}
                        </div>
                    </button>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#f89b01] file:text-[#181818] hover:file:bg-[#ffb933] file:cursor-pointer file:shadow-sm transition-all bg-amber-50/50 p-2.5 border border-[#f89b01]/30 rounded-2xl cursor-pointer"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                    <input
                        type="text"
                        value={formData.firstName}
                        onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="Nombres"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                    <input
                        type="text"
                        value={formData.lastName}
                        onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="Apellidos"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" variant="primary">
                        Guardar cambios
                    </Button>
                </div>
            </form>

            {/* Modal para ver la foto en grande */}
            {showImageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="relative bg-white rounded-2xl shadow-2xl p-4 flex flex-col items-center">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition"
                            onClick={() => setShowImageModal(false)}
                            aria-label="Cerrar"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={`data:image/jpeg;base64,${formData.profileImageBase64}`}
                            alt="Foto de perfil grande"
                            className="w-96 h-96 object-cover rounded-full border shadow-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerProfile;