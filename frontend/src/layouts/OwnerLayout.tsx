import React, { useState } from 'react';
import OwnerTopbar from "../components/owner/OwnerTopbar";
import OwnerSidebar from "../components/owner/OwnerSidebar";

const OwnerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const toggleCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Topbar */}
            <OwnerTopbar
                onMenuClick={toggleSidebar}
            />

            <div className="flex">
                {/* Sidebar */}
                <OwnerSidebar
                    open={sidebarOpen}
                    onClose={closeSidebar}
                    collapsed={sidebarCollapsed}
                    onCollapse={toggleCollapse}
                />

                {/* Main Content */}
                <main
                    className={`
                        flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 pt-16
                        
                        /* Desktop: Se ajusta según el estado del sidebar */
                        ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
                    `}
                >
                    <div className="p-4 sm:p-6 max-w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OwnerLayout;