# Acquisitions API Architecture

## 1. Big Picture

**Project Type**: RESTful Web API built with Node.js and Express.

**Problem Solved**: Manages user acquisition processes, including user registration, authentication, and full user profile management (CRUD). The system provides a secure backend for user-facing applications with role-based access control.

## 2. Core Architecture

The application follows a **layered (n-tier) architecture** with clear separation of concerns:

```
src/
├── app.ts          # Express application setup and middleware
├── server.ts       # Server entry point
├── index.ts        # Application bootstrap
├── config/         # Configuration (database, logger, security)
├── controllers/    # Request handlers
├── routes/         # API route definitions
├── services/       # Business logic
├── models/         # Database schema definitions
├── validations/    # Input validation schemas
├── types/          # TypeScript interfaces and types
└── utils/          # Utility functions
```

**Data Flow (Vertical Slice)**:

```
HTTP Request
    ↓
[Middleware Layer]     ← helmet, cors, json, cookieParser, morgan, arcjet
    ↓
[Routing Layer]        ← Express Router delegates to controller
    ↓
[Controller Layer]     ← Validates input (Zod), handles HTTP concerns, delegates to service
    ↓
[Service Layer]        ← Business logic, database operations via Drizzle ORM
    ↓
[Persistence Layer]    ← Drizzle ORM → PostgreSQL (Neon Serverless)
```

Responses flow back upward through the same layers.

## 3. Key Components

### 3.1 Application Setup (`src/app.ts`)

- Configures Express middleware:
  - `helmet()`: Security headers
  - `cors()`: Cross-origin resource sharing
  - `express.json()`: JSON body parsing
  - `urlencoded()`: URL-encoded body parsing
  - `cookieParser()`: Cookie parsing
  - `morgan`: HTTP request logging via Winston
  - `securityMiddleware`: Arcjet rate limiting, bot detection, and shield
- Defines basic health check endpoints (`/`, `/health`, `/api`)
- Mounts authentication routes at `/api/auth`
- Mounts user CRUD routes at `/api/users`

### 3.2 Server Entry (`src/server.ts`)

- Creates HTTP server listening on `process.env.PORT` or 3000
- Logs server startup message

### 3.3 Configuration (`src/config/`)

- **database.ts**: Sets up Neon serverless PostgreSQL connection using Drizzle ORM (`neon()` → `drizzle()`)
- **logger.ts**: Configures Winston logger with File and Console transports; JSON format in production, colorized in development
- **arcjet.ts**: Configures Arcjet client with shield (LIVE), bot detection, and sliding window rate limiting

### 3.4 Routes (`src/routes/`)

- **auth.routes.ts**: Defines authentication endpoints (`POST /register`, `POST /login`, `POST /logout`)
- **users.routes.ts**: Defines user CRUD endpoints (`GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`)
- Routes delegate to controller methods; no business logic in routes

### 3.5 Controllers (`src/controllers/`)

- **auth.controller.ts**: Handles authentication requests
  - `register` — validates with `registerSchema`, creates user via service, signs JWT, sets cookie
  - `signin` — validates with `logInSchema`, authenticates via service, signs JWT, sets cookie
  - `signout` — clears authentication cookie
- **user.controller.ts**: Handles user CRUD requests
  - `getAllUsers` — retrieves all users from service
  - `getUserByIdHandler` — validates `:id` param, retrieves single user
  - `updateUserHandler` — validates param + body, enforces authorization rules, updates user
  - `deleteUserHandler` — validates param, enforces authorization rules, deletes user

All controllers follow the same pattern:
1. Validate input with Zod `safeParse()`
2. Return 400 with formatted errors on validation failure
3. Delegate to service layer for business logic
4. Log on success and failure
5. Handle known errors with specific HTTP status codes
6. Forward unknown errors via `next(e)` to Express error handler

### 3.6 Services (`src/services/`)

- **auth.service.ts**: Contains authentication business logic
  - `hashPassword()` — bcrypt hashing (10 rounds)
  - `comparePassword()` — bcrypt comparison
  - `authenticateUser()` — queries user by email, verifies password, returns user without password
  - `createUser()` — checks for duplicate email, hashes password, inserts user, excludes password from return
- **users.services.ts**: Contains user CRUD business logic
  - `getUsers()` — selects all users with explicit column projection
  - `getUserById()` — queries by ID, throws "User not found" if absent
  - `updateUser()` — checks existence, applies partial update with `updatedAt` refresh, returns updated row
  - `deleteUser()` — checks existence before deletion, throws "User not found" if absent

All services follow the same pattern:
1. Try/catch wrapping all database operations
2. Log errors with context before re-throwing
3. Explicit return type annotations on all functions
4. Use Drizzle ORM query builder (no raw SQL)

### 3.7 Models (`src/models/`)

- **user.model.ts**: Defines `users` table schema using Drizzle ORM
  - Fields: `id` (serial PK), `name` (varchar 255), `email` (varchar 255, unique), `password` (varchar 255), `role` (varchar 50, default 'user'), `createdAt` and `updatedAt` (timestamps)

### 3.8 Utilities (`src/utils/`)

- **jwt.ts**: JWT token signing (async, 1-day expiry) and verification (sync) using `JWT_SECRET` env var
- **cookies.ts**: Cookie set/clear/get utilities with secure defaults (httpOnly, secure in production, sameSite=strict, 15-min maxAge)

### 3.9 Validations (`src/validations/`)

- **auth.validation.ts**: Zod schemas for authentication
  - `registerSchema` — name (2-255), email, password (6-128), role (enum)
  - `logInSchema` — email, password
- **users.validation.ts**: Zod schemas for user CRUD
  - `userIdSchema` — validates `id` param as positive integer via `z.coerce.number()`
  - `updateUserSchema` — optional fields: name, email, role (enum)
- **format.ts**: `formatValidationError()` utility that converts Zod `ZodError` into a human-readable string

### 3.10 Types (`src/types/`)

- **service.types.ts**: `CreateUser` interface (name, email, password, role) with optional `id`; `UserResponse` type (omit password)
- **express.d.ts**: Augments `Express.Request` with optional `user` property typed as `CreateUser`
- **middleware.types.ts**: `CustomSlidingWindowLimitOptions` extending Arcjet's sliding window options

## 4. Authorization Model

User endpoints enforce role-based access control at the controller layer:

| Action       | Own Profile | Admin | Other Users |
|-------------|-------------|-------|-------------|
| Read (GET)  | ✅           | ✅    | ✅           |
| Update (PUT)| ✅           | ✅    | ✅ (admins only) |
| Delete (DEL)| ✅           | ✅    | ✅ (admins only) |

- **Non-admin users** may only read/update/delete **their own** account
- **Admin users** may read/update/delete **any** account
- **Role changes** (`role` field) may only be performed by admin users
- Unauthenticated requests receive `401 Authentication required`
- Unauthorized cross-user operations receive `403`

## 5. Error Handling Strategy

```
Known Business Error (e.g., "User not found")
    → Controller catches, maps to HTTP status (404), returns sanitized message

Validation Error (Zod safeParse failure)
    → Controller returns 400 with formatted validation details

Authorization Error
    → Controller returns 401 or 403 with descriptive message

Unknown Error
    → Controller logs with logger.error(), forwards via next(e) to Express
    → Client receives generic 500
```

## 6. Tech Stack & Dependencies

### Core Technologies
- **Runtime**: Node.js 18+ with ES Modules
- **Framework**: Express.js v5
- **Language**: TypeScript 6.x (strict mode, NodeNext module resolution)
- **ORM**: Drizzle ORM v0.45 with `drizzle-kit` for migrations
- **Database**: PostgreSQL via Neon Serverless

### Security & Authentication
- **JWT**: jsonwebtoken for stateless session management
- **Bcrypt**: Password hashing (6 rounds)
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Arcjet**: Rate limiting, bot detection, attack shielding
- **cookie-parser**: HTTP-only cookie management

### Development & Quality
- **TypeScript Compiler**: tsc for production builds
- **tsx**: Runtime transpilation for development
- **Nodemon**: Hot-reload development server
- **ESLint + Prettier**: Code quality and formatting
- **Winston + Morgan**: Structured logging

### Why These Choices?
- **TypeScript**: Catches errors at compile time, improves maintainability
- **Drizzle ORM**: Type-safe SQL with minimal abstraction, good DX
- **Neon Serverless**: Scalable PostgreSQL with generous free tier
- **JWT + Bcrypt**: Industry standard for stateless authentication
- **Zod**: Runtime validation with TypeScript inference
- **Arcjet**: Declarative security rules with bot detection built-in
- **Winston/Morgan**: Flexible, transport-based logging

## 7. Execution Flow Examples

### User Registration Flow
```
Client → POST /api/auth/register
    ↓
[Middleware: helmet, cors, json, cookieParser, morgan, arcjet]
    ↓
[Router: auth.routes → register endpoint]
    ↓
[Controller: auth.controller.register]
    ↓ (Validate with Zod schema)
[Service: auth.service.createUser]
    ↓ (Check duplicate email)
    ↓ (Hash password with bcrypt)
    ↓ (Insert user into database via Drizzle)
    ↓ (Generate JWT token)
    ↓ (Set HTTP-only cookie)
    ↓
[Controller: Format 201 response]
    ↓
[Response: 201 Created with user data]
```

### User Update Flow
```
Client → PUT /api/users/:id (with JWT cookie)
    ↓
[Middleware: helmet, cors, json, cookieParser, morgan, arcjet]
    ↓
[Router: users.routes → updateUserHandler]
    ↓
[Controller: Validate param (userIdSchema) + body (updateUserSchema)]
    ↓ (Return 400 on validation failure)
    ↓ (Check authentication: req.user exists?)
    ↓ (Return 401 if unauthenticated)
    ↓ (Check authorization: own profile or admin?)
    ↓ (Return 403 if unauthorized)
    ↓ (Check role change: admin only?)
    ↓ (Return 403 if non-admin changing role)
[Service: users.services.updateUser]
    ↓ (Check user exists)
    ↓ (Throw "User not found" → 404)
    ↓ (Apply partial update with updatedAt)
    ↓ (Return updated user)
    ↓
[Controller: Format 200 response]
    ↓
[Response: 200 OK with updated user data]
```

### User Delete Flow
```
Client → DELETE /api/users/:id (with JWT cookie)
    ↓
[Middleware: helmet, cors, json, cookieParser, morgan, arcjet]
    ↓
[Router: users.routes → deleteUserHandler]
    ↓
[Controller: Validate param (userIdSchema)]
    ↓ (Return 400 on validation failure)
    ↓ (Check authentication: req.user exists?)
    ↓ (Return 401 if unauthenticated)
    ↓ (Check authorization: own profile or admin?)
    ↓ (Return 403 if unauthorized)
[Service: users.services.deleteUser]
    ↓ (Check user exists)
    ↓ (Throw "User not found" → 404)
    ↓ (Delete user from database)
    ↓
[Controller: Format 200 response]
    ↓
[Response: 200 OK with success message]
```

## 8. Strengths & Tradeoffs

### Strengths
- **Separation of Concerns**: Clear layering makes code maintainable and testable
- **Type Safety**: TypeScript throughout prevents runtime type errors
- **Modularity**: Easy to extend with new features following existing patterns
- **Security**: Industry-standard practices (helmet, bcrypt, JWT, HTTP-only cookies, Arcjet)
- **Role-Based Access**: Granular permissions on all user mutation endpoints
- **Developer Experience**: Modern tooling (ESLint, Prettier, Drizzle Kit, tsx hot-reload)
- **Scalability**: Neon serverless database scales automatically
- **Logging**: Comprehensive request and application logging

### Tradeoffs
- **Monolithic Structure**: May need refactoring for microservices at scale
- **Authentication Centralization**: All auth logic in one module (good for consistency, but could become large)
- **Serverless DB Limitations**: Neon has cold start latency and less direct DB control
- **Missing Features**: No explicit input sanitization beyond validation, or advanced caching
- **Testing Gap**: No test configuration visible in package.json

## 9. Final Summary

The Acquisitions API is a TypeScript-based RESTful service built with Express that implements a clean layered architecture. It uses Drizzle ORM with a Neon PostgreSQL database for persistent storage, JWT and bcrypt for secure authentication, and includes comprehensive middleware for security, logging, rate limiting, and request processing. The system enforces role-based access control on all user management endpoints, following a predictable request flow: middleware processing → routing → controller validation → service business logic → database interaction → formatted response, making it maintainable and extensible for future features.