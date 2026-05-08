# Acquisitions API

A robust RESTful API for managing user acquisitions, built with Node.js, Express, and TypeScript. This API provides secure user authentication and registration functionality with JWT-based session management.

## 🚀 Features

- **User Authentication**: Secure user registration and login with JWT tokens
- **Password Security**: Bcrypt hashing for password storage
- **Database Integration**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Security**: Helmet for security headers, CORS support, and HTTP-only cookies
- **Logging**: Winston-based logging with Morgan HTTP request logging
- **Validation**: Zod schema validation for request data
- **Type Safety**: Full TypeScript support with strict typing
- **Development Tools**: ESLint, Prettier, and automated linting/formatting

## 🛠 Tech Stack

### Core Technologies

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM

### Security & Authentication

- **JWT**: JSON Web Tokens for session management
- **Bcrypt**: Password hashing and verification
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing

### Development & Quality

- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Logging**: Winston + Morgan
- **Validation**: Zod schemas
- **Process Management**: Nodemon for development

## 📋 Prerequisites

- Node.js 18+ (with npm) - for local development without Docker
- PostgreSQL database (Neon recommended for serverless)
- Docker & Docker Compose - for containerized development and production
- Git

## 🚀 Installation

### Option 1: Local Development (Non-Docker)

1. **Clone the repository**

    ```bash
    git clone https://github.com/Akene-Uzezi/acquisitions.git
    cd acquisitions
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Environment Configuration**

    Create a `.env` file in the root directory:

    ```env
    DATABASE_URL=your_neon_database_connection_string
    JWT_SECRET=your_super_secret_jwt_key_here
    PORT=3000
    NODE_ENV=development
    ```

    > **Note**: Get your DATABASE_URL from Neon Console. For JWT_SECRET, use a strong, random string.

4. **Database Setup**

    Generate and run database migrations:

    ```bash
    npm run db:generate
    npm run db:migrate
    ```

5. **Build the application**
    ```bash
    npm run build
    ```

### Option 2: Docker Development

See the [🐳 Docker Setup](#-docker-setup) section below for containerized development with Neon Local.

## 🐳 Docker Setup

This application is fully dockerized with different configurations for development and production environments.

### Development Environment with Neon Local

For local development, we use **Neon Local** which provides a local PostgreSQL instance that mimics Neon's serverless features, including automatic ephemeral branches for development and testing.

**Prerequisites:**
- Docker and Docker Compose installed
- At least 2GB RAM allocated to Docker

**Steps:**

1. **Start the development environment:**

   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

   This command:
   - Pulls and starts the `neondatabase/neon:latest` container
   - Builds your application container
   - Mounts your source code for live reloading
   - Connects your app to Neon Local at `postgres://postgres:postgres@neon-local:5432/postgres`

2. **Access your application:**

   - API: http://localhost:3000
   - Neon Local proxy: localhost:5432

3. **Database operations:**

   If you need to run migrations or use Drizzle Studio, you can access the app container:

   ```bash
   docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
   docker-compose -f docker-compose.dev.yml exec app npm run db:studio
   ```

4. **Stop the environment:**

   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

   Data persists in a named volume `neon-data`.

### Production Environment with Neon Cloud

For production, the application connects directly to your Neon Cloud database.

**Prerequisites:**
- Your Neon Cloud DATABASE_URL
- Docker and Docker Compose

**Steps:**

1. **Set your production environment variables:**

   Copy `.env.production` and fill in your actual DATABASE_URL:

   ```bash
   cp .env.production .env
   # Edit .env with your production DATABASE_URL
   ```

2. **Build and deploy:**

   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

   Or pass the DATABASE_URL as an environment variable:

   ```bash
   DATABASE_URL="your-neon-cloud-url" docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Verify deployment:**

   ```bash
   docker-compose -f docker-compose.prod.yml logs app
   ```

The application will be available at http://localhost:3000 (configure your reverse proxy for production domains).

## 🏃‍♂️ Running the Application (Non-Docker)

### Development Mode

```bash
npm run dev
```

Starts the server with hot-reloading using Nodemon.

### Production Mode

```bash
npm start
```

Runs the compiled JavaScript from the `dist` directory.

The server will start on `http://localhost:3000` (or your configured PORT).

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Health Check Endpoints

#### GET `/`

Basic health check endpoint.

- **Response**: `Hello from acquisitions!`

#### GET `/health`

Detailed health information.

- **Response**:
  ```json
  {
    "status": "Ok",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "uptime": 123.45
  }
  ```

#### GET `/api`

API status check.

- **Response**:
  ```json
  {
    "message": "Acquisition API is running"
  }
  ```

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new user account.

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response (201)**:

```json
{
  "message": "User Registered",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Validation Rules**:

- `name`: 2-255 characters, required
- `email`: Valid email format, required, unique
- `password`: 6-128 characters, required
- `role`: Either "user" or "admin", defaults to "user"

#### POST `/api/auth/login`

Authenticate and login a user.

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200)**:

```json
{
  "message": "User Logged In",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Responses**:

- `400`: Validation failed
- `401`: Invalid credentials

#### POST `/api/auth/logout`

Logout the current user by clearing the authentication cookie.

**Response (200)**:

```json
{
  "message": "User Logged Out"
}
```

## 🛠 Development Scripts

| Command                | Description                                 |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start development server with hot-reload    |
| `npm run build`        | Compile TypeScript to JavaScript            |
| `npm run start`        | Start production server                     |
| `npm run lint`         | Run ESLint code analysis                    |
| `npm run lint:fix`     | Auto-fix ESLint issues                      |
| `npm run format`       | Format code with Prettier                   |
| `npm run format:check` | Check code formatting                       |
| `npm run db:generate`  | Generate database schema from Drizzle       |
| `npm run db:migrate`   | Run database migrations                     |
| `npm run db:studio`    | Open Drizzle Studio for database management |
| `npm run commit`       | Interactive git commit with staging         |

## 🏗 Project Structure

```
src/
├── app.ts              # Express application setup and middleware
├── server.ts           # Server entry point
├── index.ts            # Application bootstrap
├── config/             # Configuration files
│   ├── database.ts     # Database connection (Drizzle + Neon)
│   └── logger.ts       # Winston logger configuration
├── controllers/        # Request handlers
│   └── auth.controller.ts # Authentication endpoints
├── models/             # Database schema definitions
│   └── user.model.ts   # User table schema
├── routes/             # API route definitions
│   └── auth.routes.ts  # Authentication routes
├── services/           # Business logic layer
│   └── auth.service.ts # Authentication services
├── types/              # TypeScript type definitions
│   └── service.types.ts # Service-related interfaces
├── utils/              # Utility functions
│   ├── cookies.ts      # Cookie management
│   └── jwt.ts          # JWT token handling
└── validations/        # Input validation schemas
    ├── auth.validation.ts # Authentication validation
    └── format.ts       # Validation error formatting
```

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication with expiration
- **HTTP-Only Cookies**: Session tokens stored in secure, HTTP-only cookies
- **Security Headers**: Helmet provides comprehensive security headers
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Zod schemas prevent malformed data
- **Error Handling**: Sensitive information not leaked in error responses

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing

Currently, no test suite is configured. To add testing:

1. Install testing framework (Jest, Vitest, etc.)
2. Add test scripts to `package.json`
3. Create test files in `__tests__/` directory
4. Configure test database for isolated testing

## 🚢 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_secure_jwt_secret
PORT=3000
```

### Build and Deploy Steps

```bash
npm run build
npm run db:migrate  # Run migrations on production DB
npm start
```

### Recommended Hosting

- **Vercel/Netlify**: For serverless deployment
- **Railway/Render**: For full Node.js hosting
- **AWS/GCP/Azure**: For enterprise deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and run tests: `npm run lint && npm run build`
4. Commit your changes: `npm run commit`
5. Push to your branch: `git push origin feature/your-feature`
6. Open a Pull Request

### Code Style

- Follow ESLint and Prettier configurations
- Use TypeScript strict mode
- Write clear commit messages
- Add JSDoc comments for complex functions
