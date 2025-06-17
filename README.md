# 📌 Sprintzo — Sistema de Tableros Colaborativos

Proyecto de aplicación web colaborativa para la gestión de tareas a través de tableros Kanban. Permite a los usuarios organizar, editar y seguir tareas en tiempo real, adjuntar archivos, manejar permisos y controlar flujos de trabajo.

---

## 📑 Índice

- [📌 Descripción](#-descripción)
- [🚀 Tecnologías](#-tecnologías)
- [🛠️ Instalación](#-instalación)
- [📦 Estructura del Proyecto](#-estructura-del-proyecto)
- [📋 Funcionalidades Principales](#-funcionalidades-principales)
- [🛡️ Autenticación y Seguridad](#-autenticación-y-seguridad)
- [📈 Ramas y Flujo de Trabajo](#-ramas-y-flujo-de-trabajo)
- [👥 Contribuciones](#-contribuciones)
- [📄 Licencia](#-licencia)

---

## 📌 Descripción

Sprintzo es una herramienta tipo Trello que permite a equipos organizar proyectos y tareas mediante tableros con tarjetas interactivas. Cada tarjeta representa una tarea que puede contener:

- Título, descripción y responsables.
- Etiquetas de clasificación.
- Checklist de tareas parciales.
- Archivos adjuntos.
- Estado (activa, archivada o eliminada).

---

## 🚀 Tecnologías

- **Frontend**: HTML, CSS, Vanilla JavaScript, SweetAlert2.
- **Backend**: Node.js, Express.js.
- **Base de Datos**: MongoDB (Mongoose).
- **Autenticación**: JSON Web Tokens (JWT).
- **Control de versiones**: Git / GitHub.

---

## 🛠️ Instalación

### 📦 Clonar repositorio:
git clone https://github.com/Derinson/Sprintzo.git

📥 Instalar dependencias del backend:

cd backend
npm install multer
npm install

📥 Instalar dependencias del frontend (si aplica):

cd frontend
npm install sweetalert2
npm install

📡 Iniciar el servidor backend:

npm run dev
Por defecto, se ejecutará en http://localhost:5000

📦 Estructura del Proyecto
📦 Sprintzo/
├── 📂 backend/
│   ├── 📂 models/
│   │   ├── Notificacion.js
│   │   ├── Card.js
│   │   ├── UserModels.js
│   │   └── tablero.js
│   │
│   ├── 📂 routes/
│   │   ├── cardRoutes.js
│   │   ├── notificacionesRoutes.js
│   │   ├── cardRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── 📂 middlewares/
│   │   └── authMiddleware.js
│   │
│   ├── 📂 uploads/
│   │   └── (archivos adjuntos guardados aquí)
│   │
│   └── server.js
│
├── 📂 frontend/
│   ├── 📂 assets/
│   │   ├── 📂 css/
│   │   │   └── styles.css
│   │   ├── 📂 images/
│   │   │   └── logo.png
│   │   └── 📂 js/
│   │       ├── board.js
│   │       ├── card.js
│   │       ├── auth.js
│   │       └── utils.js
│   │
│   ├── index.html
│   ├── login.html
│   └── register.html
│
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── 📄 documentación/
    └── endpoints.md
    └── arquitectura.md


📋 Funcionalidades Principales
✅ Gestión de tableros y tarjetas
✅ Sistema de autenticación JWT por usuario
✅ Asignación de responsables a tareas
✅ Checklists por tarjeta
✅ Etiquetas personalizadas
✅ Archivo y desarchivo de tarjetas
✅ Eliminación definitiva de tareas
✅ Adjuntar y descargar archivos en tarjetas
✅ Control de permisos por rol: view, edition

🛡️ Autenticación y Seguridad
Implementación de JSON Web Tokens para validar sesiones.

Middleware de autorización para proteger rutas privadas.

Control de permisos en frontend y backend por roles de usuario.


📈 Ramas y Flujo de Trabajo
Este repositorio utiliza flujo Git basado en historias de usuario:

main: rama principal o estable para producción.

HU-XXX/NombreDeHistoria: ramas por funcionalidades o fixes.


👥 Contribuciones
Derinson
Jazi87r
Neydercm


📄 Licencia
Proyecto bajo licencia MIT.

📣 Desarrollado por Derinson, Jazi87r y Neydercm.
---
