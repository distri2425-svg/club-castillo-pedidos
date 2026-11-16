import { User, Restaurant, Zone, MenuItem, Beverage, Order } from '../types';

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Admin Principal',
        email: 'owner@club.com',
        role: 'OWNER',
        createdAt: new Date(),
    },
    {
        id: '2',
        name: 'Juan Pérez',
        email: 'juan@restaurant.com',
        role: 'RESTAURANT_ADMIN',
        restaurantId: '1',
        createdAt: new Date(),
    },
    {
        id: '3',
        name: 'María García',
        email: 'maria@club.com',
        role: 'CUSTOMER',
        createdAt: new Date(),
    },
];

export const mockZones: Zone[] = [
    {
        id: '1',
        name: 'Zona Piscina',
        description: 'Área de piscina y recreación',
        createdAt: new Date(),
    },
    {
        id: '2',
        name: 'Zona Social',
        description: 'Área social y eventos',
        createdAt: new Date(),
    },
    {
        id: '3',
        name: 'Zona Deportiva',
        description: 'Canchas y área deportiva',
        createdAt: new Date(),
    },
];

export const mockRestaurants: Restaurant[] = [
    {
        id: '1',
        name: 'La Terraza',
        description: 'Comida mediterránea con vista panorámica',
        adminId: '2',
        zoneId: '1',
        isOpen: true,
        image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
        createdAt: new Date(),
    },
    {
        id: '2',
        name: 'Grill & Bar',
        description: 'Carnes a la parrilla y ambiente familiar',
        adminId: '2',
        zoneId: '2',
        isOpen: true,
        image: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg',
        createdAt: new Date(),
    },
];

export const mockBeverages: Beverage[] = [
    {
        id: '1',
        name: 'Coca Cola',
        description: 'Refresco de cola 350ml',
        price: 2.50,
        category: 'Refrescos',
        image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg',
        isAvailable: true,
    },
    {
        id: '2',
        name: 'Agua Mineral',
        description: 'Agua mineral natural 500ml',
        price: 1.50,
        category: 'Aguas',
        image: 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg',
        isAvailable: true,
    },
    {
        id: '3',
        name: 'Cerveza Nacional',
        description: 'Cerveza nacional 330ml',
        price: 3.50,
        category: 'Cervezas',
        image: 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg',
        isAvailable: true,
    },
];

export const mockMenuItems: MenuItem[] = [
    {
        id: '1',
        name: 'Paella Valenciana',
        description: 'Paella tradicional con mariscos y pollo',
        price: 18.50,
        category: 'Platos Principales',
        image: 'https://images.pexels.com/photos/1205162/pexels-photo-1205162.jpeg',
        restaurantId: '1',
        isAvailable: true,
    },
    {
        id: '2',
        name: 'Ensalada César',
        description: 'Ensalada fresca con pollo a la plancha',
        price: 12.00,
        category: 'Ensaladas',
        image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg',
        restaurantId: '1',
        isAvailable: true,
    },
    {
        id: '3',
        name: 'Bife de Chorizo',
        description: 'Carne a la parrilla con guarnición',
        price: 22.00,
        category: 'Carnes',
        image: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg',
        restaurantId: '2',
        isAvailable: true,
    },
];

export const mockOrders: Order[] = [
    {
        id: '1',
        customerId: '3',
        customerName: 'María García',
        restaurantId: '1',
        items: [
            { id: '1', name: 'Paella Valenciana', price: 18.50, quantity: 1 },
            { id: '2', name: 'Ensalada César', price: 12.00, quantity: 1 },
        ],
        beverages: [
            { id: '1', name: 'Coca Cola', price: 2.50, quantity: 2 },
        ],
        status: 'PENDING',
        total: 35.50,
        isGuest: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];