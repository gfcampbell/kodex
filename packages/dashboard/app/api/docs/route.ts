import { NextRequest, NextResponse } from "next/server";
import { loadKnowledgeBase, saveKnowledgeBase } from "@/lib/storage";
import type { KnowledgeItem } from "@kodex/shared";

/**
 * GET /api/docs?path=...
 * Get all documentation items for a project
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectPath = searchParams.get("path");
  const status = searchParams.get("status");
  const topic = searchParams.get("topic");
  const search = searchParams.get("search");

  if (!projectPath) {
    return NextResponse.json(
      { error: "Path parameter is required" },
      { status: 400 }
    );
  }

  try {
    const kb = await loadKnowledgeBase(projectPath);
    let items = kb.items;

    // Apply filters
    if (status) {
      items = items.filter((item) => item.status === status);
    }

    if (topic) {
      items = items.filter((item) => item.topic.startsWith(topic));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.content.toLowerCase().includes(searchLower) ||
          item.topic.toLowerCase().includes(searchLower)
      );
    }

    // Sort by generatedAt (newest first)
    items.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

    return NextResponse.json({ items, total: kb.items.length });
  } catch (error) {
    console.error("Failed to load docs:", error);
    return NextResponse.json(
      { error: "Failed to load documentation" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/docs
 * Trigger a scan and generate documentation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: projectPath, action } = body as {
      path: string;
      action: "scan";
    };

    if (!projectPath) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    if (action !== "scan") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // For now, return a mock response since we'll integrate with CLI later
    // In a real implementation, this would call the scanner and generator
    return NextResponse.json({
      success: true,
      generated: 0,
      updated: 0,
      skipped: 0,
      message: "Scan functionality will be integrated with CLI",
    });
  } catch (error) {
    console.error("Failed to scan:", error);
    return NextResponse.json(
      { error: "Failed to scan codebase" },
      { status: 500 }
    );
  }
}
