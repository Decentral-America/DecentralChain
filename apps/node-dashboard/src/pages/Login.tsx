import { useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ERROR_MESSAGES: Record<string, string> = {
  not_a_member: 'You are not a member of the Decentral-America organization.',
  oauth_denied: 'GitHub authorization was denied.',
  token_exchange_failed: 'Failed to connect with GitHub. Try again.',
  user_fetch_failed: 'Could not retrieve your GitHub profile. Try again.',
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">DCC Node Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive text-center">
              {ERROR_MESSAGES[error] ?? 'An error occurred. Try again.'}
            </p>
          )}
          <a
            href="/api/auth/github"
            className="flex items-center justify-center gap-3 w-full rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in with GitHub
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
