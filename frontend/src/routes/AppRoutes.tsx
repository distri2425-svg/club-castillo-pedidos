import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Reports from '../components/owner/Reports';
import OwnerProfile from '../components/owner/OwnerProfile';
import CustomerLayout from "../layouts/CustomerLayout";
import CartPage from "../components/customer/CartPage";

// Layouts
import PublicLayout from './PublicLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout'; // Ahora usando AdminLayout específico

// Components
import LandingPage from '../components/landing/LandingPage';
import LoginForm from '../components/auth/LoginForm';
import PrivacyPolicyPage from '../components/legal/PrivacyPolicyPage';

// Owner Components
import OwnerDashboard from '../components/owner/OwnerDashboard';
import RestaurantManagement from '../components/owner/RestaurantManagement';
import ZoneManagement from '../components/owner/ZoneManagement';
import UserManagement from '../components/owner/UserManagement';
import BeverageManagement from '../components/owner/BeverageManagement';

// Admin Components
import AdminDashboard from '../components/admin/AdminDashboard';
import MenuManagement from '../components/admin/MenuManagement';
import QRCodeGenerator from '../components/admin/QRCodeGenerator';
import RestaurantSettings from '../components/admin/RestaurantSettings';
import AdminHome from '../components/admin/AdminHome';


// Customer Components
import RestaurantList from '../components/customer/RestaurantList';
import RestaurantMenu from '../components/customer/RestaurantMenu';
import CustomerProfile from '../components/customer/CustomerProfile';
import QRScanner from '../components/customer/QRScanner';
import OrderTrackingPage from '../components/customer/OrderTrackingPage';


// ----------- ProtectedRoute -------------
/** Pantalla intermedia mientras se restablece la sesión guardada. */
const RestaurandoSesion: React.FC = () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#181818]">
        <div className="w-10 h-10 rounded-full border-4 border-[#f89b01]/30 border-t-[#f89b01] animate-spin" />
        <p className="text-sm font-semibold text-amber-200/80">Restableciendo la sesión...</p>
    </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
                                                                                       children,
                                                                                       roles
                                                                                   }) => {
    const { isAuthenticated, user, isGuest, isRestoringSession } = useAuth();

    // Mientras el token guardado no termine de comprobarse no se decide nada:
    // de otro modo la recarga de una ruta protegida devuelve al acceso.
    if (isRestoringSession) {
        return <RestaurandoSesion />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if (roles && !isGuest && user && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};

// ----------- RUTAS PRINCIPALES -------------
const AppRoutes: React.FC = () => {
    return (
        <Router>
            <Routes>
                {/* Páginas públicas con NAVBAR */}
                <Route path="/" element={
                    <PublicLayout>
                        <LandingPage />
                    </PublicLayout>
                } />
                <Route path="/login" element={
                    <PublicLayout>
                        <LoginForm />
                    </PublicLayout>
                } />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                {/* Owner Dashboard - Usando OwnerLayout específico */}
                <Route path="/owner/dashboard" element={
                    <ProtectedRoute roles={['OWNER']}>
                        <OwnerLayout>
                            <OwnerDashboard />
                        </OwnerLayout>
                    </ProtectedRoute>
                } />
                <Route path="/owner/restaurants" element={
                    <ProtectedRoute roles={['OWNER']}>
                        <OwnerLayout>
                            <RestaurantManagement />
                        </OwnerLayout>
                    </ProtectedRoute>
                } />
                <Route path="/owner/zones" element={
                    <ProtectedRoute roles={['OWNER']}>
                        <OwnerLayout>
                            <ZoneManagement />
                        </OwnerLayout>
                    </ProtectedRoute>
                } />
                <Route path="/owner/users" element={
                    <ProtectedRoute roles={['OWNER']}>
                        <OwnerLayout>
                            <UserManagement />
                        </OwnerLayout>
                    </ProtectedRoute>
                } />
                <Route path="/owner/beverages" element={
                    <ProtectedRoute roles={['OWNER']}>
                        <OwnerLayout>
                            <BeverageManagement />
                        </OwnerLayout>
                    </ProtectedRoute>
                } />
                <Route path="/owner/reports" element={
                    <ProtectedRoute roles={['OWNER']}>
                        <OwnerLayout>
                            <Reports />
                        </OwnerLayout>
                    </ProtectedRoute>
                } />
                <Route path="/owner/settings" element={
                    <ProtectedRoute roles={['OWNER']}>
                        <OwnerLayout>
                            <OwnerProfile />
                        </OwnerLayout>
                    </ProtectedRoute>
                } />

                <Route path="/customer/cart" element={
                    <CustomerLayout>
                        <CartPage />
                    </CustomerLayout>
                } />

                {/* Admin Dashboard - Usando AdminLayout específico */}
                <Route path="/admin/home" element={
                    <ProtectedRoute roles={['RESTAURANT_ADMIN']}>
                        <AdminLayout noPadding noTopPadding>
                            <AdminHome/>
                        </AdminLayout>
                    </ProtectedRoute>
                } />
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute roles={['RESTAURANT_ADMIN']}>
                        <AdminLayout>
                            <AdminDashboard />
                        </AdminLayout>
                    </ProtectedRoute>
                } />
                <Route path="/admin/menu" element={
                    <ProtectedRoute roles={['RESTAURANT_ADMIN']}>
                        <AdminLayout>
                            <MenuManagement />
                        </AdminLayout>
                    </ProtectedRoute>
                } />
                <Route path="/admin/qr-codes" element={
                    <ProtectedRoute roles={['RESTAURANT_ADMIN']}>
                        <AdminLayout>
                            <QRCodeGenerator />
                        </AdminLayout>
                    </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                    <ProtectedRoute roles={['RESTAURANT_ADMIN']}>
                        <AdminLayout>
                            <div className="p-6">
                                <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
                                <p className="text-gray-600 mt-2">Análisis de ventas y rendimiento</p>
                            </div>
                        </AdminLayout>
                    </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                    <ProtectedRoute roles={['RESTAURANT_ADMIN']}>
                        <AdminLayout>
                            <RestaurantSettings />
                        </AdminLayout>
                    </ProtectedRoute>
                } />
                {/* Customer Dashboard - Solo Header, sin sidebar */}
                <Route path="/customer/order/tracking" element={
                    <ProtectedRoute>
                        <CustomerLayout>
                            <OrderTrackingPage />
                        </CustomerLayout>
                    </ProtectedRoute>
                } />

                <Route path="/customer/restaurants" element={
                    <ProtectedRoute>
                        <CustomerLayout>
                            <RestaurantList />
                        </CustomerLayout>
                    </ProtectedRoute>
                } />
                <Route path="/customer/restaurant/:restaurantId" element={
                    <CustomerLayout noPadding>
                        <RestaurantMenu />
                    </CustomerLayout>
                } />
                <Route path="/customer/profile" element={
                    <ProtectedRoute>
                        <CustomerLayout>
                            <CustomerProfile />
                        </CustomerLayout>
                    </ProtectedRoute>
                } />
                <Route path="/customer/qr-scanner" element={
                    <ProtectedRoute>
                        <CustomerLayout>
                            <QRScanner />
                        </CustomerLayout>
                    </ProtectedRoute>
                } />

                <Route path="/customer/cart" element={
                    <CustomerLayout noPadding noTopPadding>
                        <CartPage/>
                    </CustomerLayout>
                } />

                {/* Error y redirect */}
                <Route path="/unauthorized" element={
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
                            <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
                        </div>
                    </div>
                } />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;