// User.ts
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'OWNER' | 'RESTAURANT_ADMIN' | 'CUSTOMER'| "INVITED";
    restaurantId?: number;
    /** Todas las unidades que administra; la chef de las etapas 1 y 3 tiene dos. */
    restaurantIds?: number[];
    createdAt?: Date;
    profileImageBase64?: string;
}

// Restaurant.ts
export interface Restaurant {
    id: number;
    name: string;
    description: string;
    adminId: number;
    zoneId: number;
    isOpen: boolean;
    imageBase64?: string;
    createdAt: Date;
}

// Zone.ts
export interface Zone {
    id: number;
    name: string;
    description: string;
    createdAt: Date;
}

// MenuItem.ts
export interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    categoryName?: string;
    restaurantId: number;
    restaurantName?: string;
    imageBase64?: string;
    active: boolean;
}

// Beverage.ts
export interface Beverage {
    id: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    categoryName?: string;
    imageBase64?: string;
    available: boolean;
}

// Order.ts
export type Order = {
    id: number;
    status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
    customerName: string;
    isGuest: boolean;
    createdAt: string;
    updatedAt: string;
    /** El servidor no registra mesa; el QR identifica a la unidad. Se conserva opcional. */
    tableNumber?: string;
    total: number;
    items: { name: string; quantity: number; price: number }[];
    beverages: { name: string; quantity: number; price: number }[];
    /** Unidad de la que proviene, para distinguirlas en el panel combinado. */
    restaurantId?: number;
};


export interface OrderItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

// Auth.ts
export interface AuthState {
    user: User | null;
    isGuest: boolean;
    isAuthenticated: boolean;
    guestRestId?: string;
}
