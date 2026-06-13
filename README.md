# TaskMaster — Full-Stack CRUD Application

A production-grade Task Manager built with **Node.js + Express** (REST API) and **React + Vite** (frontend), backed by an in-memory store designed to swap cleanly for **MongoDB** or **PostgreSQL**.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Node.js, Express 4, UUID                |
| Frontend   | React 18, Vite 4                        |
| Database   | In-memory (MongoDB/PostgreSQL ready)    |
| Styling    | Custom CSS with design tokens           |

---

## Project Structure

```
taskmaster/
├── server/
│   ├── index.js          # Express app — REST API + CORS + validation
│   └── package.json
├── client/
│   ├── src/
│   │   ├── main.jsx      # React entry point
│   │   ├── App.jsx       # Root component — state, CRUD handlers, layout
│   │   ├── TaskCard.jsx  # Task display with inline status cycling
│   │   ├── TaskForm.jsx  # Create/edit modal form
│   │   ├── api.js        # Centralized fetch API service
│   │   └── index.css     # CSS design system (variables, reset)
│   ├── index.html
│   ├── vite.config.js    # Dev proxy: /api → localhost:4000
│   └── package.json
└── README.md
```

---

## Quick Start

### 1. Install dependencies
```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 2. Start the backend
```bash
cd server
node index.js
# → API running at http://localhost:4000
```

### 3. Start the frontend (new terminal)
```bash
cd client
npx vite
# → App running at http://localhost:3000
```

---

## REST API Reference

Base URL: `http://localhost:4000/api`

### Tasks

| Method | Endpoint         | Description             |
|--------|------------------|-------------------------|
| GET    | /tasks           | List all tasks          |
| GET    | /tasks?status=   | Filter by status        |
| GET    | /tasks?priority= | Filter by priority      |
| GET    | /tasks?search=   | Search title/description|
| GET    | /tasks/:id       | Get single task         |
| POST   | /tasks           | Create task             |
| PUT    | /tasks/:id       | Full update             |
| PATCH  | /tasks/:id       | Partial update          |
| DELETE | /tasks/:id       | Delete task             |
| GET    | /stats           | Dashboard statistics    |
| GET    | /health          | Health check            |

### Task Schema

```json
{
  "id":          "uuid-v4",
  "title":       "string (required, max 120 chars)",
  "description": "string",
  "status":      "todo | in-progress | done",
  "priority":    "low | medium | high",
  "category":    "string",
  "dueDate":     "YYYY-MM-DD | null",
  "createdAt":   "ISO 8601",
  "updatedAt":   "ISO 8601"
}
```

### Example: Create a Task
```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build REST API",
    "description": "Set up Express with CRUD endpoints",
    "priority": "high",
    "status": "in-progress",
    "category": "Engineering",
    "dueDate": "2024-12-31"
  }'
```

### Example: Update Task Status
```bash
curl -X PATCH http://localhost:4000/api/tasks/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

---

## Swapping to MongoDB

Replace the in-memory `tasks` array in `server/index.js` with Mongoose:

```js
// npm install mongoose
const mongoose = require('mongoose');
await mongoose.connect('mongodb://localhost:27017/taskmaster');

const TaskSchema = new mongoose.Schema({
  title:       { type: String, required: true, maxlength: 120 },
  description: String,
  status:      { type: String, enum: ['todo','in-progress','done'], default: 'todo' },
  priority:    { type: String, enum: ['low','medium','high'], default: 'medium' },
  category:    { type: String, default: 'General' },
  dueDate:     Date,
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);
```

Then replace array operations with `Task.find()`, `Task.create()`, `Task.findByIdAndUpdate()`, etc.

---

## Swapping to PostgreSQL

```sql
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(120) NOT NULL,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'todo',
  priority    VARCHAR(20) DEFAULT 'medium',
  category    VARCHAR(60) DEFAULT 'General',
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Use `pg` or `prisma` as the Node.js client.

---

## Features

- **Full CRUD** — Create, Read, Update, Delete tasks via REST API
- **Filter & Search** — by status, priority, and free-text search
- **Status cycling** — click status pill on any card to cycle todo → in-progress → done
- **Stats dashboard** — live counts by status, priority, and overdue tasks
- **Due date warnings** — color-coded overdue / today / soon indicators
- **Input validation** — server-side with descriptive error messages
- **CORS enabled** — ready for cross-origin frontend deployments


# Backend Terminal Code
- cd "c:\Users\HP\Documents\CRUD Application\server"
- npm install
- npm start

# Frontend Terminal Code
- cd "c:\Users\HP\Documents\CRUD Application\client"
- npm install
- npm run dev -- --force