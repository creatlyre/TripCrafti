import React, { useState, useEffect } from 'react';

// Define the structure of the image data we expect from our API
interface ImageAttribution {
  name: string;
  link: string;
}

interface ImageData {
  url: string;
  alt: string;
  attribution: ImageAttribution;
}

interface TripImageProps {
  destination: string;
}

/**
 * A client-side React component to fetch and display a trip's destination image.
 * It handles loading and error states and displays attribution on hover.
 */
export const TripImage: React.FC<TripImageProps> = ({ destination }) => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImage() {
      if (!destination) {
        setIsLoading(false);
        setError("No destination provided.");
        return;
      }
      
      // Reset state for new destination prop
      setIsLoading(true);
      setError(null);
      setImageData(null);

      try {
        const response = await fetch(`/api/images/${encodeURIComponent(destination)}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Image not found.');
        }
        const data: ImageData = await response.json();
        setImageData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchImage();
  }, [destination]); // Re-run effect if the destination changes

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-32 bg-secondary/50 rounded-t-lg flex items-center justify-center animate-pulse" />
    );
  }

  // Error state
  if (error || !imageData) {
    return (
      <div className="w-full h-32 bg-secondary/30 rounded-t-lg flex items-center justify-center text-muted-foreground/80 text-xs p-2 text-center">
        {destination}
      </div>
    );
  }
  
  // Success state
  return (
    <div
      className="w-full h-32 bg-cover bg-center rounded-t-lg relative group"
      style={{ backgroundImage: `url(${imageData.url})` }}
      role="img"
      aria-label={imageData.alt}
    >
      <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Photo by{' '}
        <a
          href={`${imageData.attribution.link}?utm_source=trip-planner&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-300"
          onClick={(e) => e.stopPropagation()} // Prevents card click when clicking the link
        >
          {imageData.attribution.name}
        </a>
        {' on '}
        <a
          href="https://unsplash.com?utm_source=trip-planner&utm_medium=referral"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-300"
           onClick={(e) => e.stopPropagation()}
        >
          Unsplash
        </a>
      </div>
    </div>
  );
};

export default TripImage;