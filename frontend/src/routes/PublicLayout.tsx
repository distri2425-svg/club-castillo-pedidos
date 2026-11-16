import React from 'react';
import Navbar from '../components/common/Navbar';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div>
        <Navbar />
        {/* Cambia aquí el valor de pt-24 */}
        <div className="pt-12 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {children}
        </div>
    </div>
);


export default PublicLayout;
