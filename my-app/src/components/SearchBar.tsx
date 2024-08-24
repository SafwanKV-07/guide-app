import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter keywords or acronyms..."
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      />
      <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>
        Search
      </Button>
    </Box>
  );
};