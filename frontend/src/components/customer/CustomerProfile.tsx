import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import { ArrowLeft, Download, Trash2, Package, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../customer/CartProvider';
import api from '../../services/api';

/**
 * Perfil del socio.
 *
 * Desde esta vista el titular ejerce los derechos que la LOPDP le reconoce y
 * que el servidor ya expone:
 *  - Acceso (Art. 13): historial de sus propios pedidos.
 *  - Rectificacion (Art. 14): nombres y apellidos, persistidos en el servidor.
 *  - Supresion (Art. 15): baja de la cuenta con anonimizacion de los datos.
 *  - Portabilidad (Art. 17): exportacion de sus datos en formato JSON.
 * En la version anterior el boton de guardar no llamaba al servidor y los
 * demas derechos solo podian ejercerse invocando la API directamente.
 */

interface PedidoPropio {
    id: number;
    total: number;
    status: string;
    createdAt: string;
    restaurant: string | null;
}

const ETIQUETA_ESTADO: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'En preparación',
    READY: 'Listo para retirar',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
};

const CustomerProfile: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { clearCart } = useCart();

    // Extrae restId de la query para volver al restaurante si aplica
    const params = new URLSearchParams(location.search);
    const restId = params.get('restId');

    const esCliente = user?.role === 'CUSTOMER';

    // --- Estado del formulario (solo CUSTOMER) ---
    const [profileData, setProfileData] = useState({ firstName: '', lastName: '', email: '' });
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pedidos, setPedidos] = useState<PedidoPropio[]>([]);
    const [cargandoPedidos, setCargandoPedidos] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [confirmarBaja, setConfirmarBaja] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    // Carga de los datos del titular y de su historial
    useEffect(() => {
        if (!esCliente) return;
        let cancelado = false;

        api.get('/users/me')
            .then(({ data }) => {
                if (cancelado) return;
                setProfileData({
                    firstName: data.firstName ?? '',
                    lastName: data.lastName ?? '',
                    email: data.email ?? '',
                });
            })
            .catch(() => toast.error('No se pudo cargar el perfil'));

        setCargandoPedidos(true);
        api.get<PedidoPropio[]>('/users/me/orders')
            .then(({ data }) => {
                if (cancelado) return;
                const ordenados = [...data].sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setPedidos(ordenados);
            })
            .catch(() => toast.error('No se pudo cargar el historial de pedidos'))
            .finally(() => { if (!cancelado) setCargandoPedidos(false); });

        return () => { cancelado = true; };
    }, [esCliente]);

    // --- FUNCIÓN PARA TOAST POR ROL ---
    const toastLogout = (role: string) => {
        let msg = "¡Sesión cerrada!";
        let icon = "👋";
        let color = "#b9770e";
        const bg = "#fffbe9";
        switch (role) {
            case "OWNER":
                msg = "¡Sesión cerrada! Gracias por liderar la experiencia del Castillo.";
                icon = "🏰";
                color = "#4e44c7";
                break;
            case "RESTAURANT_ADMIN":
                msg = "¡Hasta luego! Tus mesas te esperan en la próxima gestión.";
                icon = "🥘";
                color = "#f39c12";
                break;
            case "CUSTOMER":
                msg = "¡Vuelve pronto al Club Castillo! Tu mesa siempre estará lista";
                icon = "🍽️";
                color = "#218c5a";
                break;
            case "INVITED":
                msg = "¡Gracias por tu visita! Esperamos que disfrutes tu experiencia como invitado.";
                icon = "🎟️";
                color = "#9e9e9e";
                break;
            default:
                msg = "Sesión cerrada. ¡Hasta la próxima!";
                icon = "👋";
                color = "#222";
        }

        toast.success(msg, {
            icon,
            style: {
                borderRadius: '16px',
                background: bg,
                color,
                fontWeight: 600,
                fontSize: 16,
            }
        });
    };

    // --- BOTÓN VOLVER: vuelve al restaurante visitado o listado general ---
    const handleReturn = () => {
        if (restId) {
            navigate(`/customer/restaurant/${restId}`);
        } else {
            navigate('/customer/restaurants');
        }
    };

    const cerrarSesion = (role: string) => {
        logout();
        clearCart();
        toastLogout(role);
        navigate('/login');
    };

    // --- Rectificación (Art. 14): PUT /api/users/me ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
            toast.error('Los nombres y apellidos son obligatorios');
            return;
        }
        setSaving(true);
        try {
            await api.put('/users/me', {
                firstName: profileData.firstName.trim(),
                lastName: profileData.lastName.trim(),
                profileImageBase64: user?.profileImageBase64 || null,
            });
            await refreshUser();
            setEditing(false);
            toast.success("Datos actualizados correctamente ✅", {
                icon: '💾',
                style: { borderRadius: '16px', background: '#eafaf1', color: '#218c5a', fontWeight: 600 }
            });
        } catch {
            toast.error('No se pudieron guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    // --- Portabilidad (Art. 17): GET /api/users/me/export ---
    const handleExport = async () => {
        setExportando(true);
        try {
            const { data } = await api.get('/users/me/export');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `mis-datos-club-castillo-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            toast.success('Tus datos se descargaron en formato JSON');
        } catch {
            toast.error('No se pudo exportar la información');
        } finally {
            setExportando(false);
        }
    };

    // --- Supresión (Art. 15): DELETE /api/users/me ---
    const handleDeleteAccount = async () => {
        setEliminando(true);
        try {
            await api.delete('/users/me');
            setConfirmarBaja(false);
            toast.success('Tus datos personales fueron eliminados. Sesión cerrada.');
            logout();
            clearCart();
            navigate('/login');
        } catch {
            toast.error('No se pudo eliminar la cuenta');
        } finally {
            setEliminando(false);
        }
    };

    // --- INVITED: sólo un mensaje de no permitido y cerrar sesión ---
    if (user?.role === "INVITED") {
        return (
            <div className="p-6 max-w-sm mx-auto flex flex-col items-center mt-16">
                <div className="mt-3 p-5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-center flex flex-col items-center">
                    <span className="text-2xl mb-2">🎟️</span>
                    <span className="text-lg font-semibold mb-1">¡Hola, invitado!</span>
                    <span>
                        No puedes ver tu perfil ni historial, pero <b>¡puedes explorar el menú y hacer tus pedidos sin problema!</b>
                    </span>
                    <span className="mt-2">Gracias por visitarnos, <b>¡te esperamos pronto como socio!</b> 🤗</span>
                </div>

                <Button className="mt-8 w-full" variant="danger" onClick={() => cerrarSesion("INVITED")}>
                    Cerrar Sesión
                </Button>
            </div>
        );
    }

    // --- OWNER / ADMIN: sólo visual, sin edición ---
    if (user && ["OWNER", "RESTAURANT_ADMIN"].includes(user.role)) {
        return (
            <div className="p-6 max-w-md mx-auto relative mt-12">
                <button
                    onClick={handleReturn}
                    className="absolute left-0 top-0 flex items-center text-sm text-blue-700 hover:underline hover:text-blue-900 transition"
                    style={{ outline: 'none' }}
                >
                    <ArrowLeft className="w-5 h-5 mr-1" /> Volver
                </button>
                <div className="flex flex-col items-center pt-10">
                    <img
                        src={user.profileImageBase64 ? `data:image/jpeg;base64,${user.profileImageBase64}` : '/avatar-placeholder.png'}
                        alt="Foto de perfil"
                        className="w-28 h-28 rounded-full border-4 border-gray-200 mb-3"
                    />
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-gray-500 mb-4">{user.email}</p>
                    <div className="mt-3 p-5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-center flex flex-col items-center">
                        <span className="text-2xl mb-2">🔒</span>
                        Por Seguridad, no puedes modificar tus datos desde aquí.<br />
                        Utiliza el panel de administración para cualquier cambio.
                    </div>
                    <Button className="mt-8 w-full" variant="danger" onClick={() => cerrarSesion(user.role)}>
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // --- CUSTOMER: edición, historial, exportación y baja ---
    return (
        <div className="p-6 max-w-2xl mx-auto relative mt-12 space-y-8">
            <button
                onClick={handleReturn}
                className="absolute left-0 top-0 flex items-center text-sm text-blue-700 hover:underline hover:text-blue-900 transition"
                style={{ outline: 'none' }}
            >
                <ArrowLeft className="w-5 h-5 mr-1" /> Volver
            </button>

            {/* Datos personales */}
            <div className="flex flex-col items-center pt-10">
                <img
                    src={user.profileImageBase64 ? `data:image/jpeg;base64,${user.profileImageBase64}` : '/avatar-placeholder.png'}
                    alt="Foto de perfil"
                    className="w-28 h-28 rounded-full border-4 border-gray-200 mb-3"
                />
                <h2 className="text-xl font-bold mb-2">
                    {`${profileData.firstName} ${profileData.lastName}`.trim() || user.name}
                </h2>
                <p className="text-gray-500 mb-4">{profileData.email || user.email}</p>
                <form className="w-full max-w-md" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
                            <input
                                name="firstName"
                                value={profileData.firstName}
                                disabled={!editing}
                                onChange={handleChange}
                                className="w-full p-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f89b01] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                            <input
                                name="lastName"
                                value={profileData.lastName}
                                disabled={!editing}
                                onChange={handleChange}
                                className="w-full p-3 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f89b01] focus:border-transparent"
                            />
                        </div>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                    <input
                        name="email"
                        value={profileData.email}
                        disabled
                        className="w-full p-3 mb-4 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <div className="flex gap-2">
                        {/* Cada boton lleva su propia key: sin ella React reutilizaba el
                            mismo <button> y lo convertia en "submit" durante el clic de
                            "Editar", con lo que el formulario se enviaba y la edicion se
                            cerraba de inmediato. */}
                        {!editing ? (
                            <Button key="editar" type="button" variant="primary" onClick={() => setEditing(true)}>Editar</Button>
                        ) : (
                            <>
                                <Button key="guardar" type="submit" variant="success" loading={saving}>Guardar</Button>
                                <Button key="cancelar" type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                            </>
                        )}
                    </div>
                </form>
            </div>

            {/* Historial de pedidos (Art. 13) */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#f89b01]/20 p-5">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-[#f89b01]" /> Mis pedidos
                </h3>
                {cargandoPedidos ? (
                    <p className="text-sm text-gray-500">Cargando historial...</p>
                ) : pedidos.length === 0 ? (
                    <p className="text-sm text-gray-500">Todavía no registras pedidos.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {pedidos.map((p) => (
                            <li key={p.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900">
                                        Pedido #{p.id} · {p.restaurant ?? 'Restaurante'}
                                    </p>
                                    <p className="text-gray-500">{new Date(p.createdAt).toLocaleString('es-EC')}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-[#f89b01]">${Number(p.total).toFixed(2)}</p>
                                    <p className="text-xs text-gray-600">{ETIQUETA_ESTADO[p.status] ?? p.status}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Derechos LOPDP (Arts. 15 y 17) */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#f89b01]/20 p-5">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-[#f89b01]" /> Tus datos personales
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Conforme a la Ley Orgánica de Protección de Datos Personales puedes descargar la
                    información que el club conserva sobre ti o solicitar su eliminación.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" icon={Download} onClick={handleExport} loading={exportando}>
                        Descargar mis datos
                    </Button>
                    <Button variant="danger" icon={Trash2} onClick={() => setConfirmarBaja(true)}>
                        Eliminar mi cuenta
                    </Button>
                </div>
            </div>

            <Button className="w-full" variant="danger" onClick={() => cerrarSesion("CUSTOMER")}>
                Cerrar Sesión
            </Button>

            <ConfirmDialog
                open={confirmarBaja}
                title="Eliminar mi cuenta"
                message="Tus nombres, correo e imagen serán sustituidos y tus pedidos quedarán desvinculados de tu identidad. Esta acción no se puede deshacer. ¿Deseas continuar?"
                confirmText={eliminando ? 'Eliminando...' : 'Sí, eliminar mis datos'}
                onCancel={() => setConfirmarBaja(false)}
                onConfirm={handleDeleteAccount}
            />
        </div>
    );
};

export default CustomerProfile;
