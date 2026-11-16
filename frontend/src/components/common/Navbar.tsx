import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="bg-[#181818] shadow-md fixed top-0 left-0 w-full z-50 border-b border-[#f89b01]/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2">
                    <img
                        src="/escudo-castillo.png"
                        alt="Castillo de Amaguaña"
                        className="h-[3.5rem] w-auto drop-shadow-2xl"
                        style={{ filter: "drop-shadow(0 4px 24px #000a)" }}
                    />
                </Link>
                {/* Links */}
                <div className="flex items-center space-x-6">
                    <Link
                        to="/"
                        className={`font-medium hover:text-[#f89b01] transition ${
                            location.pathname === "/" ? "text-[#f89b01] underline underline-offset-4" : "text-gray-200"
                        }`}
                    >
                        Inicio
                    </Link>
                    <Link
                        to="/login"
                        className={`font-medium hover:text-[#f89b01] transition ${
                            location.pathname === "/login" ? "text-[#f89b01] underline underline-offset-4" : "text-gray-200"
                        }`}
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
