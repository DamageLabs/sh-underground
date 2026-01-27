const API_BASE = '/api';

export const api = {
  async register(username, password) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }
    return res.json();
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    return res.json();
  },

  async getUser(username) {
    const res = await fetch(`${API_BASE}/user/${username}`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get user');
    }
    return res.json();
  },

  async updateUser(username, updates) {
    const res = await fetch(`${API_BASE}/user/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update user');
    }
    return res.json();
  },

  async changePassword(username, currentPassword, newPassword) {
    const res = await fetch(`${API_BASE}/user/${username}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to change password');
    }
    return res.json();
  },

  async getAllUsers() {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get users');
    }
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get users');
    }
    return res.json();
  },

  async deleteUser(username) {
    const res = await fetch(`${API_BASE}/admin/user/${username}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete user');
    }
    return res.json();
  },

  async exportUsers() {
    const res = await fetch(`${API_BASE}/admin/export`);
    if (!res.ok) {
      throw new Error('Failed to export users');
    }
    return res.json();
  },

  async importUsers(users, mode = 'merge') {
    const res = await fetch(`${API_BASE}/admin/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users, mode }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to import users');
    }
    return res.json();
  },
};
