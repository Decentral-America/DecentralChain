/**
 * Messages Page
 *
 * Network messaging is not live. The notice says so first, and the examples
 * beneath it are held back (dimmed and inert) so they read as a preview of the
 * format, never as mail this account received.
 */

import { Bell, Megaphone, ShieldCheck } from 'lucide-react';
import { ComingSoon } from '@/components/feedback/ComingSoon';
import { type NotificationItem, NotificationStack } from '@/components/premium/NotificationStack';
import { StatusPill } from '@/components/premium/StatusPill';
import { PageFrame } from '@/layouts/PageFrame';

/** Illustrative only: none of these were sent, and none quotes a real figure. */
const EXAMPLES: NotificationItem[] = [
  {
    description: 'A short note from the network about a new feature, with a link to read more.',
    icon: Megaphone,
    id: 1,
    source: 'DCC Network',
    time: '2h ago',
    title: 'New feature: activity analytics',
    unread: true,
  },
  {
    description: 'Security guidance for this wallet, such as keeping the backup phrase offline.',
    icon: ShieldCheck,
    id: 2,
    source: 'Security',
    time: '5h ago',
    title: 'Keep your backup phrase offline',
    unread: true,
  },
  {
    description: 'An alert you set up yourself, sent when the condition you chose is met.',
    icon: Bell,
    id: 3,
    source: 'Alerts',
    time: '1d ago',
    title: 'A price alert you created was triggered',
    unread: false,
  },
];

export const Messages = () => {
  const unread = EXAMPLES.filter((m) => m.unread).length;

  return (
    <PageFrame
      title="Messages"
      subtitle="Notifications and alerts from the network."
      actions={<StatusPill tone="neutral">{`Examples · ${unread} unread`}</StatusPill>}
    >
      <ComingSoon
        title="Messaging is not live yet"
        description="The messages below are examples of what network notifications will look like. Nothing here was sent to this account."
      >
        <NotificationStack items={EXAMPLES} label="Example notifications" defaultExpanded />
      </ComingSoon>
    </PageFrame>
  );
};
