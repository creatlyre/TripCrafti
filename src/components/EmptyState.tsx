import React from "react";
import SuitcaseIcon from "@/components/icons/SuitcaseIcon";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onActionClick: () => void;
  dict: {
    heading: string;
    description: string;
    action: string;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onActionClick, dict }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700/60 py-20 text-center bg-slate-900/50">
    <SuitcaseIcon className="w-16 h-16 text-slate-600 mb-4" />
    <h3 className="text-xl font-semibold text-slate-200 mb-2">{dict.heading}</h3>
    <p className="text-sm text-slate-400 mb-6 max-w-xs">{dict.description}</p>
    <Button onClick={onActionClick} className="bg-indigo-600 hover:bg-indigo-500 text-white">
      {dict.action}
    </Button>
  </div>
);
