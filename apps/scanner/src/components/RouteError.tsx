import { AlertTriangle, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RouteErrorProps {
  notFoundTitle?: string;
  notFoundDescription?: string;
}

export default function RouteError({ notFoundTitle, notFoundDescription }: RouteErrorProps) {
  const navigate = useNavigate();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound title={notFoundTitle} description={notFoundDescription} />;
  }

  const message = isRouteErrorResponse(error)
    ? error.statusText || `Error ${error.status}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.';

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate(0)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
