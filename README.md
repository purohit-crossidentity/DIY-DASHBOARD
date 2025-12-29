# DIY-DASHBOARD

A multi-tenant custom dashboard application built with React and Express.js. Allows users to create, manage, and configure dashboards with predefined and custom widgets.

## Features

- Multi-tenant architecture with tenant/subtenant isolation
- JWT-based authentication
- CRUD operations for dashboards
- Predefined and custom widget support
- User assignment to dashboards
- Responsive React frontend

## Tech Stack

**Frontend:**
- React 18
- Vite
- CSS

**Backend:**
- Express.js 5
- MySQL (mysql2)
- JWT (jsonwebtoken)

## Project Structure

```
DIY-DASHBOARD/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── CustomDashboardPage.jsx
│   │   ├── AddDashboardModal.jsx
│   │   ├── ViewDashboardModal.jsx
│   │   └── IAMHeaderCanvas.jsx
│   ├── styles/
│   ├── utils/
│   │   └── auth.js               # Authentication utilities
│   ├── App.jsx
│   └── main.jsx
├── server/                       # Backend source
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── auth.js               # JWT middleware
│   ├── models/
│   │   └── Dashboard.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── dashboardRoutes.js
│   └── index.js                  # Server entry point
├── package.json
└── vite.config.js
```

## Prerequisites

- Node.js (v18+)
- MySQL database
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd DIY-DASHBOARD
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=nnriskdb_local
   DB_PORT=3306

   # Server Configuration
   PORT=5001
   JWT_SECRET=your_jwt_secret_key
   ```

4. Set up the database with required tables:
   - `cix_tenant` - Tenant information
   - `cix_subtenant` - Subtenant information
   - Dashboard-related tables

## Running the Application

### Development Mode

Start the backend server:
```bash
npm run server
```

Start the frontend development server:
```bash
npm run dev
```

### Access the Application

The application requires tenant and subtenant parameters in the URL query string:

```
http://localhost:3002?tenant=YOUR_TENANT_CODE&subtenant=YOUR_SUBTENANT_CODE
```

**Important:** Parameters must be passed as query parameters (after `?`), not as URL path segments.

### Production Build

```bash
npm run build
npm run preview
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/token` | Generate JWT token |

### Dashboards (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboards` | Get all dashboards |
| GET | `/api/dashboards/:id` | Get single dashboard |
| POST | `/api/dashboards` | Create dashboard |
| PUT | `/api/dashboards/:id` | Update dashboard |
| DELETE | `/api/dashboards/:id` | Delete dashboard |
| POST | `/api/dashboards/delete-multiple` | Delete multiple dashboards |
| GET | `/api/dashboards/users/all` | Get all users |
| GET | `/api/dashboards/widgets/all` | Get custom widgets |
| GET | `/api/dashboards/widgets/predefined` | Get predefined widgets |
| POST | `/api/dashboards/:id/users` | Add user to dashboard |
| DELETE | `/api/dashboards/:id/users/:userId` | Remove user from dashboard |
| GET | `/api/dashboards/user/:userId` | Get dashboards for user |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

## Configuration

### Default Ports
- Frontend: `3002`
- Backend: `5001`

### CORS
The backend allows requests from:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://localhost:5173`

## Troubleshooting

### "Authentication failed" Error

Ensure your URL includes both `tenant` and `subtenant` as query parameters:

**Correct:**
```
http://localhost:3002?tenant=CODE&subtenant=CODE
```

**Incorrect:**
```
http://localhost:3002/tenant/CODE/subtenant/CODE  # Path-based won't work
http://localhost:3002#tenant=CODE&subtenant=CODE  # Hash-based won't work
```

### Database Connection Issues

1. Verify MySQL is running
2. Check `.env` configuration
3. Ensure the database and required tables exist
4. Verify tenant/subtenant codes exist and are marked as `ACTIVE`

## License

Private
