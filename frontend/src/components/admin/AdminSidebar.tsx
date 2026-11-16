import React from "react";
import { BarChart3, Home, FileText, CupSoda, QrCode, Settings, LogOut, X } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const adminMenuItems = [
    { icon: Home, label: "Inicio", path: "/admin/home" },
    { icon: BarChart3, label: "Dashboard", path: "/admin/dashboard" },
    { icon: FileText, label: "Mi Menú", path: "/admin/menu" },
    { icon: QrCode, label: "QR del Restaurante", path: "/admin/qr-codes" },
    { icon: Settings, label: "Configuración", path: "/admin/settings" },
];

const AdminSidebar: React.FC<{
    open: boolean;
    onClose: () => void;
    collapsed: boolean;
    onCollapse: () => void;
}> = ({ open, onClose, collapsed, onCollapse }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <>
            {/* Overlay para mobile */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] bg-[#181818] border-r border-[#f89b01]/20 shadow-2xl flex flex-col
                    transition-all duration-300 ease-in-out                  
                    ${open ? 'translate-x-0' : '-translate-x-full'} w-64                 
                    md:translate-x-0 ${collapsed ? 'md:w-20' : 'md:w-64'}
                `}
            >
                {/* Header del sidebar */}
                <div className="flex justify-between items-center p-3 border-b border-[#f89b01]/15">
                    {/* Botón colapsar desktop */}
                    <button
                        onClick={onCollapse}
                        className="hidden md:flex text-[#f89b01] hover:bg-[#232323]/50 p-2 rounded-lg transition-colors"
                        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                    >
                        {collapsed ? (
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 6l6 6-6 6" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 6l-6 6 6 6" />
                            </svg>
                        )}
                    </button>

                    {/* Título cuando no está colapsado */}
                    <div className={`flex-1 ml-2 ${collapsed ? 'md:hidden' : ''}`}>
                        <h2 className="text-lg font-bold text-[#f89b01]">Panel de Restaurante</h2>
                        <p className="text-xs text-[#c7c7c7]">Gestión de tu restaurante</p>
                    </div>

                    {/* Botón cerrar mobile */}
                    <button
                        onClick={onClose}
                        className="md:hidden text-[#f89b01] hover:bg-[#232323]/50 p-2 rounded-full transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navegación */}
                <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
                    {adminMenuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group
                                    ${isActive
                                    ? "bg-[#f89b01] text-[#181818] shadow-md"
                                    : "text-[#ececec] hover:bg-[#232323] hover:text-[#f89b01]"
                                }
                                    ${collapsed ? "md:justify-center md:px-2" : ""}
                                `}
                                onClick={onClose} // Cierra el sidebar en mobile al hacer click
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon
                                    className={`h-5 w-5 flex-shrink-0 ${
                                        isActive ? "text-[#181818]" : "text-[#ececec] group-hover:text-[#f89b01]"
                                    }`}
                                />
                                <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Botón cerrar sesión */}
                <div className="p-4 mt-auto">
                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-red-600 border border-red-600/60 bg-[#181818]
                            hover:bg-red-700 hover:text-white hover:shadow-lg transition-all w-full
                            ${collapsed ? "md:justify-center md:px-2" : ""}
                        `}
                        title={collapsed ? "Cerrar Sesión" : undefined}
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        <span className={`${collapsed ? "md:hidden" : ""}`}>
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;