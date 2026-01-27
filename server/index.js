const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

app.use(cors());
app.use(express.json());

// Helper functions
const getUsers = () => {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
};

// Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = getUsers();

  if (users[username]) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = {
    username,
    password,
    fullName: '',
    location: null,
    coordinates: null,
  };

  users[username] = newUser;
  saveUsers(users);

  const userSession = {
    username,
    fullName: '',
    location: null,
    coordinates: null,
  };

  res.json(userSession);
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const users = getUsers();
  const user = users[username];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const userSession = {
    username: user.username,
    fullName: user.fullName || '',
    location: user.location,
    coordinates: user.coordinates,
  };

  res.json(userSession);
});

// Get current user (refresh session data)
app.get('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const users = getUsers();
  const user = users[username];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userSession = {
    username: user.username,
    fullName: user.fullName || '',
    location: user.location,
    coordinates: user.coordinates,
  };

  res.json(userSession);
});

// Update user profile
app.put('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const updates = req.body;

  const users = getUsers();

  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Don't allow changing username
  delete updates.username;

  users[username] = { ...users[username], ...updates };
  saveUsers(users);

  const userSession = {
    username: users[username].username,
    fullName: users[username].fullName || '',
    location: users[username].location,
    coordinates: users[username].coordinates,
  };

  res.json(userSession);
});

// Change password
app.put('/api/user/:username/password', (req, res) => {
  const { username } = req.params;
  const { currentPassword, newPassword } = req.body;

  const users = getUsers();

  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (users[username].password !== currentPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  users[username].password = newPassword;
  saveUsers(users);

  res.json({ success: true });
});

// Get all users (for map and admin)
app.get('/api/users', (req, res) => {
  const users = getUsers();
  const userList = Object.values(users).map(u => ({
    username: u.username,
    fullName: u.fullName || '',
    location: u.location,
    coordinates: u.coordinates,
  }));

  res.json(userList);
});

// Admin: Get all users with full data
app.get('/api/admin/users', (req, res) => {
  const users = getUsers();
  const userList = Object.values(users).map(u => ({
    username: u.username,
    fullName: u.fullName || '',
    location: u.location,
    coordinates: u.coordinates,
  }));

  res.json(userList);
});

// Admin: Delete user
app.delete('/api/admin/user/:username', (req, res) => {
  const { username } = req.params;
  const users = getUsers();

  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }

  delete users[username];
  saveUsers(users);

  res.json({ success: true });
});

// Admin: Export all user data
app.get('/api/admin/export', (req, res) => {
  const users = getUsers();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=users-export.json');
  res.json(users);
});

// Admin: Import user data
app.post('/api/admin/import', (req, res) => {
  const { users, mode } = req.body;

  if (!users || typeof users !== 'object') {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  const currentUsers = getUsers();
  let finalUsers;

  if (mode === 'replace') {
    // Replace all users with imported data
    finalUsers = users;
  } else {
    // Merge: imported users overwrite existing, keep others
    finalUsers = { ...currentUsers, ...users };
  }

  saveUsers(finalUsers);
  res.json({ success: true, count: Object.keys(finalUsers).length });
});

app.listen(PORT, () => {
  console.log(`SH Underground API running on port ${PORT}`);
});
