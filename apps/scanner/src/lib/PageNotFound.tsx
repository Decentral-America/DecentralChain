import { Link, useLocation } from 'react-router';

export default function PageNotFound(): React.ReactElement {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          {/* 404 Error Code */}
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-muted-foreground/50">404</h1>
            <div className="h-0.5 w-16 bg-border mx-auto" />
          </div>

          {/* Main Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground leading-relaxed">
              The page <span className="font-medium text-foreground">"{pageName}"</span> could not
              be found in this application.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-6">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted hover:border-border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Home"
              >
                <title>Home</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
