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
  Box,
  Chip,
  IconButton,
  Tooltip,
  Popover,
  Button,
  Badge
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { styled } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
  height: '100%',
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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const updatesPerPage = 5;

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(0);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'filter-popover' : undefined;

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

  const activeFiltersCount = [categoryFilter, startDate, endDate].filter(Boolean).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <StyledPaper>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" color="primary">Latest Updates</Typography>
          <Badge badgeContent={activeFiltersCount} color="primary">
            <Button
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              size="small"
              variant="outlined"
            >
              Filter
            </Button>
          </Badge>
        </Box>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, width: 250 }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { mb: 2 } } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate || undefined}
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { mb: 2 } } }}
            />
            <Button onClick={handleClearFilters} fullWidth variant="outlined">
              Clear Filters
            </Button>
          </Box>
        </Popover>
        <ScrollableBox>
          {displayedUpdates.map((update, index) => (
            <AnimatedUpdate key={index} update={update} />
          ))}
        </ScrollableBox>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
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
        <Box display="flex" flexDirection="column">
          <Typography variant="subtitle2" component="div">
            {update.main_folder}
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="space-between" my={0.5}>
            <Box>
              <StyledChip label={update.category} color="primary" variant="outlined" size="small" />
              {update.new && <StyledChip label="New" color="secondary" size="small" sx={{ ml: 0.5 }} />}
            </Box>
            <Typography variant="caption" color="textSecondary">
              {new Date(update.date).toLocaleDateString()}
            </Typography>
          </Box>
          <Tooltip title={update.description} placement="bottom-start">
            <Typography 
              variant="body2" 
              color="textSecondary" 
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {update.description}
            </Typography>
          </Tooltip>
        </Box>
      </UpdateItem>
    </animated.div>
  );
};