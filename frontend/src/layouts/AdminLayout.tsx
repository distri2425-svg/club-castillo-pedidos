import React, { useState } from 'react';
import AdminTopbar from '../components/admin/AdminTopbar';
import AdminSidebar from '../components/admin/AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
    noPadding?: boolean;
    noTopPadding?: boolean; // Nueva prop para quitar solo el padding-top
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
                                                     children,
                                                     noPadding = false,
                                                     noTopPadding = false
                                                 }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);
    const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

    return (
        <div className="min-h-screen">
            <AdminTopbar onMenuClick={toggleSidebar} />
            <div className="flex">
                <AdminSidebar
                    open={sidebarOpen}
                    onClose={closeSidebar}
                    collapsed={sidebarCollapsed}
                    onCollapse={toggleCollapse}
                />
                <main
                    className={`
                        flex-1 transition-all duration-300
                        ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
                        ${noPadding ? '' : 'bg-gray-50'}
                        ${noTopPadding ? 'min-h-[calc(100vh-4rem)]' : 'min-h-[calc(100vh-4rem)] pt-16'}
                    `}
                >
                    {noPadding ? (
                        children
                    ) : (
                        <div className="p-4 sm:p-6">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;