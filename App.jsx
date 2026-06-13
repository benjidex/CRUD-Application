import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import TaskForm from './TaskForm.jsx';
import TaskCard from './TaskCard.jsx';

// ── Stats Bar ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <span style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: color || 'var(--text)', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
  );
}

// ── Filter Bar ──────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, taskCount }) {
  const btn = (key, val, label, activeColor) => {
    const active = filters[key] === val;
    return (
      <button
        key={val}
        onClick={() => onChange({ ...filters, [key]: active ? 'all' : val })}
        style={{
          padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
          border: `1px solid ${active ? (activeColor || 'var(--accent)') : 'var(--border)'}`,
          background: active ? (activeColor ? `${activeColor}22` : 'var(--accent-dim)') : 'transparent',
          color: active ? (activeColor || 'var(--accent)') : 'var(--text-muted)',
          transition: 'all 0.15s',
          cursor: 'pointer',
        }}
      >{label}</button>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Status filters */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {btn('status', 'all', 'All')}
        {btn('status', 'todo', 'Todo', 'var(--text-muted)')}
        {btn('status', 'in-progress', 'In Progress', 'var(--accent)')}
        {btn('status', 'done', 'Done', 'var(--green)')}
      </div>
      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
      {/* Priority filters */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {btn('priority', 'high', '↑ High', 'var(--red)')}
        {btn('priority', 'medium', '→ Med', 'var(--orange)')}
        {btn('priority', 'low', '↓ Low', 'var(--blue)')}
      </div>
      <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
        {taskCount} task{taskCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });
  const [serverOnline, setServerOnline] = useState(null);

  // Toast helper
  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Load tasks
  const fetchTasks = useCallback(async () => {
    try {
      const params = { ...filters, search: search.trim() };
      const res = await api.getTasks(params);
      setTasks(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [filters, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.getStats();
      setStats(res.data);
    } catch {}
  }, []);

  // Initial load + health check
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await api.getHealth();
        setServerOnline(true);
      } catch {
        setServerOnline(false);
        setError('Cannot connect to server at http://localhost:4000. Start the backend with: cd server && node index.js');
        setLoading(false);
        return;
      }
      await Promise.all([fetchTasks(), fetchStats()]);
      setLoading(false);
    })();
  }, []);

  // Refetch on filter/search changes
  useEffect(() => {
    if (serverOnline) fetchTasks();
  }, [filters, search, serverOnline]);

  // CRUD handlers
  async function handleCreate(data) {
    setFormLoading(true);
    try {
      await api.createTask(data);
      setShowForm(false);
      await Promise.all([fetchTasks(), fetchStats()]);
      notify('✓ Task created');
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(data) {
    setFormLoading(true);
    try {
      await api.updateTask(editTask.id, data);
      setEditTask(null);
      await Promise.all([fetchTasks(), fetchStats()]);
      notify('✓ Task updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTask(id);
      await Promise.all([fetchTasks(), fetchStats()]);
      notify('Task deleted');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await api.patchTask(id, { status });
      await Promise.all([fetchTasks(), fetchStats()]);
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 999,
          background: 'var(--surface)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)', padding: '12px 20px',
          color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem',
          boxShadow: 'var(--shadow-accent)',
          animation: 'slideIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Form modals */}
      {showForm && (
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      )}
      {editTask && (
        <TaskForm
          initial={editTask}
          onSubmit={handleUpdate}
          onCancel={() => setEditTask(null)}
          loading={formLoading}
        />
      )}

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '0 32px',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--accent)', letterSpacing: '0.06em' }}>TASKMASTER</h1>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: serverOnline === false ? 'var(--red)' : 'var(--green)',
            boxShadow: serverOnline === false ? '0 0 8px var(--red)' : '0 0 8px var(--green)',
          }} title={serverOnline === false ? 'Server offline' : 'Server online'} />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px', margin: '0 24px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: '0.9rem', pointerEvents: 'none' }}>⌕</span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              color: 'var(--text)', padding: '8px 12px 8px 32px',
              fontSize: '0.875rem', outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-faint)', fontSize: '0.8rem',
            }}>✕</button>
          )}
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent)', color: '#0a0a0f',
            padding: '9px 20px', borderRadius: 'var(--radius)',
            fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.06em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + NEW TASK
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 32px' }}>

        {/* Stats */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px', marginBottom: '28px',
          }}>
            <StatCard label="Total" value={stats.total} color="var(--text)" />
            <StatCard label="To Do" value={stats.byStatus.todo} color="var(--text-muted)" />
            <StatCard label="In Progress" value={stats.byStatus['in-progress']} color="var(--accent)" />
            <StatCard label="Done" value={stats.byStatus.done} color="var(--green)" />
            <StatCard label="High Priority" value={stats.byPriority.high} color="var(--red)" />
            <StatCard label="Overdue" value={stats.overdue} color={stats.overdue > 0 ? 'var(--red)' : 'var(--text-faint)'} />
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: '20px' }}>
          <FilterBar filters={filters} onChange={setFilters} taskCount={tasks.length} />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '1px solid var(--red)',
            borderRadius: 'var(--radius)', padding: '14px 18px',
            color: 'var(--red)', fontSize: '0.85rem', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ color: 'var(--red)', fontSize: '1rem' }}>✕</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⟳</div>
            <p style={{ fontSize: '0.9rem' }}>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>◻</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginBottom: '8px' }}>NO TASKS FOUND</h3>
            <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', marginBottom: '20px' }}>
              {search || filters.status !== 'all' || filters.priority !== 'all'
                ? 'Try clearing your filters'
                : 'Create your first task to get started'}
            </p>
            {!(search || filters.status !== 'all' || filters.priority !== 'all') && (
              <button onClick={() => setShowForm(true)} style={{
                background: 'var(--accent)', color: '#0a0a0f',
                padding: '10px 24px', borderRadius: 'var(--radius)',
                fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.06em',
              }}>
                + NEW TASK
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditTask}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        input:focus, textarea:focus, select:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
      `}</style>
    </div>
  );
}
