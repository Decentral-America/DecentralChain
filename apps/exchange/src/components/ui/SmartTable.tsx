/**
 * SmartTable Component
 * Enhanced table with filtering, sorting, and pagination
 * Migrated to Material-UI
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Box, TextField, Select, MenuItem, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Table, Column } from './Table';

// Styled Components
const SmartTableContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

const ControlsBar = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
});

const PaginationControls = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

const PageButton = styled(IconButton, {
  shouldForwardProp: (prop) => !['active'].includes(prop as string),
})<{ active?: boolean }>(({ theme, active }) => ({
  padding: '6px 12px',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: active ? theme.palette.primary.main : 'transparent',
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.action.hover,
  },
  '&:disabled': {
    opacity: 0.5,
  },
}));

// Interfaces
export interface SmartTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  pageSizeOptions?: number[];
  enableFiltering?: boolean;
  filterPlaceholder?: string;
  enablePagination?: boolean;
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SmartTable = <T extends Record<string, any>>({
  columns,
  data,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  enableFiltering = true,
  filterPlaceholder = 'Search...',
  enablePagination = true,
  onRowClick,
  keyExtractor,
  emptyMessage = 'No data available',
  className,
  style,
}: SmartTableProps<T>) => {
  // State
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [filterText, setFilterText] = useState('');

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
        return prevKey;
      } else {
        setSortDirection('asc');
        return key;
      }
    });
    setCurrentPage(0); // Reset to first page when sorting changes
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    if (!enableFiltering || !filterText) return data;

    const lowerFilter = filterText.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(lowerFilter))
    );
  }, [data, filterText, enableFiltering]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings (case-insensitive)
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortDirection === 'asc') {
        return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
      } else {
        return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
      }
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;
    const start = currentPage * currentPageSize;
    const end = start + currentPageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, currentPageSize, enablePagination]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / currentPageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  // Handle page changes
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(Math.max(0, Math.min(newPage, totalPages - 1)));
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((newSize: number) => {
    setCurrentPageSize(newSize);
    setCurrentPage(0); // Reset to first page
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
    setCurrentPage(0); // Reset to first page when filter changes
  }, []);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and current with ellipsis
      pages.push(0);

      if (currentPage > 2) {
        pages.push('...');
      }

      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push('...');
      }

      pages.push(totalPages - 1);
    }

    return pages;
  };

  return (
    <SmartTableContainer className={className} style={style}>
      {(enableFiltering || enablePagination) && (
        <ControlsBar>
          {enableFiltering && (
            <TextField
              type="text"
              placeholder={filterPlaceholder}
              value={filterText}
              onChange={handleFilterChange}
              size="small"
              sx={{ minWidth: 200 }}
            />
          )}

          {enablePagination && (
            <PaginationControls>
              <Typography variant="body2" color="text.secondary">
                Showing {currentPage * currentPageSize + 1}-
                {Math.min((currentPage + 1) * currentPageSize, sortedData.length)} of{' '}
                {sortedData.length}
              </Typography>

              <Select
                value={currentPageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                size="small"
              >
                {pageSizeOptions.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size} per page
                  </MenuItem>
                ))}
              </Select>
            </PaginationControls>
          )}
        </ControlsBar>
      )}

      <Table
        columns={columns}
        data={paginatedData}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onRowClick={onRowClick}
        keyExtractor={keyExtractor}
        emptyMessage={emptyMessage}
      />

      {enablePagination && totalPages > 1 && (
        <PaginationControls>
          <PageButton onClick={() => handlePageChange(currentPage - 1)} disabled={!hasPrevPage}>
            Previous
          </PageButton>

          {getPageNumbers().map((page, index) =>
            typeof page === 'number' ? (
              <PageButton
                key={page}
                active={page === currentPage}
                onClick={() => handlePageChange(page)}
              >
                {page + 1}
              </PageButton>
            ) : (
              <Typography key={`ellipsis-${index}`} variant="body2" sx={{ px: 0.5 }}>
                {page}
              </Typography>
            )
          )}

          <PageButton onClick={() => handlePageChange(currentPage + 1)} disabled={!hasNextPage}>
            Next
          </PageButton>
        </PaginationControls>
      )}
    </SmartTableContainer>
  );
};

// Convenience exports with preset configurations
export const SmartTableSmall = <T extends Record<string, any>>(
  props: Omit<SmartTableProps<T>, 'pageSize'>
) => <SmartTable {...props} pageSize={10} />;

export const SmartTableLarge = <T extends Record<string, any>>(
  props: Omit<SmartTableProps<T>, 'pageSize'>
) => <SmartTable {...props} pageSize={50} />;

export const SmartTableNoFilters = <T extends Record<string, any>>(
  props: Omit<SmartTableProps<T>, 'enableFiltering'>
) => <SmartTable {...props} enableFiltering={false} />;

export const SmartTableNoPagination = <T extends Record<string, any>>(
  props: Omit<SmartTableProps<T>, 'enablePagination'>
) => <SmartTable {...props} enablePagination={false} />;

export default SmartTable;
