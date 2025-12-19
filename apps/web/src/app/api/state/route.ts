import type { ContainerType, DumpEnvelope } from "@/types/pokemon";
import {
  CONTAINER_TYPES,
  DumpEnvelopeSchema,
  PcDumpEnvelopeSchema,
} from "@/types/pokemon";
import fs from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceParam = searchParams.get("source") || "party";

    // Validate source is a valid ContainerType
    const source: ContainerType = CONTAINER_TYPES.includes(
      sourceParam as ContainerType
    )
      ? (sourceParam as ContainerType)
      : "party"; // Default to party if invalid

    const filename = `dump-${source}.json`;
    const filePath = path.join(process.cwd(), "data", filename);

    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const rawData = JSON.parse(fileContent);

      // Validate based on source type
      const validated =
        source === "pc_boxes"
          ? PcDumpEnvelopeSchema.parse(rawData)
          : DumpEnvelopeSchema.parse(rawData);

      return NextResponse.json(validated);
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
