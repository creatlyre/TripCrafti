import { useState } from 'react';
import type { Lang } from '@/lib/i18n';

interface UseItineraryShareOptions {
  tripId: string;
  lang: Lang;
}

export function useItineraryShare({ tripId, lang }: UseItineraryShareOptions) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createShareLink = async () => {
    setIsSharing(true);
    setError(null);
    setShareUrl(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lang }), // Pass lang for localized messages
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create share link.');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  const reset = () => {
    setShareUrl(null);
    setError(null);
    setIsSharing(false);
  };

  return {
    isSharing,
    shareUrl,
    error,
    createShareLink,
    reset,
  };
}