"use client";

import { useRef } from "react";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AboutButton = () => {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild className="dark">
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-muted-foreground size-5 text-white hover:bg-transparent"
            aria-label="About"
            type="button"
            aria-haspopup="dialog"
          >
            <Info className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="mr-1">
          About
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export { AboutButton };
