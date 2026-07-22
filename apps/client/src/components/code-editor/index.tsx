import {
  memo,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import Editor, { type Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useTheme } from "next-themes";

import {
  CodeServiceMsg,
  RoomServiceMsg,
  ScrollServiceMsg,
} from "@CodeX/types/message";
import type { Cursor, EditOp } from "@CodeX/types/operation";
import type { Scroll } from "@CodeX/types/scroll";

import { getSocket } from "@/lib/socket";
import type { StatusBarCursorPosition } from "@/components/status-bar";

import { LoadingCard } from "./components/loading-card";
import * as codeService from "./service/code-service";
import * as cursorService from "./service/cursor-service";
import * as editorService from "./service/editor-service";
import * as scrollService from "./service/scroll-service";

interface CodeEditorProps {
  monacoRef: (monaco: Monaco) => void;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  cursorPosition: Dispatch<SetStateAction<StatusBarCursorPosition>>;
  defaultCode?: string;
  setCode: (code: string) => void;
}

const CodeEditor = memo(function CodeEditor({
  monacoRef,
  editorRef,
  cursorPosition,
  defaultCode,
  setCode,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  const socket = getSocket();

  const [theme, setTheme] = useState<string>("vs-dark");

  const [isMonacoReady, setIsMonacoReady] = useState(false);

  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoInstanceRef = useRef<Monaco | null>(null);
  const skipUpdateRef = useRef(false);
  const cursorDecorationsRef = useRef<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >({});
  const cleanupTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  useEffect(() => {
    const storedTheme =
      localStorage.getItem("editorTheme") ||
      (resolvedTheme === "dark" ? "vs-dark" : "light");
    setTheme(storedTheme);
    localStorage.setItem("editorTheme", storedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    editorInstanceRef.current?.updateOptions({ theme });
  }, [theme]);

  useEffect(() => {
    if (!isMonacoReady) return;

    socket.on(CodeServiceMsg.UPDATE_CODE, (op: EditOp) => {
      codeService.updateCode(op, editorInstanceRef, skipUpdateRef);
    });

    socket.on(CodeServiceMsg.UPDATE_CURSOR, (userID: string, cursor: Cursor) =>
      cursorService.updateCursor(
        userID,
        cursor,
        editorInstanceRef,
        monacoInstanceRef,
        cursorDecorationsRef,
        cleanupTimeoutsRef
      )
    );

    socket.on(
      ScrollServiceMsg.UPDATE_SCROLL,
      (userID: string, scroll: Scroll) =>
        scrollService.updateScroll(editorInstanceRef, userID, scroll)
    );

    socket.on(RoomServiceMsg.LEAVE, (userID: string) =>
      cursorService.removeCursor(userID, cursorDecorationsRef)
    );

    return () => {
      socket.off(CodeServiceMsg.UPDATE_CODE);
      socket.off(CodeServiceMsg.UPDATE_CURSOR);
      socket.off(ScrollServiceMsg.UPDATE_SCROLL);
      socket.off(RoomServiceMsg.LEAVE);
    };
  }, [isMonacoReady, socket]);

  useEffect(() => {
    return () => {
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];

      Object.values(cursorDecorationsRef.current).forEach((decoration) =>
        decoration.clear()
      );
      cursorDecorationsRef.current = {};

      Object.values(cleanupTimeoutsRef.current).forEach((timeout) =>
        clearTimeout(timeout)
      );
      cleanupTimeoutsRef.current = {};
    };
  }, []);

  const handleEditorMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorInstanceRef.current = editor;
    monacoInstanceRef.current = monaco;

    editorRef(editor);
    monacoRef(monaco);

    editorService.handleOnMount(
      editor,
      monaco,
      disposablesRef,
      cursorPosition,
      defaultCode
    );

    setIsMonacoReady(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between rounded-t-md border-b bg-[color:var(--toolbar-bg-secondary)]/90 px-2 py-1 text-xs text-[color:var(--toolbar-foreground)]">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex size-2 rounded-full bg-emerald-400"
            aria-hidden="true"
          />
          <span className="opacity-80">Editor</span>
        </div>
        <div className="flex items-center gap-1 opacity-60">
          <span className="h-1.5 w-8 rounded-full bg-current/40" />
          <span className="h-1.5 w-8 rounded-full bg-current/40" />
          <span className="h-1.5 w-6 rounded-full bg-current/40" />
        </div>
      </div>
      <div className="flex-1 rounded-b-md border bg-background/60 p-1 backdrop-blur">
        <div className="h-full rounded-md ring-1 ring-border">
          <Editor
            className="h-full"
            defaultLanguage="html"
            theme={theme}
            loading={<LoadingCard />}
            beforeMount={editorService.handleBeforeMount}
            onMount={handleEditorMount}
            onChange={(
              value: string | undefined,
              ev: monaco.editor.IModelContentChangedEvent
            ) => {
              editorService.handleOnChange(value, ev, skipUpdateRef);
              setCode(value || "");
            }}
          />
        </div>
      </div>
    </div>
  );
});

export { CodeEditor };
