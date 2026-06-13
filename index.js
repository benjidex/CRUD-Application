/**
 * TaskMaster API Server
 * Express REST API with in-memory store (drop-in replaceable with MongoDB/PostgreSQL)
 * Endpoints: GET/POST /api/tasks, GET/PUT/DELETE /api/tasks/:id
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 4000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── In-Memory Database (swap for MongoDB/PostgreSQL adapter) ────────────────
// MongoDB equivalent: mongoose.model('Task', TaskSchema)
// PostgreSQL equivalent: CREATE TABLE tasks (id UUID PRIMARY KEY, ...)
let tasks = [
  {
    id: uuidv4(),
    title: 'Design system architecture',
    description: 'Plan the microservices layout and database schema for Q3 launch.',
    status: 'in-progress',
    priority: 'high',
    category: 'Engineering',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Write API documentation',
    description: 'Document all REST endpoints using OpenAPI 3.0 spec.',
    status: 'todo',
    priority: 'medium',
    category: 'Engineering',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Conduct user interviews',
    description: 'Interview 10 power users about the new dashboard UX.',
    status: 'todo',
    priority: 'high',
    category: 'Research',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment.',
    status: 'done',
    priority: 'high',
    category: 'DevOps',
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Quarterly performance reviews',
    description: 'Complete self-assessment and peer reviews before deadline.',
    status: 'todo',
    priority: 'low',
    category: 'HR',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ── Validation Helper ───────────────────────────────────────────────────────
const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

function validateTask(body, partial = false) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 1)
      errors.push('title is required and must be a non-empty string');
    if (body.title && body.title.length > 120)
      errors.push('title must be 120 characters or fewer');
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status))
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority))
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  return errors;
}

// ── Request Logger ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), taskCount: tasks.length });
});

// GET /api/tasks — list all tasks (supports ?status=, ?priority=, ?category=, ?search=)
app.get('/api/tasks', (req, res) => {
  let result = [...tasks];
  const { status, priority, category, search } = req.query;

  if (status) result = result.filter(t => t.status === status);
  if (priority) result = result.filter(t => t.priority === priority);
  if (category) result = result.filter(t => t.category === category);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    );
  }

  // Sort: newest first
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// GET /api/tasks/:id — get single task
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, data: task });
});

// POST /api/tasks — create task
app.post('/api/tasks', (req, res) => {
  const errors = validateTask(req.body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const task = {
    id: uuidv4(),
    title: req.body.title.trim(),
    description: (req.body.description || '').trim(),
    status: req.body.status || 'todo',
    priority: req.body.priority || 'medium',
    category: (req.body.category || 'General').trim(),
    dueDate: req.body.dueDate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  res.status(201).json({ success: true, data: task });
});

// PUT /api/tasks/:id — full update
app.put('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Task not found' });

  const errors = validateTask(req.body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  tasks[idx] = {
    ...tasks[idx],
    title: req.body.title.trim(),
    description: (req.body.description || '').trim(),
    status: req.body.status || tasks[idx].status,
    priority: req.body.priority || tasks[idx].priority,
    category: (req.body.category || tasks[idx].category).trim(),
    dueDate: req.body.dueDate !== undefined ? req.body.dueDate : tasks[idx].dueDate,
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, data: tasks[idx] });
});

// PATCH /api/tasks/:id — partial update (e.g., toggle status)
app.patch('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Task not found' });

  const errors = validateTask(req.body, true);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const allowed = ['title', 'description', 'status', 'priority', 'category', 'dueDate'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) tasks[idx][field] = req.body[field];
  });
  tasks[idx].updatedAt = new Date().toISOString();

  res.json({ success: true, data: tasks[idx] });
});

// DELETE /api/tasks/:id — delete task
app.delete('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Task not found' });

  const deleted = tasks.splice(idx, 1)[0];
  res.json({ success: true, data: deleted, message: 'Task deleted successfully' });
});

// GET /api/stats — dashboard stats
app.get('/api/stats', (_req, res) => {
  const stats = {
    total: tasks.length,
    byStatus: {
      todo: tasks.filter(t => t.status === 'todo').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    },
    byPriority: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    },
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
  };
  res.json({ success: true, data: stats });
});

// 404 fallback
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 TaskMaster API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Tasks:  http://localhost:${PORT}/api/tasks\n`);
});
