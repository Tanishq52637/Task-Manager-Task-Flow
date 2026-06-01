# ⚡ TaskFlow — REST API + Frontend

A full-stack task management app built as part of the Backend Developer Intern assignment.

## What's inside

- **Backend**: Node.js + Express REST API with JWT auth, role-based access, and full CRUD
- **Frontend**: React app that consumes the API
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT tokens, bcrypt password hashing, rate limiting
- **Docs**: Swagger UI available at `/api-docs`

---

## Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, Swagger setup
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error handling, validation
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/v1/      # Versioned API routes
│   │   ├── utils/          # JWT helper
│   │   ├── validators/     # express-validator rules
│   │   ├── app.js          # Express app config
│   │   └── server.js       # Entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, TaskModal
│   │   ├── context/        # AuthContext (global auth state)
│   │   ├── pages/          # Login, Register, Dashboard, AdminPanel
│   │   ├── services/       # Axios API service
│   │   └── App.js
│   └── package.json
│
├── SCALABILITY.md
└── README.md
```

---

## Setup & Running

### Prerequisites
- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Backend

```bash
cd backend
cp .env.example .env
# edit .env with your MongoDB URI and a strong JWT secret
npm install
npm run dev
```

Server runs on `http://localhost:5000`

Swagger docs: `http://localhost:5000/api-docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

---

## API Overview (v1)

All endpoints are prefixed with `/api/v1`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login, returns JWT |
| GET | /auth/me | Yes | Get current user |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /tasks | Yes | Get tasks (own tasks, or all if admin) |
| POST | /tasks | Yes | Create task |
| GET | /tasks/:id | Yes | Get single task |
| PUT | /tasks/:id | Yes | Update task |
| DELETE | /tasks/:id | Yes | Delete task |

Query params for GET /tasks: `status`, `priority`, `page`, `limit`

### Users (Admin only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /users | Admin | List all users |
| GET | /users/:id | Admin | Get user by ID |
| PATCH | /users/:id/role | Admin | Change user role |
| DELETE | /users/:id | Admin | Delete user |

### To create an admin user
Register normally, then manually update the role in MongoDB:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## Security measures

- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens with configurable expiry
- Passwords never returned in API responses (`select: false`)
- Rate limiting on all routes (stricter on auth routes)
- Helmet for security headers
- Input validation and sanitization via express-validator
- Vague error messages on failed auth (don't leak which field failed)
- Users can't self-assign admin role on registration
- Admins can't delete/demote themselves

---

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

See `SCALABILITY.md` for notes on scaling this to production.
