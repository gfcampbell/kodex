import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeItem, updateKnowledgeItem, saveDocMarkdown } from "@/lib/storage";

/**
 * POST /api/regenerate
 * Regenerate a single documentation item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: projectPath, itemId } = body as {
      path: string;
      itemId: string;
    };

    if (!projectPath) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Get the existing item
    const existingItem = await getKnowledgeItem(projectPath, itemId);

    if (!existingItem) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // For now, return a mock response
    // In a real implementation, this would call regenerateSingleDoc from CLI
    // which would re-scan the relevant source files and regenerate the content
    
    const updatedItem = await updateKnowledgeItem(projectPath, itemId, {
      generatedAt: new Date().toISOString(),
      status: "draft",
      humanEdited: false,
    });

    if (updatedItem) {
      await saveDocMarkdown(projectPath, updatedItem);
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: "Regeneration will be integrated with CLI generator",
    });
  } catch (error) {
    console.error("Failed to regenerate:", error);
    return NextResponse.json(
      { error: "Failed to regenerate document" },
      { status: 500 }
    );
  }
}
