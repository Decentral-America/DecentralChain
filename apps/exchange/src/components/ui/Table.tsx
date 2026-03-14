/**
 * Table Component
 * Data table with sorting, clickable rows, and custom rendering
 * Migrated to Material-UI
 */
import React from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Components
const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => !['sortable'].includes(prop as string),
})<{ sortable?: boolean }>(({ theme, sortable }) => ({
  fontWeight: 600,
  cursor: sortable ? 'pointer' : 'default',
  userSelect: 'none',
  '&:hover': {
    backgroundColor: sortable ? theme.palette.action.hover : 'inherit',
  },
}));

const StyledTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => !['clickable'].includes(prop as string),
})<{ clickable?: boolean }>(({ theme, clickable }) => ({
  cursor: clickable ? 'pointer' : 'default',
  transition: theme.transitions.create('background-color'),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

const SortIcon = styled('span')<{ direction?: 'asc' | 'desc' }>(({ theme, direction }) => ({
  marginLeft: theme.spacing(1),
  fontSize: '0.75rem',
  color: theme.palette.primary.main,
}));

// Interfaces
export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  keyExtractor,
  emptyMessage = 'No data available',
  className,
  style,
}: TableProps<T>) => {
  return (
    <TableContainer component={Paper} className={className} style={style}>
      <MuiTable>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <StyledTableCell
                key={col.key}
                sortable={col.sortable}
                onClick={() => col.sortable && onSort?.(col.key)}
                style={{ width: col.width }}
              >
                {col.label}
                {col.sortable && (
                  <SortIcon direction={sortKey === col.key ? sortDirection : undefined}>
                    {sortKey === col.key ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                  </SortIcon>
                )}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => {
              const key = keyExtractor ? keyExtractor(row, index) : index;
              return (
                <StyledTableRow
                  key={key}
                  clickable={!!onRowClick}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                </StyledTableRow>
              );
            })
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};

export default Table;
