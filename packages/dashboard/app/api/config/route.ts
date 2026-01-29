import { NextRequest, NextResponse } from "next/server";
import { loadProjectConfig, saveProjectConfig } from "@/lib/project";
import type { KodexConfig } from "@kodex/shared";

/**
 * GET /api/config?path=...
 * Load project configuration
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectPath = searchParams.get("path");

  if (!projectPath) {
    return NextResponse.json(
      { error: "Path parameter is required" },
      { status: 400 }
    );
  }

  const config = await loadProjectConfig(projectPath);
  
  if (!config) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({ config });
}

/**
 * PUT /api/config
 * Save project configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: projectPath, config } = body as {
      path: string;
      config: KodexConfig;
    };

    if (!projectPath) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { error: "Config is required" },
        { status: 400 }
      );
    }

    await saveProjectConfig(projectPath, config);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
