import type { Metadata } from "next";

import { LATENCY_TEST_DESCRIPTION, LATENCY_TEST_TITLE } from "@/lib/constants";

export const metadata: Metadata = {
  title: LATENCY_TEST_TITLE,
  description: LATENCY_TEST_DESCRIPTION,
};

export default function LatencyTestPage() {
  return <div className="container mx-auto p-4"></div>;
}
