import { Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NotFoundProps {
  title?: string;
  description?: string;
}

export default function NotFound({
  title = 'Not Found',
  description = 'The resource you are looking for does not exist or may have been removed.',
}: NotFoundProps) {
  const navigate = useNavigate();
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="text-8xl font-bold text-muted-foreground/20 select-none">404</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground max-w-md">{description}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button asChild>
            <Link to="/">
              <Search className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
