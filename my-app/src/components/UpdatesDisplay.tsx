import React, { useState, useEffect } from 'react';
import { Update } from '../types';
import { useSpring, animated } from 'react-spring';
import { 
  Typography, 
  Paper, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Grid,
  Box,
  Chip,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { styled } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  height: '400px', // Fixed height
  display: 'flex',
  flexDirection: 'column',
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  marginRight: theme.spacing(1),
  height: '24px',
}));

const UpdateItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderLeft: `3px solid ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ScrollableBox = styled(Box)({
  overflowY: 'auto',
  flex: 1,
});

interface UpdatesDisplayProps {
  updates: Update[];
}

export const UpdatesDisplay: React.FC<UpdatesDisplayProps> = ({ updates }) => {
  const [displayedUpdates, setDisplayedUpdates] = useState<Update[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const updatesPerPage = 3;

  useEffect(() => {
    const filtered = updates.filter((update) => {
      const matchesCategory = categoryFilter ? update.category === categoryFilter : true;
      const updateDate = new Date(update.date);
      const afterStartDate = startDate ? updateDate >= startDate : true;
      const beforeEndDate = endDate ? updateDate <= endDate : true;
      return matchesCategory && afterStartDate && beforeEndDate;
    });

    const startIndex = currentPage * updatesPerPage;
    setDisplayedUpdates(filtered.slice(startIndex, startIndex + updatesPerPage));
  }, [updates, currentPage, categoryFilter, startDate, endDate]);

  const handlePrevious = () => setCurrentPage(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentPage(prev => Math.min(Math.floor((updates.length - 1) / updatesPerPage), prev + 1));

  const categories = Array.from(new Set(updates.map(update => update.category)));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <StyledPaper elevation={2}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>Latest Updates</Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as string)}
                label="Category"
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((category, index) => (
                  <MenuItem key={index} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={4}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate || undefined}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
        </Grid>
        <ScrollableBox>
          {displayedUpdates.map((update, index) => (
            <AnimatedUpdate key={index} update={update} />
          ))}
        </ScrollableBox>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <IconButton onClick={handlePrevious} disabled={currentPage === 0} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="body2" color="textSecondary">
            Page {currentPage + 1} of {Math.ceil(updates.length / updatesPerPage)}
          </Typography>
          <IconButton onClick={handleNext} disabled={(currentPage + 1) * updatesPerPage >= updates.length} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </StyledPaper>
    </LocalizationProvider>
  );
};

const AnimatedUpdate: React.FC<{ update: Update }> = ({ update }) => {
  const props = useSpring({
    opacity: 1,
    transform: 'translateY(0)',
    from: { opacity: 0, transform: 'translateY(20px)' },
  });

  return (
    <animated.div style={props}>
      <UpdateItem>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12}>
            <Typography variant="subtitle2" component="div" noWrap>
              {update.main_folder}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <StyledChip label={update.category} color="primary" variant="outlined" size="small" />
                {update.new && <StyledChip label="New" color="secondary" size="small" />}
              </Box>
              <Typography variant="caption" color="textSecondary">
                {new Date(update.date).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary" noWrap>
              {update.description}
            </Typography>
          </Grid>
        </Grid>
      </UpdateItem>
    </animated.div>
  );
};