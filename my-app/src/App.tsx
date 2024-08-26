import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { SearchBar } from './components/SearchBar';
import { ResultsTable } from './components/ResultsTable';
import { UpdatesDisplay } from './components/UpdatesDisplay';
import { AcronymSuggestionForm } from './components/AcronymSuggestionForm';
import { searchData, fetchUpdates, reloadData, suggestAcronym } from './api';
import { SearchResult, Update, AcronymMatch } from './types';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, Button, Alert, Link, CircularProgress, Grid, Paper, AppBar, Toolbar, Typography, Dialog } from '@mui/material';

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
  const [updates, setUpdates] = useState<Update[]>([]);
  const [reloadingData, setReloadingData] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [acronymMatches, setAcronymMatches] = useState<AcronymMatch[]>([]);
  const [showAcronymSuggestionForm, setShowAcronymSuggestionForm] = useState(false);

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
    const interval = setInterval(fetchUpdatesData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    setError('');
    setResults([]);
    setMessage('');
    setQuery(searchQuery);
    setPage(0);
    setAcronymMatches([]);
  
    try {
      const data = await searchData(searchQuery);
      console.log('Search response:', data);  // Log the entire response
      setResults(data.matches);
      setMessage(data.message);
      setExact(data.exact);
      if (data.acronym_matches) {
        console.log('Acronym matches:', data.acronym_matches);
        setAcronymMatches(data.acronym_matches);
      } else {
        console.log('No acronym matches in response');
      }
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

  const handleAcronymSuggestion = async (acronym: string, expansion: string, context: string) => {
    try {
      console.log('Suggesting acronym:', { acronym, expansion, context });
      await suggestAcronym(acronym, expansion, context);
      console.log('Acronym suggestion successful');
      setShowAcronymSuggestionForm(false);
      setMessage('Acronym suggestion submitted successfully');
    } catch (error) {
      console.error('Error suggesting acronym:', error);
      setError('Failed to suggest acronym. Please try again.');
    }
  };
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
    setPage(0);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Council Data Search
            </Typography>
            <Button color="inherit" onClick={() => setShowAcronymSuggestionForm(true)}>
              Suggest Acronym
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
              <Paper elevation={3} sx={{ height: '100%' }}>
                <UpdatesDisplay updates={updates} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={8} lg={9}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box flexGrow={1} mr={2}>
                    <SearchBar onSearch={handleSearch} />
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={handleReloadData}
                    disabled={reloadingData}
                    size="small"
                    sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                  >
                    {reloadingData ? 'Reloading...' : 'Reload Data'}
                  </Button>
                </Box>
                {acronymMatches.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Acronym Matches:</Typography>
                    {acronymMatches.map((match, index) => (
                      <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                        <strong>{match.acronym}:</strong> {match.expansion}
                        {match.context && <span> ({match.context})</span>}
                      </Typography>
                    ))}
                  </Box>
                )}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {message && <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert>}
                {correctedQuery && (
                  <Box sx={{ mt: 2 }}>
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
                    <Box sx={{ mt: 2 }}>
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
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Dialog open={showAcronymSuggestionForm} onClose={() => setShowAcronymSuggestionForm(false)}>
        <AcronymSuggestionForm onSubmit={handleAcronymSuggestion} onCancel={() => setShowAcronymSuggestionForm(false)} />
      </Dialog>
    </ThemeProvider>
  );
}

export default App;