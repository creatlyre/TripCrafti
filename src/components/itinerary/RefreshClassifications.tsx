import { RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';

interface RefreshClassificationsProps {
  onRefresh?: () => void;
}

export function RefreshClassifications({ onRefresh }: RefreshClassificationsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/events/refresh-classifications', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh classifications');
      }

      const result = await response.json();
      setLastRefresh(new Date().toLocaleString());
      onRefresh?.();

      // Show success message (you could replace this with a toast notification)
      alert('Classifications refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing classifications:', error);
      alert('Failed to refresh classifications. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-1"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Classifications'}
      </Button>
      {lastRefresh && <span className="text-sm text-muted-foreground">Last updated: {lastRefresh}</span>}
    </div>
  );
}
