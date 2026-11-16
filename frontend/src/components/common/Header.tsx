import React from 'react';
import { LogOut, User, Home, QrCode, Package, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const { user, isGuest, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleHomeClick = () => {
        if (user?.role === 'OWNER') {
            navigate('/owner/dashboard');
        } else if (user?.role === 'RESTAURANT_ADMIN') {
            navigate('/admin/dashboard');
        } else {
            navigate('/customer/restaurants');
        }
    };

    const handleProfileClick = () => {
        if (user?.role === 'CUSTOMER') {
            navigate('/customer/profile');
        }
    };

    const handleQRScannerClick = () => {
        navigate('/customer/qr-scanner');
    };

    const handleOrdersClick = () => {
        navigate('/customer/orders');
    };

    return (
        <header className="bg-[#181818] border-b border-[#f89b01]/40 shadow-md fixed top-0 left-0 w-full z-40 h-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                {/* LOGO + NOMBRE */}
                <button
                    onClick={handleHomeClick}
                    className="flex items-center gap-2 group focus:outline-none"
                >
                    <img
                        src="/escudo-castillo.png"
                        alt="Castillo de Amaguaña"
                        className="h-9 w-auto drop-shadow-lg"
                    />
                    <span className="hidden sm:block font-bold text-lg md:text-xl text-[#f89b01] group-hover:text-white transition">
                        Club Castillo de Amaguañass
                    </span>
                </button>

                {/* NAV PARA OWNER */}
                <div className="flex items-center gap-5">
                    {/* User Info */}
                    <div className="flex items-center gap-2 text-gray-100">
                        <User className="h-5 w-5 text-[#f89b01]" />
                        <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-sm">
                                {isGuest ? 'Invitado' : user?.name || 'Usuario'}
                            </span>
                            {user?.role && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#232323] text-[#f89b01] font-semibold text-center">
                                    {user.role === 'OWNER' ? 'Propietario' :
                                        user.role === 'RESTAURANT_ADMIN' ? 'Admin Restaurant' : 'Cliente'}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Acciones rápidas para cliente */}
                    {(user?.role === 'CUSTOMER' || isGuest) && (
                        <>
                            <button
                                onClick={handleQRScannerClick}
                                className="hidden md:flex items-center gap-1 text-[#f89b01] hover:text-white px-2 py-1 rounded transition"
                            >
                                <QrCode className="h-5 w-5" />
                                <span>Escanear QR</span>
                            </button>
                            <button
                                onClick={handleOrdersClick}
                                className="hidden md:flex items-center gap-1 text-[#f89b01] hover:text-white px-2 py-1 rounded transition"
                            >
                                <Package className="h-5 w-5" />
                                <span>Mis Pedidos</span>
                            </button>
                        </>
                    )}
                    {user?.role === 'CUSTOMER' && (
                        <button
                            onClick={handleProfileClick}
                            className="hidden md:flex items-center gap-1 text-[#f89b01] hover:text-white px-2 py-1 rounded transition"
                        >
                            <UserCircle className="h-5 w-5" />
                            <span>Perfil</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
