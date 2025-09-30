import React from "react";

export const TripCardSkeleton = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 animate-pulse">
    <div className="h-40 bg-slate-800 rounded-lg mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
      <div className="h-3 bg-slate-800 rounded w-1/2"></div>
      <div className="h-3 bg-slate-800 rounded w-1/3"></div>
    </div>
  </div>
);
