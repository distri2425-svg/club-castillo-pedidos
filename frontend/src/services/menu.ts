import api from './api';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string;
    type: string;
  };
  available: boolean;
}

export interface Beverage {
  id: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
}

export interface Menu {
  menuItems: MenuItem[];
  beverages: Beverage[];
}

export const getRestaurantMenu = async (restaurantId: number): Promise<Menu> => {
  const response = await api.get<Menu>(`/menu/restaurant/${restaurantId}`);
  return response.data;
};

export const createMenuItem = async (restaurantId: number, data: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
  const response = await api.post<MenuItem>(`/menu/restaurant/${restaurantId}/items`, data);
  return response.data;
};

export const updateMenuItem = async (restaurantId: number, itemId: number, data: Partial<MenuItem>): Promise<MenuItem> => {
  const response = await api.put<MenuItem>(`/menu/restaurant/${restaurantId}/items/${itemId}`, data);
  return response.data;
};

export const deleteMenuItem = async (restaurantId: number, itemId: number): Promise<void> => {
  await api.delete(`/menu/restaurant/${restaurantId}/items/${itemId}`);
};

export const createBeverage = async (restaurantId: number, data: Omit<Beverage, 'id'>): Promise<Beverage> => {
  const response = await api.post<Beverage>(`/menu/restaurant/${restaurantId}/beverages`, data);
  return response.data;
};

export const updateBeverage = async (restaurantId: number, beverageId: number, data: Partial<Beverage>): Promise<Beverage> => {
  const response = await api.put<Beverage>(`/menu/restaurant/${restaurantId}/beverages/${beverageId}`, data);
  return response.data;
};

export const deleteBeverage = async (restaurantId: number, beverageId: number): Promise<void> => {
  await api.delete(`/menu/restaurant/${restaurantId}/beverages/${beverageId}`);
}; 