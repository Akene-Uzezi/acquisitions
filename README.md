# Acquisitions API

A robust RESTful API for managing user acquisitions, built with Node.js, Express, and TypeScript. This API provides secure user authentication, registration, and full user CRUD functionality with JWT-based session management.

## 🚀 Features

- **User Authentication**: Secure user registration and login with JWT tokens
- **User Management**: Full CRUD operations for user profiles (Create, Read, Update, Delete)
- **Role-Based Access**: Admin and user roles with granular permissions for updating and deleting users
- **Password Security**: Bcrypt hashing (10 rounds) for password storage
- **Database Integration**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Security**: Helmet for security headers, CORS support, Arcjet rate limiting with bot detection and attack shielding
- **Logging**: Winston-based structured logging with Morgan HTTP request logging
- **Validation**: Zod schema validation for all request data
- **Type Safety**: Full TypeScript support with strict mode and NodeNext module resolution
- **Development Tools**: ESLint, Prettier, Nodemon hot-reload, and automated linting/formatting scripts

## 🛠 Tech Stack

### Core Technologies

- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express.js v5
- **Language**: TypeScript 6.x (strict mode, NodeNext module resolution)
- **Database**: PostgreSQL (Neon Serverless / Neon Local)
- **ORM**: Drizzle ORM v0.45 with `drizzle-kit` for migrations

### Security & Authentication

- **JWT**: JSON Web Tokens for stateless session management (1-day expiry)
- **Bcrypt**: Password hashing and verification (10 salt rounds)
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS**: Cross-origin resource sharing
- **Arcjet**: Rate limiting, bot detection, and attack shielding (SQL injection, etc.)
- **HTTP-Only Cookies**: JWT tokens stored securely in cookies (15-min maxAge, sameSite=strict)

### Development & Quality

- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Logging**: Winston (JSON in production, colorized in development) + Morgan
- **Validation**: Zod schemas with `safeParse()`
- **Process Management**: Nodemon for development hot-reload
- **Runtime Transpilation**: `tsx` for running TypeScript directly in development

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

    Copy the example environment file and fill in your values:

    ```bash
    cp .env.example .env
    ```

    Required environment variables:

    ```env
    DATABASE_URL=your_neon_database_connection_string
    JWT_SECRET=your_super_secret_jwt_key_here
    PORT=3000
    NODE_ENV=development
    ARCJET_KEY=your_arcjet_key
    ```

    > **Note**: Get your `DATABASE_URL` from the [Neon Console](https://neon.tech). For `JWT_SECRET`, use a strong, random string (e.g., `openssl rand -base64 32`). Get your `ARCJET_KEY` from [arcjet.com](https://app.arcjet.com).

4. **Database Setup**

    Generate and run database migrations:

    ```bash
    npm run db:generate
    npm run db:migrate
    ```

5. **Build and Start**

    ```bash
    # Build TypeScript to JavaScript
    npm run build

    # Start production server
    npm start

    # Or start development server with hot-reload
    npm run dev
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
    - Mounts your source code for live reloading via Nodemon
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
- Your Neon Cloud `DATABASE_URL`
- Docker and Docker Compose

**Steps:**

1. **Set your production environment variables:**

    Copy `.env.production` and fill in your actual `DATABASE_URL` and `ARCJET_KEY`:

    ```bash
    cp .env.production .env
    # Edit .env with your production DATABASE_URL and ARCJET_KEY
    ```

2. **Build and deploy:**

    ```bash
    docker-compose -f docker-compose.prod.yml up --build -d
    ```

    Or pass the `DATABASE_URL` as an environment variable:

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

Starts the server with hot-reloading using Nodemon and `tsx` for runtime TypeScript transpilation.

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
    "message": "Acquisitions API is running"
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
- `role`: Either `"user"` or `"admin"`, defaults to `"user"`

**Error Responses**:

- `400`: Validation failed
- `409`: User with this email already exists

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

A JWT token is set in an HTTP-only, secure cookie upon successful login.

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

### User Endpoints

All user endpoints require authentication. The authenticated user's identity is determined via the JWT token stored in an HTTP-only cookie.

#### GET `/api/users`

Retrieve all users (admin recommended).

- **Auth**: Required

**Response (200)**:

```json
{
  "message": "Successfully retrieved users",
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### GET `/api/users/:id`

Retrieve a single user by ID.

- **Auth**: Required

**Path Parameters**:

| Parameter | Type   | Required | Description       |
|-----------|--------|----------|-------------------|
| `id`      | number | Yes      | The user's ID     |

**Response (200)**:

```json
{
  "message": "Successfully retrieved user",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses**:

- `400`: Invalid ID format
- `401`: Authentication required
- `404`: User not found

#### PUT `/api/users/:id`

Update a user's information.

- **Auth**: Required (own profile or admin)

**Path Parameters**:

| Parameter | Type   | Required | Description       |
|-----------|--------|----------|-------------------|
| `id`      | number | Yes      | The user's ID     |

**Request Body** (all fields optional):

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "admin"
}
```

**Authorization Rules**:
- Users can update their own profile only
- Admin users can update any user's profile
- Only admin users can change the `role` field

**Response (200)**:

```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "name": "John Updated",
    "email": "john.updated@example.com",
    "role": "admin",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2026-05-11T13:00:00.000Z"
  }
}
```

**Error Responses**:

- `400`: Validation failed
- `401`: Authentication required
- `403`: Not authorized (non-admin changing another user, or non-admin changing role)
- `404`: User not found

#### DELETE `/api/users/:id`

Delete a user by ID.

- **Auth**: Required (own profile or admin)

**Path Parameters**:

| Parameter | Type   | Required | Description       |
|-----------|--------|----------|-------------------|
| `id`      | number | Yes      | The user's ID     |

**Authorization Rules**:
- Users can delete their own account only
- Admin users can delete any user

**Response (200)**:

```json
{
  "message": "User deleted successfully"
}
```

**Error Responses**:

- `400`: Invalid ID format
- `401`: Authentication required
- `403`: Not authorized
- `404`: User not found

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
| `npm run test`         | Run Jest test suite                         |
| `npm run commit`       | Interactive git commit with staging         |

## 🏗 Project Structure

```
src/
├── app.ts                # Express application setup and middleware
├── server.ts             # Server entry point
├── index.ts              # Application bootstrap (dotenv config)
├── config/               # Configuration files
│   ├── database.ts       # Database connection (Drizzle + Neon)
│   ├── logger.ts         # Winston logger configuration
│   └── arcjet.ts         # Arcjet rate limiting & security config
├── controllers/          # Request handlers
│   ├── auth.controller.ts    # Authentication endpoints
│   └── user.controller.ts    # User CRUD endpoints
├── middleware/           # Custom middleware
│   └── security.middleware.ts # Arcjet security & rate limiting middleware
├── models/               # Database schema definitions
│   └── user.model.ts    # User table schema (Drizzle)
├── routes/               # API route definitions
│   ├── auth.routes.ts   # Authentication routes
│   └── users.routes.ts  # User CRUD routes
├── services/             # Business logic layer
│   ├── auth.service.ts  # Authentication services (hash, compare, create, authenticate)
│   └── users.services.ts # User CRUD services
├── types/                # TypeScript type definitions
│   ├── service.types.ts   # Service-related interfaces (CreateUser, UserResponse)
│   ├── express.d.ts       # Express Request augmentation (req.user)
│   └── middleware.types.ts # Middleware type definitions (Arcjet)
├── utils/                # Utility functions
│   ├── cookies.ts       # Cookie management (set, clear, get)
│   └── jwt.ts           # JWT token handling (sign, verify)
├── validations/          # Input validation schemas (Zod)
│   ├── auth.validation.ts  # Authentication validation (register, login)
│   ├── users.validation.ts # User CRUD validation (id, update)
│   └── format.ts        # Validation error formatting
└── __tests__/            # Integration tests
    └── app.test.ts      # Health check and API status tests
```

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
- **JWT Tokens**: Stateless authentication with 1-day token expiry
- **HTTP-Only Cookies**: Session tokens stored in secure, HTTP-only cookies (15-min maxAge, `sameSite=strict`)
- **Security Headers**: Helmet provides comprehensive security headers (CSP, HSTS, etc.)
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Arcjet sliding window rate limits per role (Guest: 5/min, User: 10/min, Admin: 20/min)
- **Bot Detection**: Arcjet automatically blocks automated/bot requests
- **Attack Shielding**: Arcjet protects against SQL injection and common web attacks
- **Input Validation**: Zod schemas prevent malformed data at the controller layer
- **Authorization**: Role-based access control on all user mutation endpoints
- **Error Handling**: Sensitive information not leaked in error responses; generic 500 for unknown errors

## 🗄 Database Schema

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

The project includes an integration test suite using Jest and Supertest.

**Run tests:**

```bash
npm run test
```

**Test configuration** (`jest.config.ts`):
- Uses `ts-jest` for TypeScript support
- Test files are located in `src/__tests__/`

Current test coverage includes:
- Health check endpoint (`GET /health`)
- API status endpoint (`GET /api`)
- 404 handling for nonexistent routes

To add more tests, create new test files in `src/__tests__/` following the existing pattern.

## 🚢 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_secure_jwt_secret
PORT=3000
ARCJET_KEY=your_arcjet_key
```

### Build and Deploy Steps

```bash
# Build TypeScript
npm run build

# Run migrations on production database
npm run db:migrate

# Start the server
npm start
```

### Docker Deployment

```bash
# Production (with existing .env)
docker-compose -f docker-compose.prod.yml up --build -d

# Or pass DATABASE_URL inline
DATABASE_URL="your-neon-cloud-url" docker-compose -f docker-compose.prod.yml up --build -d
```

### Recommended Hosting

- **Vercel/Netlify**: For serverless deployment
- **Railway/Render**: For full Node.js hosting
- **AWS/GCP/Azure**: For enterprise deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and run lint + build: `npm run lint && npm run build`
4. Run tests: `npm run test`
5. Commit your changes: `npm run commit`
6. Push to your branch: `git push origin feature/your-feature`
7. Open a Pull Request

### Code Style

- Follow ESLint and Prettier configurations
- Use TypeScript strict mode with NodeNext module resolution
- Write clear commit messages
- Add JSDoc comments for complex functions