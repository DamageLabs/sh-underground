import { useState, useEffect, useRef } from 'react';
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
  Chip,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import BlockIcon from '@mui/icons-material/Block';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { api } from '../api';

function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', location: '' });
  const [importData, setImportData] = useState(null);
  const [importMode, setImportMode] = useState('merge');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invites, setInvites] = useState([]);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadUsers();
    loadInvites();
  }, []);

  const loadUsers = async () => {
    try {
      const userList = await api.getAdminUsers();
      setUsers(userList);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const loadInvites = async () => {
    try {
      const inviteList = await api.getAdminInvites();
      setInvites(inviteList);
    } catch {
      // silently fail
    }
  };

  const handleRevokeClick = (invite) => {
    setSelectedInvite(invite);
    setRevokeDialogOpen(true);
    setError('');
  };

  const handleRevokeConfirm = async () => {
    try {
      await api.revokeInvite(selectedInvite.token);
      await loadInvites();
      setRevokeDialogOpen(false);
      setSuccess('Invite token revoked');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getInviteStatus = (invite) => {
    if (invite.revoked) return { label: 'Revoked', color: 'error' };
    if (invite.used_by) return { label: 'Used', color: 'default' };
    return { label: 'Available', color: 'success' };
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

  const handleEditSave = async () => {
    try {
      await api.updateUser(selectedUser.username, {
        fullName: editForm.fullName,
        location: editForm.location,
      });
      await loadUsers();
      setEditDialogOpen(false);
      setSuccess(`User "${selectedUser.username}" updated successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser.username === user.username) {
      setError("You cannot delete your own account");
      return;
    }
    try {
      await api.deleteUser(selectedUser.username);
      await loadUsers();
      setDeleteDialogOpen(false);
      setSuccess(`User "${selectedUser.username}" deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportUsers();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sh-underground-users-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Users exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setImportData(data);
        setImportDialogOpen(true);
        setError('');
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleImportConfirm = async () => {
    try {
      const result = await api.importUsers(importData, importMode);
      await loadUsers();
      setImportDialogOpen(false);
      setImportData(null);
      setSuccess(`Import successful: ${result.count} users total`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5">
          Admin Dashboard
        </Typography>
        <Chip
          label={`${users.length} user${users.length !== 1 ? 's' : ''}`}
          color="primary"
          size="small"
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          size="small"
        >
          Export
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleImportClick}
          size="small"
        >
          Import
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json"
          style={{ display: 'none' }}
        />
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
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

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Users</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Found {importData ? Object.keys(importData).length : 0} users in the file.
          </Typography>
          <FormControl component="fieldset">
            <FormLabel component="legend">Import Mode</FormLabel>
            <RadioGroup
              value={importMode}
              onChange={(e) => setImportMode(e.target.value)}
            >
              <FormControlLabel
                value="merge"
                control={<Radio />}
                label="Merge - Add new users, update existing (keeps users not in file)"
              />
              <FormControlLabel
                value="replace"
                control={<Radio />}
                label="Replace - Delete all existing users and replace with file data"
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleImportConfirm} variant="contained">
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Tokens Section */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Invite Tokens
      </Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Used By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invites.map((invite) => {
                const status = getInviteStatus(invite);
                return (
                  <TableRow key={invite.token}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {invite.token.substring(0, 16)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{invite.created_by}</TableCell>
                    <TableCell>{new Date(invite.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell>{invite.used_by || '-'}</TableCell>
                    <TableCell align="right">
                      {!invite.used_by && !invite.revoked && (
                        <IconButton
                          color="error"
                          onClick={() => handleRevokeClick(invite)}
                          size="small"
                          title="Revoke"
                        >
                          <BlockIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {invites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No invite tokens found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle>Revoke Invite Token</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke this invite token? It will no longer be usable for registration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRevokeConfirm} color="error" variant="contained">
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;
