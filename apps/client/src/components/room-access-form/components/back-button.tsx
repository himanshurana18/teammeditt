"use client";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BackButton({ onClick, disabled, className }: BackButtonProps) {
  return (
    <div className="mt-2 flex justify-center">
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        disabled={disabled}
        className={className}
        aria-label="Go back"
      >
        {/* Keeping copy minimal and accessible; purely presentational */}
        Back
      </Button>
    </div>
  );
}
