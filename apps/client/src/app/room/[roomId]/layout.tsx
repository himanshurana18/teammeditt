import type { ReactNode } from "react";
import type { Metadata } from "next";

import { INVITED_DESCRIPTION } from "@/lib/constants";

export const metadata: Metadata = {
  description: INVITED_DESCRIPTION,
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <div className="h-full overflow-y-hidden">{children}</div>;
}
