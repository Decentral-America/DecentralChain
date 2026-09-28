/**
 * Notification stack: notifications as cards inside one muted well. Collapsed,
 * the newest card sits on top of the others, which peek out beneath it inset
 * and offset like iOS lock-screen notifications; expanded, the cards spring
 * apart into a list. The count sits in a quiet pill at the foot of the well.
 *
 * Ported from 21st.dev "Notification Stack" by @starc007 (demo 29327): the
 * well, the per-card peek offset and clip-path inset, and the layout springs
 * are that component's. The card content is reworked for messages: a round
 * icon, sender and time, subject, and a two-line preview.
 */
import { type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useId, useState } from 'react';
import styled from 'styled-components';
import { chrome } from '@/styles/tokens';

const PEEK = 8;
const INSET = 10;
const CARD = { damping: 34, mass: 0.8, stiffness: 380, type: 'spring' } as const;

export interface NotificationItem {
  id: string | number;
  icon: LucideIcon;
  /** Who or what it came from. */
  source: string;
  title: ReactNode;
  description?: ReactNode;
  /** Relative time, shown top right. */
  time?: string;
  unread?: boolean;
}

export interface NotificationStackProps {
  items: NotificationItem[];
  /** Footer label beside the count, e.g. "Notifications". */
  label: string;
  defaultExpanded?: boolean;
  className?: string;
}

const Well = styled(motion.div)`
  position: relative;
  padding: 12px;
  border-radius: 24px;
  background: ${({ theme }) => chrome[theme.mode].fillSubtle};
`;

const Stack = styled.div`
  display: grid;
  gap: 6px;
`;

const Card = styled(motion.article)`
  grid-column: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  padding: 14px 16px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.border}` : chrome.light.cardRing};
`;

const IconDisc = styled.span<{ $unread: boolean }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: ${({ theme, $unread }) => ($unread ? theme.colors.primary : theme.colors.textSecondary)};
  background: ${({ theme, $unread }) =>
    $unread ? theme.colors.primarySurface : chrome[theme.mode].fill};
`;

const Body = styled.div<{ $hidden: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
`;

const Meta = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Source = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Time = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
`;

const Dot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
`;

const Title = styled.h3`
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.15px;
  color: ${({ theme }) => theme.colors.text};
`;

const Description = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Footer = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  margin-top: 8px;
  padding: 0 4px;
`;

const Count = styled.span`
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  box-sizing: border-box;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.borderStrong}` : chrome.light.hairlineRing};
`;

const FooterLabel = styled.span`
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Toggle = styled.button`
  padding: 6px 10px;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
  background: transparent;
  cursor: pointer;
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: ${({ theme }) => theme.colors.primarySurface};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }
`;

export function NotificationStack({
  items,
  label,
  defaultExpanded = false,
  className,
}: NotificationStackProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const reduced = useReducedMotion();
  const listId = useId();
  const transition = reduced ? { duration: 0 } : CARD;
  // Collapsed, only three cards are drawn: the top one and two peeking edges.
  const visible = expanded ? items : items.slice(0, 3);

  return (
    <Well layout transition={transition} className={className}>
      <Stack id={listId} style={{ paddingBottom: expanded ? 0 : (visible.length - 1) * PEEK }}>
        {visible.map((item, index) => {
          const Icon = item.icon;
          const behind = !expanded && index > 0;
          return (
            <Card
              key={item.id}
              layout="position"
              initial={false}
              aria-hidden={behind || undefined}
              animate={{
                clipPath: expanded
                  ? 'inset(0px 0px round 16px)'
                  : `inset(0px ${index * INSET}px round 16px)`,
                y: expanded ? 0 : index * PEEK,
              }}
              transition={transition}
              style={{ gridRow: expanded ? index + 1 : 1, zIndex: visible.length - index }}
            >
              <IconDisc
                $unread={Boolean(item.unread)}
                aria-hidden
                style={{ visibility: behind ? 'hidden' : 'visible' }}
              >
                <Icon size={18} strokeWidth={1.75} />
              </IconDisc>
              <Body $hidden={behind}>
                <Meta>
                  <Source>{item.source}</Source>
                  {item.time ? (
                    <Time>
                      {item.unread ? <Dot aria-label="Unread" role="img" /> : null}
                      {item.time}
                    </Time>
                  ) : null}
                </Meta>
                <Title>{item.title}</Title>
                {item.description ? <Description>{item.description}</Description> : null}
              </Body>
            </Card>
          );
        })}
      </Stack>

      <Footer layout="position" transition={transition}>
        <Count>{items.length}</Count>
        <FooterLabel>{label}</FooterLabel>
        {items.length > 1 ? (
          <Toggle
            type="button"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Stack' : 'Show all'}
          </Toggle>
        ) : null}
      </Footer>
    </Well>
  );
}
