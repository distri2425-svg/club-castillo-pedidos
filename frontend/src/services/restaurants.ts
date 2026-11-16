import api from './api';

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
  zone: {
    id: number;
    name: string;
  };
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const getRestaurants = async (): Promise<Restaurant[]> => {
  const response = await api.get<Restaurant[]>('/restaurants');
  return response.data;
};

export const getRestaurantById = async (id: number): Promise<Restaurant> => {
  const response = await api.get<Restaurant>(`/restaurants/${id}`);
  return response.data;
};

export const createRestaurant = async (data: Omit<Restaurant, 'id'>): Promise<Restaurant> => {
  const response = await api.post<Restaurant>('/restaurants', data);
  return response.data;
};

export const updateRestaurant = async (id: number, data: Partial<Restaurant>): Promise<Restaurant> => {
  const response = await api.put<Restaurant>(`/restaurants/${id}`, data);
  return response.data;
};

export const deleteRestaurant = async (id: number): Promise<void> => {
  await api.delete(`/restaurants/${id}`);
}; 