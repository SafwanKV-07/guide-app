import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { SearchBar } from './components/SearchBar';
import { ResultsTable } from './components/ResultsTable';
import { UpdatesDisplay } from './components/UpdatesDisplay';
import { searchData, fetchUpdates, reloadData } from './api';
import { SearchResult, Update } from './types';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Container, Typography, Box, Button, Alert, Link, CircularProgress } from '@mui/material';

const ACRONYMS: { [key: string]: string } = {
  "NNDR": "National Non-Domestic Rates",
  "VOA": "Valuation Office Agency",
  "POA": "Power of Attorney",
  // Add more acronyms as needed
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState('');
  const [exact, setExact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acronymFullForm, setAcronymFullForm] = useState('');
  const [updates, setUpdates] = useState<Update[]>([]);
  const [reloadingData, setReloadingData] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // New state for pagination, sorting, and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof SearchResult>('score');
  const [filter, setFilter] = useState('');

  const fetchUpdatesData = async () => {
    try {
      const updatesData = await fetchUpdates();
      setUpdates(updatesData);
    } catch (error) {
      console.error('Error fetching updates:', error);
      setError('Failed to fetch updates. Please try again later.');
    }
  };

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    newSocket.on('excel_updated', (data) => {
      console.log('Excel file updated:', data.message);
      fetchUpdatesData();
    });

    newSocket.on('data_reloaded', (data) => {
      console.log('Data reloaded:', data.message);
      fetchUpdatesData();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchUpdatesData();
    const interval = setInterval(fetchUpdatesData, 30000); // Fetch every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const upperInput = query.toUpperCase();
    if (ACRONYMS[upperInput]) {
      setAcronymFullForm(`${upperInput}: ${ACRONYMS[upperInput]}`);
    } else {
      setAcronymFullForm('');
    }
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    setError('');
    setResults([]);
    setMessage('');
    setQuery(searchQuery);
    setPage(0); // Reset to first page on new search

    try {
      const data = await searchData(searchQuery);
      setResults(data.matches);
      setMessage(data.message);
      setExact(data.exact);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReloadData = async () => {
    setReloadingData(true);
    try {
      await reloadData();
      setMessage('Data reloaded successfully');
    } catch (error) {
      console.error('Error reloading data:', error);
      setError('Failed to reload data. Please try again.');
    } finally {
      setReloadingData(false);
    }
  };

  // New handlers for pagination, sorting, and filtering
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: keyof SearchResult) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Council Data Search
          </Typography>
          <UpdatesDisplay updates={updates} />
          <Box sx={{ my: 3 }}>
            <SearchBar onSearch={handleSearch} />
          </Box>
          <Button
            variant="outlined"
            onClick={handleReloadData}
            disabled={reloadingData}
            sx={{ mb: 2 }}
          >
            {reloadingData ? 'Reloading...' : 'Reload Data'}
          </Button>
          {acronymFullForm && (
            <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
              {acronymFullForm}
            </Typography>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
          {correctedQuery && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Showing results for: <strong>{correctedQuery}</strong>
              </Typography>
              <Typography variant="body2">
                Search instead for: <Link href="#" onClick={() => handleSearch(query)}>{query}</Link>
              </Typography>
            </Box>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            results.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Search Results
                </Typography>
                <ResultsTable 
                  results={results} 
                  query={query}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  order={order}
                  orderBy={orderBy}
                  filter={filter}
                  onChangePage={handleChangePage}
                  onChangeRowsPerPage={handleChangeRowsPerPage}
                  onRequestSort={handleRequestSort}
                  onFilterChange={handleFilterChange}
                />
              </Box>
            )
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;