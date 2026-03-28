/**
 * Table Component
 * Data table with sorting, clickable rows, and custom rendering
 * Migrated to Material-UI
 */

import {
  Table as MuiTable,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type React from 'react';

// Styled Components
const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => !['sortable'].includes(prop as string),
})<{ sortable?: boolean | undefined }>(({ theme, sortable }) => ({
  '&:hover': {
    backgroundColor: sortable ? theme.palette.action.hover : 'inherit',
  },
  cursor: sortable ? 'pointer' : 'default',
  fontWeight: 600,
  userSelect: 'none',
}));

const StyledTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => !['clickable'].includes(prop as string),
})<{ clickable?: boolean }>(({ theme, clickable }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td': {
    borderBottom: 0,
  },
  cursor: clickable ? 'pointer' : 'default',
  transition: theme.transitions.create('background-color'),
}));

const SortIcon = styled('span')<{ direction?: 'asc' | 'desc' | undefined }>(
  ({ theme, direction: _direction }) => ({
    color: theme.palette.primary.main,
    fontSize: '0.75rem',
    marginLeft: theme.spacing(1),
  }),
);

// Interfaces
export interface Column<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T = unknown> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc' | undefined;
  onRowClick?: ((row: T) => void) | undefined;
  keyExtractor?: ((row: T, index: number) => string | number) | undefined;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Table = <T extends Record<string, unknown>>({
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
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as React.ReactNode)}
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
