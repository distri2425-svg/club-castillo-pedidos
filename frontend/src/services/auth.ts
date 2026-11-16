import api from './api';
import { User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Modifica AuthResponse para incluir user y restaurantId
export interface AuthResponse {
  token: string;
  user: User; // Agregamos el usuario completo aquí
  restaurantId?: string; // Hacemos restaurantId opcional por si no todos los usuarios tienen uno
}

export const authService = {
  // consentGiven: LOPDP Art. 9. La casilla de la pantalla de acceso se envia al
  // servidor, que registra el consentimiento con su fecha si la cuenta aun no
  // lo tiene. Antes la casilla solo habilitaba el boton y no se persistia.
  async login(email: string, password: string, consentGiven = false): Promise<AuthResponse> {
    const response = await api.post<any>('/auth/authenticate', { email, password, consentGiven });
    const { token } = response.data;

    // Guardar el token
    localStorage.setItem('token', token);

    // Obtener datos del usuario
    // Esta llamada a /users/me ahora será la fuente principal para obtener el restaurantId
    const userResponse = await api.get('/users/me');
    const user: User = {
      id: userResponse.data.id.toString(),
      name: `${userResponse.data.firstName} ${userResponse.data.lastName}`,
      email: userResponse.data.email,
      role: userResponse.data.role,
      restaurantId: userResponse.data.restaurantId?.toString(),
      createdAt: new Date(userResponse.data.createdAt)
    };

    // --- ¡AQUÍ ESTÁ EL CAMBIO CLAVE! ---
    // Devolvemos el token, el user completo, y el restaurantId para que LoginForm lo use
    return { token, user, restaurantId: user.restaurantId };
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Buena práctica: también limpiar el user
    localStorage.removeItem('restaurantId'); // Y el restaurantId
  },

  async register(data: RegisterRequest): Promise<AuthResponse> { // Cambia el tipo de retorno a AuthResponse
    const response = await api.post<any>('/auth/register', data);
    const { token } = response.data;

    // Guardar el token
    localStorage.setItem('token', token);

    // Obtener datos del usuario
    const userResponse = await api.get('/users/me');
    const user: User = {
      id: userResponse.data.id.toString(),
      name: `${userResponse.data.firstName} ${userResponse.data.lastName}`,
      email: userResponse.data.email,
      role: userResponse.data.role,
      restaurantId: userResponse.data.restaurantId?.toString(),
      createdAt: new Date(userResponse.data.createdAt)
    };

    // --- ¡AQUÍ ESTÁ EL CAMBIO CLAVE PARA REGISTER TAMBIÉN! ---
    return { token, user, restaurantId: user.restaurantId };
  }
};