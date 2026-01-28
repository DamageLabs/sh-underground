const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const multer = require('multer');
const Database = require('better-sqlite3');

const SALT_ROUNDS = 10;

const app = express();
const PORT = 3002;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.params.username}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Initialize SQLite database
const db = new Database(path.join(dataDir, 'users.db'));

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    fullName TEXT DEFAULT '',
    location TEXT,
    latitude REAL,
    longitude REAL,
    isAdmin INTEGER DEFAULT 0,
    resetToken TEXT,
    resetTokenExpires INTEGER
  )
`);

// Migration: Add reset token columns if they don't exist
const columns = db.prepare("PRAGMA table_info(users)").all();
const columnNames = columns.map(c => c.name);
if (!columnNames.includes('resetToken')) {
  db.exec('ALTER TABLE users ADD COLUMN resetToken TEXT');
}
if (!columnNames.includes('resetTokenExpires')) {
  db.exec('ALTER TABLE users ADD COLUMN resetTokenExpires INTEGER');
}

const RESET_TOKEN_EXPIRY_HOURS = 24;

// Available marker colors
const MARKER_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'ltblue'];

// Migration: Add markerColor column if it doesn't exist
const markerColumns = db.prepare("PRAGMA table_info(users)").all();
const markerColumnNames = markerColumns.map(c => c.name);
if (!markerColumnNames.includes('markerColor')) {
  db.exec("ALTER TABLE users ADD COLUMN markerColor TEXT DEFAULT 'red'");
}
if (!markerColumnNames.includes('profilePhoto')) {
  db.exec("ALTER TABLE users ADD COLUMN profilePhoto TEXT");
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Admin middleware - checks x-username header for admin status
const requireAdmin = (req, res, next) => {
  const username = req.headers['x-username'];

  if (!username) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (!user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.adminUser = user;
  next();
};

// Helper to format user for API response
const formatUser = (row) => ({
  username: row.username,
  fullName: row.fullName || '',
  location: row.location,
  coordinates: row.latitude && row.longitude ? { lat: row.latitude, lng: row.longitude } : null,
  isAdmin: !!row.isAdmin,
  markerColor: row.markerColor || 'red',
  profilePhoto: row.profilePhoto || null,
});

const formatUserSession = (row) => ({
  username: row.username,
  fullName: row.fullName || '',
  location: row.location,
  coordinates: row.latitude && row.longitude ? { lat: row.latitude, lng: row.longitude } : null,
  isAdmin: !!row.isAdmin,
  markerColor: row.markerColor || 'red',
  profilePhoto: row.profilePhoto || null,
});

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const existing = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  db.prepare(`
    INSERT INTO users (username, password, fullName, location, latitude, longitude, isAdmin)
    VALUES (?, ?, '', NULL, NULL, NULL, 0)
  `).run(username, hashedPassword);

  res.json({
    username,
    fullName: '',
    location: null,
    coordinates: null,
    isAdmin: false,
    markerColor: 'red',
    profilePhoto: null,
  });
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json(formatUserSession(user));
});

// Get current user (refresh session data)
app.get('/api/user/:username', (req, res) => {
  const { username } = req.params;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(formatUserSession(user));
});

// Update user profile
app.put('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const { fullName, location, coordinates, markerColor } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Validate marker color if provided
  const validMarkerColor = markerColor && MARKER_COLORS.includes(markerColor) ? markerColor : user.markerColor;

  const updates = {
    fullName: fullName !== undefined ? fullName : user.fullName,
    location: location !== undefined ? location : user.location,
    latitude: coordinates?.lat !== undefined ? coordinates.lat : user.latitude,
    longitude: coordinates?.lng !== undefined ? coordinates.lng : user.longitude,
    markerColor: validMarkerColor || 'red',
  };

  db.prepare(`
    UPDATE users SET fullName = ?, location = ?, latitude = ?, longitude = ?, markerColor = ?
    WHERE username = ?
  `).run(updates.fullName, updates.location, updates.latitude, updates.longitude, updates.markerColor, username);

  const updated = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  res.json(formatUserSession(updated));
});

// Change password
app.put('/api/user/:username/password', async (req, res) => {
  const { username } = req.params;
  const { currentPassword, newPassword } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedPassword, username);

  res.json({ success: true });
});

// Reset password with token (public endpoint)
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE resetToken = ?').get(token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  if (user.resetTokenExpires && user.resetTokenExpires < Date.now()) {
    // Clear expired token
    db.prepare('UPDATE users SET resetToken = NULL, resetTokenExpires = NULL WHERE username = ?').run(user.username);
    return res.status(400).json({ error: 'Reset token has expired' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpires = NULL WHERE username = ?')
    .run(hashedPassword, user.username);

  res.json({ success: true, message: 'Password has been reset' });
});

// Verify reset token (public endpoint)
app.get('/api/verify-reset-token/:token', (req, res) => {
  const { token } = req.params;

  const user = db.prepare('SELECT username, resetTokenExpires FROM users WHERE resetToken = ?').get(token);

  if (!user) {
    return res.status(400).json({ valid: false, error: 'Invalid reset token' });
  }

  if (user.resetTokenExpires && user.resetTokenExpires < Date.now()) {
    return res.status(400).json({ valid: false, error: 'Reset token has expired' });
  }

  res.json({ valid: true, username: user.username });
});

// Get all users (for map and admin)
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users.map(u => ({
    username: u.username,
    fullName: u.fullName || '',
    location: u.location,
    coordinates: u.latitude && u.longitude ? { lat: u.latitude, lng: u.longitude } : null,
    markerColor: u.markerColor || 'red',
    profilePhoto: u.profilePhoto || null,
  })));
});

// Upload profile photo
app.post('/api/user/:username/photo', upload.single('photo'), (req, res) => {
  const { username } = req.params;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Delete old photo if exists
  if (user.profilePhoto) {
    const oldPhotoPath = path.join(uploadsDir, path.basename(user.profilePhoto));
    if (fs.existsSync(oldPhotoPath)) {
      fs.unlinkSync(oldPhotoPath);
    }
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET profilePhoto = ? WHERE username = ?').run(photoUrl, username);

  res.json({ success: true, profilePhoto: photoUrl });
});

// Delete profile photo
app.delete('/api/user/:username/photo', (req, res) => {
  const { username } = req.params;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.profilePhoto) {
    const photoPath = path.join(uploadsDir, path.basename(user.profilePhoto));
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }

  db.prepare('UPDATE users SET profilePhoto = NULL WHERE username = ?').run(username);
  res.json({ success: true });
});

// Get available marker colors
app.get('/api/marker-colors', (req, res) => {
  res.json(MARKER_COLORS);
});

// Admin: Get all users with full data
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users.map(formatUser));
});

// Admin: Delete user
app.delete('/api/admin/user/:username', requireAdmin, (req, res) => {
  const { username } = req.params;

  const user = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare('DELETE FROM users WHERE username = ?').run(username);
  res.json({ success: true });
});

// Admin: Set user admin status
app.put('/api/admin/user/:username/admin', requireAdmin, (req, res) => {
  const { username } = req.params;
  const { isAdmin } = req.body;

  const user = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare('UPDATE users SET isAdmin = ? WHERE username = ?').run(isAdmin ? 1 : 0, username);
  res.json({ success: true, username, isAdmin: !!isAdmin });
});

// Admin: Generate password reset token for a user
app.post('/api/admin/user/:username/reset-token', requireAdmin, (req, res) => {
  const { username } = req.params;

  const user = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = Date.now() + (RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  db.prepare('UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE username = ?')
    .run(resetToken, resetTokenExpires, username);

  res.json({
    success: true,
    username,
    resetToken,
    expiresAt: new Date(resetTokenExpires).toISOString(),
    resetUrl: `/reset-password?token=${resetToken}`,
  });
});

// Admin: Export all user data
app.get('/api/admin/export', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  const exported = {};
  users.forEach(u => {
    exported[u.username] = {
      username: u.username,
      password: u.password,
      fullName: u.fullName || '',
      location: u.location,
      coordinates: u.latitude && u.longitude ? { lat: u.latitude, lng: u.longitude } : null,
      isAdmin: !!u.isAdmin,
      markerColor: u.markerColor || 'red',
      profilePhoto: u.profilePhoto || null,
    };
  });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=users-export.json');
  res.json(exported);
});

// Admin: Import user data
app.post('/api/admin/import', requireAdmin, async (req, res) => {
  const { users, mode } = req.body;

  if (!users || typeof users !== 'object') {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  if (mode === 'replace') {
    db.prepare('DELETE FROM users').run();
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO users (username, password, fullName, location, latitude, longitude, isAdmin, markerColor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const [username, data] of Object.entries(users)) {
    insert.run(
      username,
      data.password,
      data.fullName || '',
      data.location || null,
      data.coordinates?.lat || null,
      data.coordinates?.lng || null,
      data.isAdmin ? 1 : 0,
      data.markerColor || 'red'
    );
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  res.json({ success: true, count });
});

app.listen(PORT, () => {
  console.log(`SH Underground API running on port ${PORT}`);
});
