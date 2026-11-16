import React from 'react';
import OwnerSidebar from '../components/owner/OwnerSidebar';
import AdminSidebar from '../components/admin/AdminSidebar';

const DashboardLayout: React.FC<{
    children: React.ReactNode;
    showSidebar?: boolean;
    sidebarType?: 'owner' | 'admin';
}> = ({ children, showSidebar = false, sidebarType }) => (
    // OJO AQUÍ: min-h-screen, bg-gray-50, w-full, flex
    <div className="min-h-screen bg-gray-50 flex w-full">
        {showSidebar && sidebarType === 'owner' && <OwnerSidebar />}
        {showSidebar && sidebarType === 'admin' && <AdminSidebar />}
        <main className="flex-1 w-full">
            {children}
        </main>
    </div>
);

export default DashboardLayout;
