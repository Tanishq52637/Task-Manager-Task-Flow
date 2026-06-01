import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import { taskService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const statusOrder = ['todo', 'in-progress', 'done'];

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [deletingId, setDeletingId] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 10 };
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;

      const res = await taskService.getAll(params);
      setTasks(res.data.data.tasks);
      setPagination(prev => ({ ...prev, ...res.data.data.pagination }));
      setError('');
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = async (data) => {
    await taskService.create(data);
    showSuccess('Task created!');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTasks();
  };

  const handleUpdate = async (data) => {
    await taskService.update(editingTask._id, data);
    showSuccess('Task updated!');
    fetchTasks();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    setDeletingId(id);
    try {
      await taskService.delete(id);
      showSuccess('Task deleted');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickStatus = async (task, newStatus) => {
    try {
      await taskService.update(task._id, { status: newStatus });
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    } catch {
      setError('Failed to update status');
    }
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const stats = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length
  };

  return (
    <div className="page">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Hey, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="header-sub">Here's what's on your plate</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Task
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-num">{pagination.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-num todo-color">{stats.todo}</span>
            <span className="stat-label">Todo</span>
          </div>
          <div className="stat-card">
            <span className="stat-num inprog-color">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card">
            <span className="stat-num done-color">{stats.done}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="filter-bar">
          <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {(filter.status || filter.priority) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilter({ status: '', priority: '' })}>
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No tasks yet. Create your first one!</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div key={task._id} className={`task-card ${task.status === 'done' ? 'task-done' : ''}`}>
                <div className="task-top">
                  <div className="task-title-row">
                    <h3 className="task-title">{task.title}</h3>
                    <div className="task-badges">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="task-desc">{task.description}</p>
                  )}
                </div>

                <div className="task-bottom">
                  <div className="task-meta">
                    {task.dueDate && (
                      <span className="task-due">
                        📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {user?.role === 'admin' && task.owner && (
                      <span className="task-owner">👤 {task.owner.name}</span>
                    )}
                  </div>

                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={e => handleQuickStatus(task, e.target.value)}
                      className="status-select"
                    >
                      {statusOrder.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(task)}>Edit</button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(task._id)}
                      disabled={deletingId === task._id}
                    >
                      {deletingId === task._id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              ← Prev
            </button>
            <span className="page-info">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <TaskModal
          task={editingTask}
          onSave={editingTask ? handleUpdate : handleCreate}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
