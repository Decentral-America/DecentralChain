/**
 * Messages Page
 * Internal messaging and notifications
 */

import { Mail, MailOutline } from '@mui/icons-material';
import { Avatar, Box, Chip, Paper, Stack, Typography } from '@mui/material';

export const Messages = () => {
  const messages = [
    {
      from: 'DCC Network',
      id: 1,
      preview: 'We are excited to announce the launch of our new analytics dashboard...',
      subject: 'New feature: Enhanced Analytics Dashboard',
      time: '2 hours ago',
      unread: true,
    },
    {
      from: 'Security Team',
      id: 2,
      preview: 'For enhanced security, we recommend enabling two-factor authentication...',
      subject: 'Security Update: Enable 2FA',
      time: '5 hours ago',
      unread: true,
    },
    {
      from: 'Trading Alerts',
      id: 3,
      preview: 'Your DCC holdings have increased by 15% in the last 24 hours...',
      subject: 'DCC Price Alert: +15% in 24h',
      time: '1 day ago',
      unread: false,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Messages
        </Typography>
        <Chip label="20 Unread" color="error" size="small" />
      </Stack>

      <Stack spacing={2}>
        {messages.map((message) => (
          <Paper
            key={message.id}
            sx={{
              '&:hover': {
                boxShadow: '0 4px 12px rgba(61, 38, 190, 0.15)',
              },
              bgcolor: message.unread ? '#F9F7FF' : '#fff',
              border: message.unread ? '1px solid #3d26be' : '1px solid #EEF2F7',
              borderRadius: 2,
              cursor: 'pointer',
              p: 2.5,
              transition: 'all 0.2s',
            }}
          >
            <Stack direction="row" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: message.unread ? 'primary.main' : 'grey.300',
                  height: 48,
                  width: 48,
                }}
              >
                {message.unread ? <Mail /> : <MailOutline />}
              </Avatar>
              <Stack sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    {message.from}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {message.time}
                  </Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                  {message.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {message.preview}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};
