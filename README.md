# Tienda de Ropa - E-commerce Platform

## Descripción
Plataforma de e-commerce desarrollada con React y Firebase, que incluye una tienda para clientes y un panel de administración.

## Estructura del Proyecto
```
├── client/                 # Frontend para usuarios finales
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── context/      # Contextos de React
│   │   ├── pages/        # Páginas de la aplicación
│   │   ├── utils/        # Utilidades y helpers
│   │   └── assets/       # Recursos estáticos
│   └── public/           # Archivos públicos
│
├── admin/                 # Panel de administración
│   ├── src/
│   │   ├── components/   # Componentes del panel admin
│   │   ├── pages/        # Páginas del panel admin
│   │   └── context/      # Contextos del panel admin
│   └── public/           # Archivos públicos
│
├── admin-functions/       # Funciones del backend (Firebase Cloud Functions)
│   └── index.js          # Punto de entrada de las funciones
│
└── firebase/             # Configuración de Firebase
    ├── firestore.rules   # Reglas de seguridad de Firestore
    └── storage.rules     # Reglas de seguridad de Storage
```

## Tecnologías Principales
- **Frontend**: React, Material-UI
- **Backend**: Firebase (Firestore, Storage, Authentication)
- **Funciones**: Firebase Cloud Functions
- **Estilos**: Emotion, CSS Modules
- **Estado**: React Context
- **Routing**: React Router DOM

## Requisitos Previos
- Node.js (v14 o superior)
- npm o yarn
- Cuenta de Firebase

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd tienda-ropa
```

2. Instalar dependencias del cliente:
```bash
cd client
npm install
```

3. Instalar dependencias del admin:
```bash
cd ../admin
npm install
```

4. Instalar dependencias de las funciones:
```bash
cd ../admin-functions
npm install
```

## Configuración

1. Crear un proyecto en Firebase Console
2. Configurar las variables de entorno:

Para el cliente (`client/.env`):
```
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
```

Para el admin (`admin/.env`):
```
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
```

## Desarrollo

### Cliente
```bash
cd client
npm start
```

### Panel de Administración
```bash
cd admin
npm start
```

### Funciones de Firebase
```bash
cd admin-functions
npm run serve
```

## Despliegue

### Cliente
```bash
cd client
npm run build
firebase deploy --only hosting:jr-essentials
```

### Panel de Administración
```bash
cd admin
npm run build
firebase deploy --only hosting:admin
```

### Funciones
```bash
cd admin-functions
npm run deploy
```

## Características Principales

### Cliente
- Catálogo de productos
- Carrito de compras
- Sistema de autenticación
- Proceso de checkout
- Historial de pedidos
- Perfil de usuario

### Panel de Administración
- Gestión de productos
- Gestión de pedidos
- Gestión de usuarios
- Estadísticas y reportes
- Configuración de la tienda

## Estructura de Datos

### Colecciones de Firestore
- `products`: Productos de la tienda
- `orders`: Pedidos realizados
- `users`: Información de usuarios
- `categories`: Categorías de productos
- `settings`: Configuración de la tienda

## Seguridad
- Autenticación mediante Firebase Auth
- Reglas de seguridad en Firestore
- Reglas de seguridad en Storage
- Validación de roles de usuario

## Contribución
1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## Contacto
[Tu Nombre] - [Tu Email]

Link del Proyecto: [https://github.com/tu-usuario/tienda-ropa](https://github.com/tu-usuario/tienda-ropa)
