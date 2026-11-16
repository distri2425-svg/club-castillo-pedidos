import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './components/customer/CartProvider'; // AJUSTA la ruta según tu proyecto

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                {/* Notificaciones globales */}
                <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
                <AppRoutes />
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
