import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, MenuItem, Stack, Tooltip, Typography, Alert, Button,
} from '@mui/material';
import { api } from '../../api';

const AUDIT_EVENT_TYPES = [
  'auth.login.success',
  'auth.login.failure',
  'auth.register.success',
  'auth.register.failure',
  'auth.username.migrated',
  'auth.password.changed',
  'auth.password.change_failed',
  'auth.password.reset_via_token',
  'auth.password.reset_token_invalid',
  'user.profile.updated',
  'user.photo.uploaded',
  'user.photo.deleted',
  'admin.user.deleted',
  'admin.user.role_changed',
  'admin.password.reset_link_generated',
  'admin.users.imported',
  'admin.events.imported',
  'invite.created',
  'invite.revoked',
  'event.created',
  'event.updated',
  'event.deleted',
];

const EMPTY_FILTERS = { actor: '', target: '', eventType: '', dateFrom: '', dateTo: '' };

function AuditLogTab() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        ...(filters.actor && { actor: filters.actor }),
        ...(filters.target && { target: filters.target }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.dateFrom && { dateFrom: new Date(filters.dateFrom).getTime() }),
        ...(filters.dateTo && { dateTo: new Date(filters.dateTo).getTime() }),
      };
      const data = await api.getAuditEvents(params);
      setEvents(data.events);
      setTotal(data.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 2 }}
        alignItems={{ md: 'center' }}
        flexWrap="wrap"
      >
        <TextField
          label="Actor"
          size="small"
          value={filters.actor}
          onChange={handleFilterChange('actor')}
          placeholder="username substring"
        />
        <TextField
          label="Target"
          size="small"
          value={filters.target}
          onChange={handleFilterChange('target')}
          placeholder="username / id substring"
        />
        <TextField
          select
          label="Event Type"
          size="small"
          value={filters.eventType}
          onChange={handleFilterChange('eventType')}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">All</MenuItem>
          {AUDIT_EVENT_TYPES.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="From"
          type="datetime-local"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.dateFrom}
          onChange={handleFilterChange('dateFrom')}
        />
        <TextField
          label="To"
          type="datetime-local"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.dateTo}
          onChange={handleFilterChange('dateTo')}
        />
        {hasFilters && (
          <Button size="small" onClick={handleClearFilters}>Clear filters</Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Timestamp</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Details</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((ev) => (
                <TableRow key={ev.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {new Date(ev.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {ev.eventType}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{ev.actor || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{ev.target || '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={ev.userAgent || ''} placement="top">
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.72rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          color: 'text.secondary',
                        }}
                      >
                        {ev.details ? JSON.stringify(ev.details) : '—'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {ev.ip || '—'}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                    {hasFilters ? 'No events match these filters.' : 'No audit events recorded yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100, 200]}
        />
      </Paper>
    </Box>
  );
}

export default AuditLogTab;
