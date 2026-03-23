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
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RepeatIcon from '@mui/icons-material/Repeat';
import PersonIcon from '@mui/icons-material/Person';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'FREQ=WEEKLY', label: 'Weekly' },
  { value: 'FREQ=BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'FREQ=MONTHLY', label: 'Monthly (same date)' },
  { value: 'FREQ=MONTHLY;BYDAY=', label: 'Monthly (same weekday)' },
  { value: 'FREQ=YEARLY', label: 'Yearly' },
  { value: 'custom', label: 'Custom RRULE' },
];

const WEEKDAY_ABBRS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function buildRecurrence(option, eventDate, untilDate, customRule) {
  if (!option || option === '') return '';
  if (option === 'custom') return customRule || '';
  if (option === 'FREQ=BIWEEKLY') {
    let rule = 'FREQ=WEEKLY;INTERVAL=2';
    if (untilDate) rule += `;UNTIL=${untilDate.replace(/-/g, '')}T235959Z`;
    return rule;
  }
  let rule = option;
  if (option === 'FREQ=MONTHLY;BYDAY=' && eventDate) {
    const d = new Date(eventDate + 'T00:00:00');
    const weekday = WEEKDAY_ABBRS[d.getDay()];
    const weekNum = Math.ceil(d.getDate() / 7);
    rule = `FREQ=MONTHLY;BYDAY=${weekNum}${weekday}`;
  }
  if (untilDate) rule += `;UNTIL=${untilDate.replace(/-/g, '')}T235959Z`;
  return rule;
}

function describeRecurrence(rrule) {
  if (!rrule) return '';
  const parts = {};
  rrule.split(';').forEach(p => { const [k, v] = p.split('='); parts[k] = v; });
  let desc = '';
  if (parts.FREQ === 'WEEKLY' && parts.INTERVAL === '2') desc = 'Every 2 weeks';
  else if (parts.FREQ === 'WEEKLY') desc = 'Weekly';
  else if (parts.FREQ === 'MONTHLY' && parts.BYDAY) desc = `Monthly (${parts.BYDAY})`;
  else if (parts.FREQ === 'MONTHLY') desc = 'Monthly';
  else if (parts.FREQ === 'YEARLY') desc = 'Yearly';
  else desc = rrule;
  if (parts.UNTIL) {
    const u = parts.UNTIL;
    desc += ` until ${u.slice(0,4)}-${u.slice(4,6)}-${u.slice(6,8)}`;
  }
  if (parts.COUNT) desc += `, ${parts.COUNT} times`;
  return desc;
}

function parseRecurrenceOption(rrule) {
  if (!rrule) return '';
  if (/^FREQ=WEEKLY;INTERVAL=2/.test(rrule)) return 'FREQ=BIWEEKLY';
  if (/^FREQ=WEEKLY/.test(rrule)) return 'FREQ=WEEKLY';
  if (/^FREQ=MONTHLY;BYDAY=/.test(rrule)) return 'FREQ=MONTHLY;BYDAY=';
  if (/^FREQ=MONTHLY/.test(rrule)) return 'FREQ=MONTHLY';
  if (/^FREQ=YEARLY/.test(rrule)) return 'FREQ=YEARLY';
  return 'custom';
}

function parseUntilDate(rrule) {
  if (!rrule) return '';
  const match = rrule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

const emptyForm = {
  title: '', event_date: '', end_date: '', event_time: '', description: '', location: '', visibility: 'community',
  recurrenceOption: '', recurrenceUntil: '', recurrenceCustom: '',
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
    return events.filter((e) => {
      if (e.end_date) {
        return dateStr >= e.event_date && dateStr <= e.end_date;
      }
      return e.event_date === dateStr;
    });
  };

  // Get multi-day events that span across a week row
  const getMultiDayEventsForWeek = (weekCells) => {
    const multiDayEvents = [];
    const processedEvents = new Set();

    weekCells.forEach((day, dayIndex) => {
      if (!day) return;

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter((e) => {
        if (!e.end_date) return false; // Only multi-day events
        return dateStr >= e.event_date && dateStr <= e.end_date;
      });

      dayEvents.forEach((evt) => {
        if (processedEvents.has(evt.id)) return;
        processedEvents.add(evt.id);

        // Calculate start and end columns within this week
        const eventStartDate = new Date(evt.event_date + 'T00:00:00');
        const eventEndDate = new Date(evt.end_date + 'T00:00:00');
        const weekStartDay = weekCells[0];
        
        if (!weekStartDay) return;

        const weekStartDate = new Date(year, month, weekStartDay);
        const weekEndDate = new Date(year, month, weekStartDay + 6);

        // Clamp event dates to this week
        const clampedStart = new Date(Math.max(eventStartDate.getTime(), weekStartDate.getTime()));
        const clampedEnd = new Date(Math.min(eventEndDate.getTime(), weekEndDate.getTime()));

        // Find column indices
        let startCol = -1;
        let endCol = -1;

        weekCells.forEach((weekDay, index) => {
          if (!weekDay) return;
          const cellDate = new Date(year, month, weekDay);
          
          if (cellDate.getTime() === clampedStart.getTime()) {
            startCol = index;
          }
          if (cellDate.getTime() === clampedEnd.getTime()) {
            endCol = index;
          }
        });

        if (startCol >= 0 && endCol >= 0) {
          multiDayEvents.push({
            ...evt,
            startCol,
            endCol,
            startsBeforeWeek: eventStartDate < weekStartDate,
            endsAfterWeek: eventEndDate > weekEndDate,
          });
        }
      });
    });

    return multiDayEvents;
  };

  // Get single-day events (including single-day from multi-day events)
  const getSingleDayEvents = (d) => {
    if (!d) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return events.filter((e) => {
      // Include single-day events only
      if (e.end_date) return false;
      return e.event_date === dateStr;
    });
  };

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const selectedEvents = events.filter((e) => {
    if (e.end_date) {
      return selectedDateStr >= e.event_date && selectedDateStr <= e.end_date;
    }
    return e.event_date === selectedDateStr;
  });
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
      end_date: evt.end_date || '',
      event_time: evt.event_time || '',
      description: evt.description || '',
      location: evt.location || '',
      visibility: evt.visibility,
      recurrenceOption: parseRecurrenceOption(evt.recurrence),
      recurrenceUntil: parseUntilDate(evt.recurrence),
      recurrenceCustom: parseRecurrenceOption(evt.recurrence) === 'custom' ? evt.recurrence : '',
    });
    setDialogOpen(true);
  };
  const openDelete = (evt) => {
    setEditingEvent(evt);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.event_date) return;
    const recurrence = buildRecurrence(form.recurrenceOption, form.event_date, form.recurrenceUntil, form.recurrenceCustom);
    const payload = {
      title: form.title, event_date: form.event_date, end_date: form.end_date || '',
      event_time: form.event_time,
      description: form.description, location: form.location, visibility: form.visibility,
      recurrence,
    };
    try {
      if (editingEvent) {
        await api.updateEvent(editingEvent.id, payload);
      } else {
        await api.createEvent(payload);
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

  const handleExportCalendar = async () => {
    try {
      const currentUser = localStorage.getItem('location_app_current_user');
      const headers = {};
      if (currentUser) {
        try { headers['x-username'] = JSON.parse(currentUser).username; } catch {}
      }
      const res = await fetch('/api/events/export/ics', { headers });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sh-underground-calendar.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Calendar export failed:', err);
    }
  };

  const handleDownloadIcs = async (evt) => {
    const url = api.getEventIcsUrl(evt.id);
    const currentUser = localStorage.getItem('location_app_current_user');
    const headers = {};
    if (currentUser) {
      try { headers['x-username'] = JSON.parse(currentUser).username; } catch {}
    }
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${evt.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase()}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
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
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCalendar} sx={{ mr: 1 }}>
          Export .ics
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Event
        </Button>
      </Box>

      {/* Calendar grid */}
      <Box sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden',
      }}>
        {/* Day headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAYS.map((d) => (
            <Box key={d} sx={{ p: 1, textAlign: 'center', bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{d}</Typography>
            </Box>
          ))}
        </Box>

        {/* Week rows */}
        {(() => {
          const weeks = [];
          for (let i = 0; i < cells.length; i += 7) {
            weeks.push(cells.slice(i, i + 7));
          }
          
          return weeks.map((weekCells, weekIndex) => {
            const multiDayEvents = getMultiDayEventsForWeek(weekCells);
            
            return (
              <Box
                key={weekIndex}
                sx={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                }}
              >
                {/* Day cells for this week */}
                {weekCells.map((d, dayIndex) => {
                  const singleDayEvents = getSingleDayEvents(d);
                  const maxShow = 1; // Reduced to make room for spanning bars
                  
                  return (
                    <Box
                      key={`${weekIndex}-${dayIndex}`}
                      onClick={() => d && setSelectedDay(d)}
                      sx={{
                        minHeight: 100,
                        p: 0.5,
                        pt: 2, // Extra padding top for spanning bars
                        borderBottom: '1px solid',
                        borderRight: dayIndex < 6 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        cursor: d ? 'pointer' : 'default',
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
                            {singleDayEvents.slice(0, maxShow).map((evt) => (
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
                            {singleDayEvents.length > maxShow && (
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                                +{singleDayEvents.length - maxShow} more
                              </Typography>
                            )}
                          </Box>
                        </>
                      )}
                    </Box>
                  );
                })}

                {/* Multi-day event bars */}
                {multiDayEvents.map((evt, eventIndex) => {
                  const leftPercentage = (evt.startCol / 7) * 100;
                  const widthPercentage = ((evt.endCol - evt.startCol + 1) / 7) * 100;
                  
                  return (
                    <Box
                      key={`bar-${evt.id}-${weekIndex}`}
                      onClick={() => {
                        // Find the first day of this event in this week and select it
                        const firstDay = weekCells[evt.startCol];
                        if (firstDay) setSelectedDay(firstDay);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: `${leftPercentage}%`,
                        width: `${widthPercentage}%`,
                        height: 20,
                        backgroundColor: evt.visibility === 'community' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(158, 158, 158, 0.3)',
                        border: '1px solid',
                        borderColor: evt.visibility === 'community' ? 'rgba(212, 175, 55, 0.6)' : 'rgba(158, 158, 158, 0.6)',
                        borderRadius: 1,
                        borderTopLeftRadius: evt.startsBeforeWeek ? 0 : 1,
                        borderBottomLeftRadius: evt.startsBeforeWeek ? 0 : 1,
                        borderTopRightRadius: evt.endsAfterWeek ? 0 : 1,
                        borderBottomRightRadius: evt.endsAfterWeek ? 0 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        cursor: 'pointer',
                        zIndex: 1,
                        '&:hover': {
                          backgroundColor: evt.visibility === 'community' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(158, 158, 158, 0.4)',
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          color: evt.visibility === 'community' ? 'rgba(212, 175, 55, 1)' : 'rgba(97, 97, 97, 1)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {evt.title}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            );
          });
        })()}
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
                <IconButton size="small" onClick={() => handleDownloadIcs(evt)} title="Download .ics"><DownloadIcon fontSize="small" /></IconButton>
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
                {evt.recurrence && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <RepeatIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">{describeRecurrence(evt.recurrence)}</Typography>
                  </Box>
                )}
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
            label="Start Date" type="date" required fullWidth value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date (optional, for multi-day events)" type="date" fullWidth value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: form.event_date }}
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
          <TextField
            label="Recurrence" select fullWidth value={form.recurrenceOption}
            onChange={(e) => setForm({ ...form, recurrenceOption: e.target.value })}
            SelectProps={{ native: true }}
          >
            {RECURRENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </TextField>
          {form.recurrenceOption && form.recurrenceOption !== 'custom' && (
            <TextField
              label="Repeat until (optional)" type="date" fullWidth value={form.recurrenceUntil}
              onChange={(e) => setForm({ ...form, recurrenceUntil: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          )}
          {form.recurrenceOption === 'custom' && (
            <TextField
              label="Custom RRULE" fullWidth value={form.recurrenceCustom}
              onChange={(e) => setForm({ ...form, recurrenceCustom: e.target.value })}
              placeholder="e.g. FREQ=MONTHLY;BYDAY=2TU;UNTIL=20261208T235959Z"
              helperText="Enter a valid iCalendar RRULE string"
            />
          )}
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
