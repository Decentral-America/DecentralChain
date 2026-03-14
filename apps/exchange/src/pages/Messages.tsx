/**
 * Messages Page
 * Internal messaging and notifications
 */
import { Box, Typography, Paper, Stack, Avatar, Chip } from '@mui/material';
import { Mail, MailOutline } from '@mui/icons-material';

export const Messages = () => {
  const messages = [
    {
      id: 1,
      from: 'DCC Network',
      subject: 'New feature: Enhanced Analytics Dashboard',
      preview: 'We are excited to announce the launch of our new analytics dashboard...',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 2,
      from: 'Security Team',
      subject: 'Security Update: Enable 2FA',
      preview: 'For enhanced security, we recommend enabling two-factor authentication...',
      time: '5 hours ago',
      unread: true,
    },
    {
      id: 3,
      from: 'Trading Alerts',
      subject: 'DCC Price Alert: +15% in 24h',
      preview: 'Your DCC holdings have increased by 15% in the last 24 hours...',
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
              p: 2.5,
              borderRadius: 2,
              border: message.unread ? '1px solid #3d26be' : '1px solid #EEF2F7',
              bgcolor: message.unread ? '#F9F7FF' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(61, 38, 190, 0.15)',
              },
            }}
          >
            <Stack direction="row" spacing={2}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: message.unread ? 'primary.main' : 'grey.300',
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
