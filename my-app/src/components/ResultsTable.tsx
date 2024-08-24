import React from 'react';
import { SearchResult } from '../types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box,
  Chip,
  TablePagination,
  TableSortLabel,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface ResultsTableProps {
  results: SearchResult[];
  query: string;
  page: number;
  rowsPerPage: number;
  order: 'asc' | 'desc';
  orderBy: keyof SearchResult;
  filter: string;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRequestSort: (property: keyof SearchResult) => void;
  onFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${theme.breakpoints.down('sm')}`]: {
    padding: theme.spacing(1),
  },
}));

const HighlightedText = styled('span')(({ theme }) => ({
  backgroundColor: 'yellow',
  padding: '1px 0px',
  borderRadius: '2px',
}));

export const ResultsTable: React.FC<ResultsTableProps> = ({ 
  results, 
  query, 
  page, 
  rowsPerPage, 
  order, 
  orderBy, 
  filter,
  onChangePage,
  onChangeRowsPerPage,
  onRequestSort,
  onFilterChange
}) => {
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.split(regex).map((part, index) => 
      regex.test(part) ? (
        <HighlightedText key={index}>{part}</HighlightedText>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      )
    );
  };

  const filteredResults = results.filter(result => 
    Object.values(result).some(value => 
      String(value).toLowerCase().includes(filter.toLowerCase())
    )
  );

  const sortedResults = filteredResults.sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedResults = sortedResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Filter results..."
        value={filter}
        onChange={onFilterChange}
        sx={{ mb: 2 }}
      />
      <TableContainer component={Paper} sx={{ maxHeight: 440, boxShadow: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {['main_folder', 'sub_folder', 'document_type', 'document_type_identification_rules', 'supporting_information', 'match_type', 'score'].map((column) => (
                <StyledTableCell key={column}>
                  <TableSortLabel
                    active={orderBy === column}
                    direction={orderBy === column ? order : 'asc'}
                    onClick={() => onRequestSort(column as keyof SearchResult)}
                  >
                    {column.replace(/_/g, ' ').toUpperCase()}
                  </TableSortLabel>
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedResults.map((result, index) => (
              <TableRow key={index} hover>
                <StyledTableCell>{highlightText(result.main_folder, query)}</StyledTableCell>
                <StyledTableCell>{highlightText(result.sub_folder, query)}</StyledTableCell>
                <StyledTableCell>{highlightText(result.document_type, query)}</StyledTableCell>
                <StyledTableCell>{highlightText(result.document_type_identification_rules, query)}</StyledTableCell>
                <StyledTableCell>{highlightText(result.supporting_information, query)}</StyledTableCell>
                <StyledTableCell align="center">
                  <Chip 
                    label={result.match_type} 
                    color={result.match_type === 'Exact Match' ? 'primary' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </StyledTableCell>
                <StyledTableCell align="center">
                  <Typography variant="body2" fontWeight="medium">
                    {result.score.toFixed(2)}
                  </Typography>
                </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredResults.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onChangePage}
        onRowsPerPageChange={onChangeRowsPerPage}
      />
    </Box>
  );
};