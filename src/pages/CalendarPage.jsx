import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, RadioGroup, FormControlLabel,
  Radio, FormControl, FormLabel,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyForm = {
  title: '', event_date: '', event_time: '', description: '', location: '', visibility: 'community',
};

function CalendarPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();

  const initDate = searchParams.get('date');
  const initParsed = initDate ? new Date(initDate + 'T00:00:00') : today;

  const [year, setYear] = useState(initParsed.getFullYear());
  const [month, setMonth] = useState(initParsed.getMonth());
  const [selectedDay, setSelectedDay] = useState(initDate ? initParsed.getDate() : today.getDate());
  const [events, setEvents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const fetchEvents = useCallback(() => {
    api.getEvents(monthStr).then(setEvents).catch(() => setEvents([]));
  }, [monthStr]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Sync URL date param when navigating months
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const p = new Date(dateParam + 'T00:00:00');
      if (p.getFullYear() !== year || p.getMonth() !== month) {
        setSearchParams({}, { replace: true });
      }
    }
  }, [year, month, searchParams, setSearchParams]);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1);
    setSelectedDay(1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  const eventsForDay = (d) => {
    if (!d) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return events.filter((e) => e.event_date === dateStr);
  };

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const selectedEvents = events.filter((e) => e.event_date === selectedDateStr);
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  const openCreate = () => {
    setEditingEvent(null);
    setForm({ ...emptyForm, event_date: selectedDateStr });
    setDialogOpen(true);
  };
  const openEdit = (evt) => {
    setEditingEvent(evt);
    setForm({
      title: evt.title,
      event_date: evt.event_date,
      event_time: evt.event_time || '',
      description: evt.description || '',
      location: evt.location || '',
      visibility: evt.visibility,
    });
    setDialogOpen(true);
  };
  const openDelete = (evt) => {
    setEditingEvent(evt);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.event_date) return;
    try {
      if (editingEvent) {
        await api.updateEvent(editingEvent.id, form);
      } else {
        await api.createEvent(form);
      }
      setDialogOpen(false);
      fetchEvents();
    } catch (err) {
      alert(err.message);
    }
  };
  const handleDelete = async () => {
    try {
      await api.deleteEvent(editingEvent.id);
      setDeleteDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatTime = (t) => {
    if (!t) return 'All day';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <Box>
      {/* Month header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton onClick={prevMonth}><ChevronLeftIcon /></IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold', minWidth: 200, textAlign: 'center' }}>
          {monthName} {year}
        </Typography>
        <IconButton onClick={nextMonth}><ChevronRightIcon /></IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Event
        </Button>
      </Box>

      {/* Calendar grid */}
      <Box sx={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid',
        borderColor: 'divider', borderRadius: 1, overflow: 'hidden',
      }}>
        {/* Day headers */}
        {DAYS.map((d) => (
          <Box key={d} sx={{ p: 1, textAlign: 'center', bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{d}</Typography>
          </Box>
        ))}
        {/* Day cells */}
        {cells.map((d, i) => {
          const dayEvents = eventsForDay(d);
          const maxShow = 2;
          return (
            <Box
              key={i}
              onClick={() => d && setSelectedDay(d)}
              sx={{
                minHeight: 100, p: 0.5, borderBottom: '1px solid', borderRight: '1px solid',
                borderColor: 'divider', cursor: d ? 'pointer' : 'default',
                bgcolor: d === selectedDay ? 'rgba(212,175,55,0.08)' : 'transparent',
                borderLeft: isToday(d) ? '3px solid' : 'none',
                borderLeftColor: isToday(d) ? 'primary.main' : 'transparent',
                '&:hover': d ? { bgcolor: 'rgba(212,175,55,0.04)' } : {},
              }}
            >
              {d && (
                <>
                  <Typography variant="caption" sx={{
                    fontWeight: isToday(d) ? 'bold' : 'normal',
                    color: isToday(d) ? 'primary.main' : 'text.primary',
                  }}>
                    {d}
                  </Typography>
                  <Box sx={{ mt: 0.25 }}>
                    {dayEvents.slice(0, maxShow).map((evt) => (
                      <Chip
                        key={evt.id}
                        label={evt.title}
                        size="small"
                        sx={{
                          height: 18, fontSize: '0.65rem', mb: 0.25, maxWidth: '100%',
                          bgcolor: evt.visibility === 'community' ? 'rgba(212,175,55,0.2)' : 'action.selected',
                          color: evt.visibility === 'community' ? 'primary.main' : 'text.secondary',
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />
                    ))}
                    {dayEvents.length > maxShow && (
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        +{dayEvents.length - maxShow} more
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Selected day detail */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {new Date(year, month, selectedDay).toLocaleDateString('default', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })}
        </Typography>
        {selectedEvents.length === 0 ? (
          <Typography color="text.secondary">No events for this day.</Typography>
        ) : (
          selectedEvents.map((evt) => (
            <Box key={evt.id} sx={{
              p: 2, mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1,
              borderLeft: '3px solid',
              borderLeftColor: evt.visibility === 'community' ? 'primary.main' : 'text.disabled',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                  {evt.title}
                </Typography>
                <Chip
                  label={evt.visibility}
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.7rem',
                    bgcolor: evt.visibility === 'community' ? 'rgba(212,175,55,0.15)' : 'action.selected',
                    color: evt.visibility === 'community' ? 'primary.main' : 'text.secondary',
                  }}
                />
                {evt.created_by === user?.username && (
                  <>
                    <IconButton size="small" onClick={() => openEdit(evt)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => openDelete(evt)}><DeleteIcon fontSize="small" /></IconButton>
                  </>
                )}
                {isAdmin && evt.created_by !== user?.username && (
                  <IconButton size="small" onClick={() => openDelete(evt)}><DeleteIcon fontSize="small" /></IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.85rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{formatTime(evt.event_time)}</Typography>
                </Box>
                {evt.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">{evt.location}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{evt.created_by}</Typography>
                </Box>
              </Box>
              {evt.description && (
                <Typography variant="body2" component="div" sx={{ mt: 1, color: 'text.secondary', whiteSpace: 'pre-line' }}>
                  {evt.description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                    /^https?:\/\//.test(part) ? (
                      <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37' }}>
                        {part}
                      </a>
                    ) : part
                  )}
                </Typography>
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Title" required fullWidth value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Date" type="date" required fullWidth value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Time (optional)" type="time" fullWidth value={form.event_time}
            onChange={(e) => setForm({ ...form, event_time: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Location" fullWidth value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <TextField
            label="Description" fullWidth multiline rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <FormControl>
            <FormLabel>Visibility</FormLabel>
            <RadioGroup
              row value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            >
              <FormControlLabel value="community" control={<Radio />} label="Community" />
              <FormControlLabel value="personal" control={<Radio />} label="Personal" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.title || !form.event_date}>
            {editingEvent ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{editingEvent?.title}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CalendarPage;
