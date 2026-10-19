import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SwapRoute } from '../SwapRoute';

describe('SwapRoute', () => {
  it('redirects /desktop/swap to the order book where no AMM is deployed', () => {
    render(
      <MemoryRouter initialEntries={['/desktop/swap']}>
        <Routes>
          <Route path="/desktop/swap" element={<SwapRoute ammSupported={false} />} />
          <Route path="/desktop/dex" element={<div>order book</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('order book')).toBeInTheDocument();
  });
});
