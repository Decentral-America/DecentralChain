import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { fetchAssetDetailsById, fetchBlockById, fetchTransactionInfo } from '@/lib/api';
import { createPageUrl } from '@/utils';

export default function SearchBar(): React.ReactElement {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const trimmedQuery = query.trim();

    try {
      // Check if it's a block height (all digits)
      if (/^\d+$/.test(trimmedQuery)) {
        void navigate(createPageUrl('BlockDetail', `?height=${trimmedQuery}`));
        setLoading(false);
        return;
      }

      // Check if it's a long hash (block/tx/asset ID - typically 40+ chars)
      if (trimmedQuery.length >= 40) {
        // Try as block ID first
        try {
          await fetchBlockById(trimmedQuery);
          void navigate(createPageUrl('BlockDetail', `?id=${trimmedQuery}`));
          setLoading(false);
          return;
        } catch (_blockError) {
          // Try as transaction ID
          try {
            await fetchTransactionInfo(trimmedQuery);
            void navigate(createPageUrl('Transaction', `?id=${trimmedQuery}`));
            setLoading(false);
            return;
          } catch (_txError) {
            // Try as asset ID
            try {
              await fetchAssetDetailsById(trimmedQuery);
              void navigate(createPageUrl('Asset', `?id=${trimmedQuery}`));
              setLoading(false);
              return;
            } catch (_assetError) {
              throw new Error('No block, transaction, or asset found with this ID');
            }
          }
        }
      }

      // Otherwise, assume it's an address
      void navigate(createPageUrl('Address', `?addr=${trimmedQuery}`));
    } catch (error: unknown) {
      toast({
        description:
          error instanceof Error ? error.message : 'Could not find the requested resource',
        title: 'Search Error',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSearch}
      aria-label="Search the blockchain"
      className="relative flex-1 max-w-2xl"
    >
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="text"
        placeholder="Search by block height, block ID, transaction ID, address, or asset ID..."
        aria-label="Search by block height, transaction ID, address, or asset ID"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-24"
        disabled={loading}
      />
      <Button
        type="submit"
        size="sm"
        disabled={loading || !query.trim()}
        className="absolute right-1.5 top-1/2 transform -translate-y-1/2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Searching...</span>
          </>
        ) : (
          'Search'
        )}
      </Button>
    </form>
  );
}
