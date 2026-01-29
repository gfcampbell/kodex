import { NextRequest, NextResponse } from "next/server";
import { validateProjectPath } from "@/lib/project";

/**
 * GET /api/projects?path=...
 * Validate a project path
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectPath = searchParams.get("path");

  if (!projectPath) {
    return NextResponse.json(
      { valid: false, error: "Path parameter is required" },
      { status: 400 }
    );
  }

  const result = await validateProjectPath(projectPath);
  return NextResponse.json(result);
}
