/**
 * Command palette: a search field over grouped destinations, driven from the
 * keyboard. Typing filters; arrow keys move a highlight that slides between
 * rows; Enter opens; the footer names the keys. Focus never leaves the field,
 * so the list is announced through aria-activedescendant.
 *
 * Ported from 21st.dev "Command" by @wensity (demo 31354): the three-band
 * layout (field, list, key-hint footer split by hairlines), the 10px rows
 * grouped under muted headings, the kbd chips and the two-layer surface
 * shadow. Base UI's Autocomplete is replaced by a small keyboard model here,
 * and the host supplies the dialog.
 */
import { ArrowDown, ArrowUp, CornerDownLeft, Search } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { chrome, spring } from '@/styles/tokens';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** Marks the current location. */
  active?: boolean;
  /** Extra words the search should match. */
  keywords?: string;
  onSelect: () => void;
}

export interface CommandGroup {
  title: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  groups: CommandGroup[];
  placeholder?: string;
  /** Accessible name for the field. */
  label: string;
  emptyLabel?: string;
  autoFocus?: boolean;
}

const Root = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
`;

const Field = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  min-height: 56px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  height: 56px;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 17px;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.text};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.8;
  }
`;

const List = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px;
  scroll-padding: 8px;
`;

const GroupTitle = styled.div`
  padding: 12px 12px 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Row = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
`;

const Highlight = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: ${({ theme }) => chrome[theme.mode].fill};
`;

const Glyph = styled.span<{ $active: boolean }>`
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: ${({ theme, $active }) => ($active ? theme.colors.textOnPrimary : theme.colors.text)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primary : chrome[theme.mode].fill)};

  svg {
    width: 17px;
    height: 17px;
  }
`;

const Text = styled.span`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const Label = styled.span`
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.15px;
  color: ${({ theme }) => theme.colors.text};
`;

const Description = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Current = styled.span`
  position: relative;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
`;

const Empty = styled.p`
  margin: 0;
  padding: 32px 16px;
  text-align: center;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  @media (hover: none) {
    display: none;
  }
`;

const Hint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const Kbd = styled.kbd`
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => chrome[theme.mode].fill};
`;

const normalise = (s: string) => s.toLowerCase().normalize('NFKD');

export function CommandPalette({
  groups,
  placeholder = 'Search',
  label,
  emptyLabel = 'Nothing matches that search.',
  autoFocus = true,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const reduced = useReducedMotion();
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * Focus after the host dialog has settled: a modal's focus trap moves focus
   * to its own container on open, which would otherwise win over autoFocus.
   */
  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const late = setTimeout(() => {
      if (document.activeElement !== inputRef.current) inputRef.current?.focus();
    }, 120);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(late);
    };
  }, [autoFocus]);

  const filtered = useMemo(() => {
    const q = normalise(query.trim());
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        // Word-prefix match, so "set" finds Settings but not every "asset".
        items: group.items.filter((item) => {
          const words = normalise(
            `${item.label} ${item.description ?? ''} ${item.keywords ?? ''} ${group.title}`,
          ).split(/[^\p{L}\p{N}]+/u);
          return q.split(/\s+/).every((term) => words.some((word) => word.startsWith(term)));
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const flat = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);

  // Start on the current location when nothing is typed, otherwise on the first match.
  const [cursor, setCursor] = useState(() =>
    Math.max(
      0,
      flat.findIndex((i) => i.active),
    ),
  );
  // Only a new query resets the highlight; a parent re-render must not.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the query alone
  useEffect(() => {
    setCursor(
      query
        ? 0
        : Math.max(
            0,
            flat.findIndex((i) => i.active),
          ),
    );
  }, [query]);

  const current = flat[cursor];
  const optionId = (item: CommandItem) => `${baseId}-${item.id}`;

  useEffect(() => {
    if (!current) return;
    document.getElementById(`${baseId}-${current.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [current, baseId]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + flat.length) % flat.length);
    } else if (e.key === 'Home' && !query) {
      e.preventDefault();
      setCursor(0);
    } else if (e.key === 'End' && !query) {
      e.preventDefault();
      setCursor(flat.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      current?.onSelect();
    }
  };

  const listId = `${baseId}-list`;

  return (
    <Root>
      <Field>
        <Search size={18} strokeWidth={2} aria-hidden />
        <Input
          role="combobox"
          aria-label={label}
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current ? optionId(current) : undefined}
          ref={inputRef}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </Field>

      <List ref={listRef} id={listId} role="listbox" aria-label={label}>
        {flat.length === 0 ? <Empty>{emptyLabel}</Empty> : null}
        {filtered.map((group) => (
          // biome-ignore lint/a11y/useSemanticElements: an ARIA listbox group, not a form fieldset
          <div key={group.title} role="group" aria-labelledby={`${baseId}-${group.title}`}>
            <GroupTitle id={`${baseId}-${group.title}`}>{group.title}</GroupTitle>
            {group.items.map((item) => {
              const on = current?.id === item.id;
              return (
                <Row
                  key={item.id}
                  id={optionId(item)}
                  role="option"
                  aria-selected={on}
                  aria-current={item.active ? 'page' : undefined}
                  onPointerMove={() => {
                    const i = flat.indexOf(item);
                    if (i !== cursor) setCursor(i);
                  }}
                  onClick={item.onSelect}
                >
                  {on ? (
                    <Highlight
                      layoutId={`${baseId}-highlight`}
                      transition={reduced ? { duration: 0 } : spring}
                    />
                  ) : null}
                  {item.icon ? (
                    <Glyph $active={Boolean(item.active)} aria-hidden>
                      {item.icon}
                    </Glyph>
                  ) : null}
                  <Text>
                    <Label>{item.label}</Label>
                    {item.description ? <Description>{item.description}</Description> : null}
                  </Text>
                  {item.active ? <Current>Current</Current> : null}
                </Row>
              );
            })}
          </div>
        ))}
      </List>

      <Footer aria-hidden>
        <Hint>
          <Kbd>
            <CornerDownLeft size={12} />
          </Kbd>
          Open
        </Hint>
        <Hint>
          <Kbd>
            <ArrowUp size={12} />
          </Kbd>
          <Kbd>
            <ArrowDown size={12} />
          </Kbd>
          Move
        </Hint>
        <Hint>
          <Kbd>esc</Kbd>
          Close
        </Hint>
      </Footer>
    </Root>
  );
}
