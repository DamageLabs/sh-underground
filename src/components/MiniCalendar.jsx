import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { api } from '../api';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function MiniCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [eventDays, setEventDays] = useState(new Set());

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    api.getEvents(monthStr).then((events) => {
      const days = new Set(events.map((e) => parseInt(e.event_date.split('-')[2], 10)));
      setEventDays(days);
    }).catch(() => {});
  }, [monthStr]);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  const handleClick = (d) => {
    if (!d) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    navigate(`/app/calendar?date=${dateStr}`);
  };

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  return (
    <Box sx={{ px: 1.5, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <IconButton size="small" onClick={prevMonth}><ChevronLeftIcon fontSize="small" /></IconButton>
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
          {monthName} {year}
        </Typography>
        <IconButton size="small" onClick={nextMonth}><ChevronRightIcon fontSize="small" /></IconButton>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', textAlign: 'center' }}>
        {DAYS.map((d, i) => (
          <Typography key={i} variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: '20px' }}>
            {d}
          </Typography>
        ))}
        {cells.map((d, i) => (
          <Box
            key={i}
            onClick={() => handleClick(d)}
            sx={{
              width: 28,
              height: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: d ? 'pointer' : 'default',
              borderRadius: '50%',
              border: isToday(d) ? '2px solid' : '2px solid transparent',
              borderColor: isToday(d) ? 'primary.main' : 'transparent',
              position: 'relative',
              '&:hover': d ? { bgcolor: 'action.hover' } : {},
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
              {d || ''}
            </Typography>
            {d && eventDays.has(d) && (
              <Box sx={{
                width: 4, height: 4, borderRadius: '50%',
                bgcolor: 'primary.main', position: 'absolute', bottom: 1,
              }} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default MiniCalendar;
