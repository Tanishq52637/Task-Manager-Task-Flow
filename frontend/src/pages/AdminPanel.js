import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAll();
      setUsers(res.data.data.users);
      setError('');
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      showSuccess('Role updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await userService.delete(userId);
      setUsers(users.filter(u => u._id !== userId));
      showSuccess('User deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Admin Panel</h1>
            <p className="header-sub">Manage users and roles</p>
          </div>
        </div>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <div className="card">
            <div className="table-header">
              <span>{users.length} users total</span>
            </div>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className={!user.isActive ? 'inactive-row' : ''}>
                    <td>
                      <span className="user-name-cell">{user.name}</span>
                      {user._id === currentUser._id && (
                        <span className="you-tag">you</span>
                      )}
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>
                      <span className={`badge badge-${user.role}`}>{user.role}</span>
                    </td>
                    <td className="date-cell">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td>
                      <div className="action-btns">
                        {user._id !== currentUser._id && (
                          <>
                            <select
                              value={user.role}
                              onChange={e => handleRoleChange(user._id, e.target.value)}
                              className="role-select"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(user._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {user._id === currentUser._id && (
                          <span className="self-note">–</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
