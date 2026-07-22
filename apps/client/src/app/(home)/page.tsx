// import Image from "next/image";
// import { Suspense } from "react";

// import { RoomAccessForm } from "@/components/room-access-form";
// import { Status } from "@/components/status";

// type Search = Record<string, string | string[] | undefined>;

// export default function Home({ searchParams }: { searchParams?: Search }) {
//   const sp = searchParams ?? {};
//   const roomIdParam = Array.isArray(sp.roomId) ? sp.roomId[0] : sp.roomId;
//   const roomId = (roomIdParam ?? "") as string;

//   return (
//     <main className="min-h-dvh bg-background text-foreground">
//       {/* Header */}
//       <header className="border-b">
//         <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
//           <div className="flex items-center gap-3">
//             <Image
//               src="/images/TeamEdit-logo.png"
//               alt="TeamEdit logo"
//               width={28}
//               height={28}
//               priority
//             />
//             <span className="font-semibold tracking-tight">
//               TeamEdit
//               <span className="sr-only"> — collaborative coding</span>
//             </span>
//           </div>
//           <div className="text-sm">{/* <Status /> */}</div>
//         </div>
//       </header>

//       {/* Hero + Form */}
//       <section className="mx-auto max-w-6xl px-4">
//         <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-2 md:py-12 lg:gap-12">
//           <div className="flex flex-col justify-center">
//             <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
//               Collaborate on TeamEdit in real time
//             </h1>
//             <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-foreground/70 md:text-base">
//               Create a room or join an invite to start pairing instantly. Your
//               editor, terminal, preview, and notes—shared live with your team.
//               All this without Login
//             </p>
//             <ul className="mt-6 grid gap-2 text-sm text-foreground/80">
//               <li className="flex items-center gap-2">
//                 <span
//                   className="inline-block size-1.5 rounded-full bg-blue-600"
//                   aria-hidden="true"
//                 />
//                 Real-time cursors and highlights
//               </li>
//               <li className="flex items-center gap-2">
//                 <span
//                   className="inline-block size-1.5 rounded-full bg-blue-600"
//                   aria-hidden="true"
//                 />
//                 Shared terminal and instant preview
//               </li>
//               <li className="flex items-center gap-2">
//                 <span
//                   className="inline-block size-1.5 rounded-full bg-blue-600"
//                   aria-hidden="true"
//                 />
//                 GitHub integration and shared notes
//               </li>
//             </ul>
//           </div>

//           <div className="md:pl-4">
//             <Suspense>
//               <RoomAccessForm roomId={roomId} />
//             </Suspense>
//           </div>
//         </div>
//       </section>

//       {/* Features */}
//       <section className="border-t bg-muted/20">
//         <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
//           <h2 className="text-balance text-xl font-semibold tracking-tight md:text-2xl">
//             Everything you need to pair effectively
//           </h2>
//           <p className="mt-2 max-w-prose text-sm leading-relaxed text-foreground/70 md:text-base">
//             Powerful collaboration tools with sensible defaults. No setup
//             required.
//           </p>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="border-t">
//         <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-foreground/60">
//           <p>&copy; {new Date().getFullYear()} TeamEdit</p>
//           <p>Built for fast, focused collaboration</p>
//         </div>
//       </footer>
//     </main>
//   );
// }
import Image from "next/image";
import { Suspense } from "react";

import { RoomAccessForm } from "@/components/room-access-form";

type Search = Record<string, string | string[] | undefined>;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const sp = (await searchParams) ?? {};
  const roomIdParam = Array.isArray(sp.roomId) ? sp.roomId[0] : sp.roomId;
  const roomId = (roomIdParam ?? "") as string;

  return (
    <main className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Image
              src="/images/TeamEdit-logo.png"
              alt="TeamEdit logo"
              width={32}
              height={32}
              priority
            />
            <h1 className="text-xl font-bold text-indigo-400 tracking-wide">
              TeamEdit
            </h1>
          </div>
          <div className="text-sm text-gray-400">{/* <Status /> */}</div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-indigo-400">
              Pair & Collaborate in Real-Time
            </h2>
            <p className="text-gray-300 text-lg md:text-xl">
              Instantly create or join a room and start coding together. Share
              your editor, terminal, preview, and notes with your team — all
              without login.
            </p>
            <ul className="grid gap-3 text-gray-400 text-sm">
              <li className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
                Live cursors & highlight sharing
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
                Collaborative terminal & instant preview
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
                GitHub integration & shared notes
              </li>
            </ul>
          </div>

          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
            <Suspense>
              <RoomAccessForm roomId={roomId} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-850 py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h3 className="text-3xl font-bold text-indigo-400 mb-4">
            Tools that make pairing seamless
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            A full suite of collaboration features designed for minimal setup
            and maximum productivity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-xl shadow hover:shadow-indigo-500 transition">
              <h4 className="font-semibold text-lg text-indigo-400 mb-2">
                Real-Time Editing
              </h4>
              <p className="text-gray-400 text-sm">
                Work together simultaneously with live cursors and highlights.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl shadow hover:shadow-indigo-500 transition">
              <h4 className="font-semibold text-lg text-indigo-400 mb-2">
                Shared Terminal
              </h4>
              <p className="text-gray-400 text-sm">
                See real-time terminal output and preview results instantly.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl shadow hover:shadow-indigo-500 transition">
              <h4 className="font-semibold text-lg text-indigo-400 mb-2">
                Notes & GitHub
              </h4>
              <p className="text-gray-400 text-sm">
                Keep documentation and GitHub integrations in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-6">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} TeamEdit</p>
          <p>Built for fast, focused collaboration</p>
        </div>
      </footer>
    </main>
  );
}
