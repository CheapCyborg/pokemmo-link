import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { DumpEnvelope } from "@/types/pokemon";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "party"; // Default to party

    const filename = `dump-${source}.json`;
    const filePath = path.join(process.cwd(), "data", filename);

    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(fileContent);
      return NextResponse.json(data);
    } catch (error: unknown) {
      // If file doesn't exist, return a default empty structure
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "ENOENT"
      ) {
        const emptyState: DumpEnvelope = {
          schema_version: 1,
          captured_at_ms: Date.now(),
          source: {
            packet_class: "unknown",
            container_id: 0,
            container_type: source,
          },
          pokemon: [],
        };
        return NextResponse.json(emptyState);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error reading state:", error);
    return NextResponse.json(
      { success: false, message: "Failed to read state" },
      { status: 500 }
    );
  }
}
