"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

import { EditorSkeleton } from "./components/editor-skeleton";

const DynamicNotepadMain = dynamic(
  () =>
    import("./components/notepad-main").then((mod) => mod.MarkdownEditorMain),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

const Notepad = ({ markdown }: { markdown: string }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between rounded-t-md border-b bg-[color:var(--toolbar-bg-secondary)]/90 px-2 py-1 text-xs text-[color:var(--toolbar-foreground)]">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex size-2 rounded-full bg-sky-400"
          aria-hidden="true"
        />
        <span className="opacity-80">Shared Notepad</span>
      </div>
      <div className="flex items-center gap-1 opacity-60">
        <span className="h-1.5 w-8 rounded-full bg-current/40" />
        <span className="h-1.5 w-8 rounded-full bg-current/40" />
      </div>
    </div>
    <div className="flex-1 rounded-b-md border bg-background/60 p-1 backdrop-blur">
      <div className="h-full rounded-md ring-1 ring-border">
        <Suspense fallback={null}>
          <DynamicNotepadMain markdown={markdown} />
        </Suspense>
      </div>
    </div>
  </div>
);

export { Notepad };
