import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const USERS_KEY = 'location_app_users';

function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', location: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const storedUsers = localStorage.getItem(USERS_KEY);
    if (storedUsers) {
      const parsed = JSON.parse(storedUsers);
      setUsers(Object.values(parsed));
    }
  };

  const saveUsers = (usersArray) => {
    const usersObj = {};
    usersArray.forEach(u => {
      usersObj[u.username] = u;
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(usersObj));
  };

  const handleEditClick = (userToEdit) => {
    setSelectedUser(userToEdit);
    setEditForm({
      fullName: userToEdit.fullName || '',
      location: userToEdit.location || '',
    });
    setEditDialogOpen(true);
    setError('');
  };

  const handleDeleteClick = (userToDelete) => {
    setSelectedUser(userToDelete);
    setDeleteDialogOpen(true);
    setError('');
  };

  const handleEditSave = () => {
    const updatedUsers = users.map(u => {
      if (u.username === selectedUser.username) {
        return { ...u, fullName: editForm.fullName, location: editForm.location };
      }
      return u;
    });
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setEditDialogOpen(false);
    setSuccess(`User "${selectedUser.username}" updated successfully`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser.username === user.username) {
      setError("You cannot delete your own account");
      return;
    }
    const updatedUsers = users.filter(u => u.username !== selectedUser.username);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setDeleteDialogOpen(false);
    setSuccess(`User "${selectedUser.username}" deleted successfully`);
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Admin Dashboard
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.username}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.fullName || '-'}</TableCell>
                  <TableCell>{u.location || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleEditClick(u)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(u)}
                      size="small"
                      disabled={u.username === user.username}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name"
            fullWidth
            margin="normal"
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
          />
          <TextField
            label="Location"
            fullWidth
            margin="normal"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography>
            Are you sure you want to delete user "{selectedUser?.username}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;
