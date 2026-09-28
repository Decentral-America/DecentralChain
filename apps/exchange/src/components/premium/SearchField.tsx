/**
 * Search field — the iOS search field, and the only search style in the app.
 * A filled `--surface-fill` well with a glass glyph and no border, so it reads
 * as a filter on the list beneath it rather than as a form input. A clear
 * button appears once there is a query.
 *
 * The font size is 16px so iOS Safari does not zoom the viewport on focus.
 */
import { Search, X } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';
import styled from 'styled-components';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name; the placeholder is not a label. */
  label: string;
  className?: string | undefined;
}

const Root = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 4px 0 10px;
  border-radius: 10px;
  background: var(--surface-fill);
  color: var(--text-secondary);
  transition: box-shadow 160ms var(--ease);

  &:focus-within {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: 16px;
  letter-spacing: -0.01em;

  &::placeholder {
    color: var(--text-secondary);
    opacity: 1;
  }

  /* The clear button below replaces the browser's own cancel control. */
  &::-webkit-search-cancel-button {
    appearance: none;
  }
`;

const Clear = styled.button`
  all: unset;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary);
  transition:
    background-color 160ms var(--ease),
    color 160ms var(--ease),
    transform 160ms var(--ease);

  &:hover {
    color: var(--text-primary);
    background: var(--surface-fill);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;

export function SearchField({ value, onChange, placeholder, label, className }: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <Root className={className}>
      <Search size={17} strokeWidth={2} aria-hidden="true" />
      <Input
        ref={input}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
      {value ? (
        <Clear
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            input.current?.focus();
          }}
        >
          <X size={15} strokeWidth={2} aria-hidden="true" />
        </Clear>
      ) : null}
    </Root>
  );
}
