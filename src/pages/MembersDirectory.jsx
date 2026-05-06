import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, InputAdornment, Avatar, Tooltip, IconButton,
  Card, CardContent, CardActionArea, Stack, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel,
  CircularProgress, Alert, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import { api } from '../api';
import MarkerColorDot from '../components/MarkerColorDot';

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

const SORT_KEYS = {
  name: (u) => (u.displayName || u.fullName || u.username || '').toLowerCase(),
  location: (u) => (u.location || '').toLowerCase(),
  joined: (u) => (typeof u.createdAt === 'number' ? u.createdAt : null),
};

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('http')) return photoPath;
  return `/api${photoPath}`;
};

const formatJoined = (ts) => {
  if (typeof ts !== 'number') return '—';
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const displayName = (u) => u.displayName || u.fullName || u.username;

function compareValues(a, b, dir) {
  const aNull = a === null || a === undefined || a === '';
  const bNull = b === null || b === undefined || b === '';
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  let cmp;
  if (typeof a === 'number' && typeof b === 'number') cmp = a - b;
  else cmp = collator.compare(String(a), String(b));
  return dir === 'desc' ? -cmp : cmp;
}

function MembersDirectory() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    let cancelled = false;
    api.getAllUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load members'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredSorted = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const filtered = q
      ? users.filter((u) => {
          const name = (u.displayName || u.fullName || '').toLowerCase();
          return (
            (u.username || '').toLowerCase().includes(q) ||
            name.includes(q) ||
            (u.location || '').toLowerCase().includes(q)
          );
        })
      : users;
    const getKey = SORT_KEYS[sortKey];
    return [...filtered].sort((a, b) => compareValues(getKey(a), getKey(b), sortDir));
  }, [users, debouncedQuery, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'joined' ? 'desc' : 'asc');
    }
  };

  const handleHighlightOnMap = (u) => {
    if (!u.coordinates) return;
    navigate(`/app/map?focus=${encodeURIComponent(u.username)}`);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Members
      </Typography>

      <TextField
        fullWidth
        placeholder="Search by name, email, or location"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && filteredSorted.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {users.length === 0 ? 'No members found.' : 'No members match your search.'}
          </Typography>
        </Paper>
      )}

      {!loading && !error && filteredSorted.length > 0 && (
        isMobile ? (
          <Stack spacing={1.5}>
            {filteredSorted.map((u) => (
              <Card key={u.username}>
                <CardActionArea
                  disabled={!u.coordinates}
                  onClick={() => handleHighlightOnMap(u)}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={getPhotoUrl(u.profilePhoto)} alt={displayName(u)}>
                        {displayName(u)?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                            {displayName(u)}
                          </Typography>
                          <MarkerColorDot color={u.markerColor || 'red'} size={14} />
                        </Stack>
                        {u.fullName && u.displayName && u.fullName !== u.displayName && (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {u.fullName}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {u.location || '— no location set —'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Joined {formatJoined(u.createdAt)}
                        </Typography>
                      </Box>
                      {u.coordinates ? (
                        <MapIcon color="action" />
                      ) : (
                        <Tooltip title="No location set">
                          <LocationOffIcon color="disabled" />
                        </Tooltip>
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        ) : (
          <Paper sx={{ overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell sortDirection={sortKey === 'name' ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === 'name'}
                      direction={sortKey === 'name' ? sortDir : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortKey === 'location' ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === 'location'}
                      direction={sortKey === 'location' ? sortDir : 'asc'}
                      onClick={() => handleSort('location')}
                    >
                      Location
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortKey === 'joined' ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === 'joined'}
                      direction={sortKey === 'joined' ? sortDir : 'desc'}
                      onClick={() => handleSort('joined')}
                    >
                      Joined
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Map</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSorted.map((u) => (
                  <TableRow
                    key={u.username}
                    hover={!!u.coordinates}
                    sx={{ cursor: u.coordinates ? 'pointer' : 'default' }}
                    onClick={() => handleHighlightOnMap(u)}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={getPhotoUrl(u.profilePhoto)} alt={displayName(u)} sx={{ width: 36, height: 36 }}>
                          {displayName(u)?.[0]?.toUpperCase()}
                        </Avatar>
                        <MarkerColorDot color={u.markerColor || 'red'} size={16} />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {displayName(u)}
                      </Typography>
                      {u.fullName && u.displayName && u.fullName !== u.displayName && (
                        <Typography variant="caption" color="text.secondary">
                          {u.fullName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.location || (
                        <Typography component="span" variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatJoined(u.createdAt)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      {u.coordinates ? (
                        <Tooltip title="Highlight on map">
                          <IconButton size="small" onClick={() => handleHighlightOnMap(u)}>
                            <MapIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="No location set">
                          <span>
                            <IconButton size="small" disabled>
                              <LocationOffIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )
      )}
    </Box>
  );
}

export default MembersDirectory;
