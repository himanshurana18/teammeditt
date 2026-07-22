import Image from "next/image";

import { SITE_NAME } from "@/lib/constants";

const WelcomeMsg = () => (
  <div className="mb-4 space-y-2">
    <div className="flex items-center gap-2 text-green-500">
      <Image
        src="/images/TeamEdit-logo.png"
        alt="TeamEdit Logo"
        className="size-5"
        width="16"
        height="16"
        priority
      />
      <span>Welcome to {SITE_NAME}</span>
    </div>
    <div className="text-green-500">---------------------------------</div>
    <div className="space-y-1 text-sm">
      <p>Collaborative coding in real time.</p>
      <p>
        Type code in the editor and hit <b>Run</b>.
      </p>
      <p>See output in the shared terminal below.</p>
      <p>Select language from the dropdown (bottom-right).</p>
    </div>
  </div>
);

export { WelcomeMsg };
