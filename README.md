# Club Castillo — Sistema de Gestión de Restaurantes

Sistema web para la gestión de restaurantes dentro de un club privado. Permite a los clientes escanear códigos QR en las mesas, visualizar menús y realizar pedidos en tiempo real.

## Stack tecnológico

| Componente | Tecnología |
|------------|-----------|
| Backend | Spring Boot 3.5.3, Java 17, Spring Security (JWT) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Base de datos | PostgreSQL 16 |
| Tiempo real | WebSocket (STOMP/SockJS) |
| QR | qrcode (generación), html5-qrcode (escaneo) |
| Contenedores | Docker, Docker Compose |

## Estructura del repositorio

```
.
├── backend/              # API REST — Spring Boot
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
├── frontend/             # Aplicación web — React + Vite
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
├── docker-compose.yml    # Orquestación de servicios
├── .env.example          # Variables de entorno (plantilla)
└── README.md
```

## Inicio rápido con Docker

```bash
# 1. Clonar el repositorio
git clone https://github.com/distri2425-svg/club-castillo-pedidos.git
cd club-castillo-pedidos

# 2. Crear archivo de variables de entorno
cp .env.example .env
# Editar .env: SECRET_KEY_JWT y DB_PASSWORD son obligatorias

# 3. Levantar todos los servicios
docker compose up --build -d

# 4. Verificar que estén corriendo
docker compose ps
```

### Servicios disponibles

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Aplicación web |
| Backend API | http://localhost:8081/api | API REST |
| Swagger UI | http://localhost:8081/swagger-ui.html | Documentación interactiva |
| PostgreSQL | localhost:5432 | Base de datos |

### Usuarios por defecto

Se crean al arrancar sobre una base vacía. Su contraseña es el valor de `SEED_USER_PASSWORD` del archivo `.env`; si se omite, el sistema genera una aleatoria y la muestra en la bitácora del backend.

| Email | Rol |
|-------|-----|
| owner@club.com | OWNER |
| admin@restaurant.com | RESTAURANT_ADMIN |
| customer@club.com | CUSTOMER |
| invitado@club.com | INVITED |

## Desarrollo local (sin Docker)

### Backend

```bash
cd backend

# Requiere: Java 17 y PostgreSQL en localhost:5432
# Crear backend/.env con DB_IP, DB_USER, DB_PASSWORD y SECRET_KEY_JWT
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend

# Requiere: Node 20+
npm install
npm run dev
```

## Comandos útiles

```bash
# Ver logs
docker compose logs -f

# Reconstruir un servicio
docker compose up --build -d backend

# Entrar a la base de datos
docker exec -it castillo-db psql -U postgres -d castillo_db

# Detener todo
docker compose down

# Detener y borrar datos
docker compose down -v
```
