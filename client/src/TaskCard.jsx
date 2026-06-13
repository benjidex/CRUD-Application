import React, { useState } from 'react';

const PRIORITY_CONFIG = {
  high: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'HIGH' },
  medium: { color: 'var(--orange)', bg: 'var(--orange-dim)', label: 'MED' },
  low: { color: 'var(--blue)', bg: 'var(--blue-dim)', label: 'LOW' },
};

const STATUS_CONFIG = {
  todo: { color: 'var(--text-muted)', label: 'Todo', icon: '○' },
  'in-progress': { color: 'var(--accent)', label: 'In Progress', icon: '◑' },
  done: { color: 'var(--green)', label: 'Done', icon: '●' },
};

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diff = Math.round((date - now) / 86400000);
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { text: 'Due today', today: true };
  if (diff === 1) return { text: 'Due tomorrow', soon: true };
  if (diff <= 3) return { text: `${diff}d left`, soon: true };
  return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];
  const due = formatDate(task.dueDate);

  const STATUS_CYCLE = ['todo', 'in-progress', 'done'];

  async function cycleStatus() {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length];
    setStatusLoading(true);
    await onStatusChange(task.id, next);
    setStatusLoading(false);
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color 0.2s, transform 0.15s',
        position: 'relative',
        overflow: 'hidden',
        opacity: task.status === 'done' ? 0.7 : 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-hover)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: priority.color,
          opacity: 0.8,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <h3
          style={{
            fontSize: '0.95rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            lineHeight: 1.4,
            flex: 1,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text)',
          }}
        >
          {task.title}
        </h3>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => onEdit(task)}
            title="Edit"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'var(--surface2)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface3)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface2)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            ✎
          </button>

          {confirmDelete ? (
            <>
              <button
                onClick={() => onDelete(task.id)}
                style={{
                  padding: '0 10px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--red)',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                DELETE
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '0 10px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--surface2)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                }}
              >
                CANCEL
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'var(--surface2)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--red-dim)';
                e.currentTarget.style.color = 'var(--red)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface2)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          {task.description.length > 120 ? task.description.slice(0, 120) + '…' : task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
        <button
          onClick={cycleStatus}
          disabled={statusLoading}
          title="Click to cycle status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '20px',
            border: `1px solid ${status.color}22`,
            background: `${status.color}18`,
            color: status.color,
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            opacity: statusLoading ? 0.5 : 1,
          }}
        >
          {status.icon} {status.label}
        </button>

        <span
          style={{
            padding: '3px 8px',
            borderRadius: '20px',
            background: priority.bg,
            color: priority.color,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          {priority.label}
        </span>

        <span
          style={{
            padding: '3px 8px',
            borderRadius: '20px',
            background: 'var(--surface2)',
            color: 'var(--text-faint)',
            fontSize: '0.7rem',
            fontWeight: 500,
          }}
        >
          {task.category}
        </span>

        {due && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.72rem',
              fontWeight: 500,
              color: due.overdue ? 'var(--red)' : due.today || due.soon ? 'var(--orange)' : 'var(--text-faint)',
            }}
          >
            {due.overdue ? '⚠ ' : due.today ? '⏰ ' : ''}{due.text}
          </span>
        )}
      </div>
    </div>
  );
}

