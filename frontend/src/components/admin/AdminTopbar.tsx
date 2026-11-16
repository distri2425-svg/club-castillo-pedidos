import React from 'react';
import { Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminTopbarProps {
    onMenuClick: () => void;
}

const AdminTopbar: React.FC<AdminTopbarProps> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Traducción de roles
    const translateRole = (role: string) => {
        const roleTranslations: { [key: string]: string } = {
            'OWNER': 'SuperAdmin',
            'RESTAURANT_ADMIN': 'Admin Restaurante',
            'CUSTOMER': 'Cliente',
        };
        return roleTranslations[role] || role;
    };

    const handleHomeClick = () => {
        navigate('/admin/dashboard');
    };

    const handleProfileClick = () => {
        navigate('/admin/settings');
    };

    // Imagen de perfil (sólo JPEG porque tu backend solo usa JPEG por ahora)
    const getProfileImageSrc = () => {
        const base64 = user?.profileImageBase64;
        if (!base64 || base64.length < 30) return null;
        return `data:image/jpeg;base64,${base64}`;
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#181818] border-b border-[#f89b01]/20 shadow-2xl h-16">
            <div className="flex items-center justify-between px-4 py-2 h-16">
                {/* Left side - Menu button + Logo/Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 rounded-lg text-[#f89b01] hover:bg-[#232323]/50 transition-colors"
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <button
                        onClick={handleHomeClick}
                        className="flex items-center gap-2 px-6 py-1 rounded-lg hover:bg-[#232323]/50 transition-colors group"
                    >
                        <div className="flex items-center gap-2">
                            <img
                                src="/escudo-castillo.png"
                                alt="Club Castillo de Amaguaña"
                                className="h-14 w-auto hidden sm:block"
                            />
                        </div>
                    </button>
                </div>

                {/* Right side - User info */}
                <div
                    className="
                        flex items-center gap-3 px-3 py-1 rounded-full
                        bg-[#181818]/90 border border-[#f89b01]/30 shadow
                        hover:shadow-lg hover:bg-[#181818]/95
                        cursor-pointer transition-all duration-200
                        group
                    "
                    onClick={handleProfileClick}
                    title="Ir a perfil"
                >
                    {/* Avatar compacto */}
                    <div className="relative w-11 h-11 flex-shrink-0 ml-1 mr-3">
                        {/* Anillo exterior (si lo quieres, sino quítalo) */}
                        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#f89b01] to-[#ffb933]" />
                        {getProfileImageSrc() ? (
                            <img
                                src={getProfileImageSrc()!}
                                alt="Foto de perfil"
                                className="w-full h-full object-cover rounded-full border-2 border-white relative z-10"
                                style={{ display: "block" }}
                            />
                        ) : (
                            <User className="w-8 h-8 text-gray-300 mx-auto my-auto z-10 relative" />
                        )}
                    </div>

                    {/* Nombre y badge de rol */}
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#ececec] text-sm leading-tight truncate">{user?.name}</span>
                        <span
                            className="
                                inline-block mt-1 px-2 py-0.5 rounded-full
                                bg-[#f89b01]/15 text-[#f89b01] text-xs font-semibold tracking-wide
                                shadow-inner
                            "
                        >
                            {translateRole(user?.role || "RESTAURANT_ADMIN")}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminTopbar;