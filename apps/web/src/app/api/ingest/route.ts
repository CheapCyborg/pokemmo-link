import { SCHEMAS } from "@/types/pokemon";
import { NextResponse } from "next/server";

import fs from "fs/promises";
import path from "path";
import z from "zod";

export async function POST(request: Request) {
  try {
    const rawData = await request.json();

    // Support both standard dumps (party/daycare) and PC box dumps
    const IngestSchema = z.union([SCHEMAS.dump, SCHEMAS.pcDump]);
    const validatedData = IngestSchema.parse(rawData);

    const containerType = validatedData.source?.container_type || "unknown";

    // Determine filename based on container type
    // "party" -> dump-party.json
    // "daycare" -> dump-daycare.json
    // "pc_boxes" -> dump-pc_boxes.json
    const filename = `dump-${containerType}.json`;
    const filePath = path.join(process.cwd(), "data", filename);

    await fs.writeFile(
      filePath,
      JSON.stringify(validatedData, null, 2),
      "utf-8"
    );
    return NextResponse.json({
      success: true,
      message: `Data ingested for ${containerType}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "Validation Error:",
        JSON.stringify(error.format(), null, 2)
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          issues: error.issues,
        },
        { status: 400 }
      );
    }
    console.error("Error ingesting data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to ingest data" },
      { status: 500 }
    );
  }
}
