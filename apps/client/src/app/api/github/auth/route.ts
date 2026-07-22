import type { NextRequest } from "next/server";
import { githubAuthHandlers } from "@/lib/github";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");

  if (code) {
    const result = await githubAuthHandlers.callback(code);
    const baseUrl = new URL(req.url).origin;

    if ("success" in result && result.success) {
      return Response.redirect(`${baseUrl}/oauth/github?status=success`);
    }

    if ("error" in result && "description" in result) {
      const redirectUrl = new URL(`${baseUrl}/oauth/github`);
      redirectUrl.searchParams.set("status", result.error);
      redirectUrl.searchParams.set("description", result.description);
      return Response.redirect(redirectUrl.toString());
    }

    return Response.redirect(`${baseUrl}/oauth/github?status=unknown`);
  }

  return githubAuthHandlers.check();
}

export async function DELETE() {
  return githubAuthHandlers.logout();
}
