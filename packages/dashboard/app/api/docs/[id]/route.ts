import { NextRequest, NextResponse } from "next/server";
import {
  getKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  saveDocMarkdown,
} from "@/lib/storage";
import type { KnowledgeItem } from "@kodex/shared";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/docs/[id]?path=...
 * Get a single documentation item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const projectPath = searchParams.get("path");

  if (!projectPath) {
    return NextResponse.json(
      { error: "Path parameter is required" },
      { status: 400 }
    );
  }

  try {
    const item = await getKnowledgeItem(projectPath, id);

    if (!item) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to get doc:", error);
    return NextResponse.json(
      { error: "Failed to get document" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/docs/[id]
 * Update a documentation item
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { path: projectPath, updates } = body as {
      path: string;
      updates: Partial<KnowledgeItem>;
    };

    if (!projectPath) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    // Mark as human edited if content changed
    if (updates.content) {
      updates.humanEdited = true;
    }

    const item = await updateKnowledgeItem(projectPath, id, updates);

    if (!item) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Save markdown file
    await saveDocMarkdown(projectPath, item);

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to update doc:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/docs/[id]
 * Delete a documentation item
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const projectPath = searchParams.get("path");

  if (!projectPath) {
    return NextResponse.json(
      { error: "Path parameter is required" },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteKnowledgeItem(projectPath, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete doc:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
