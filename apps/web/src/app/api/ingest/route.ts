import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const containerType = body.source?.container_type || "unknown";

    // Determine filename based on container type
    // "party" -> dump-party.json
    // "daycare" -> dump-daycare.json
    // "pc_box" -> dump-pc_box.json
    const filename = `dump-${containerType}.json`;
    const filePath = path.join(process.cwd(), "data", filename);

    await fs.writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: `Data ingested for ${containerType}`,
    });
  } catch (error) {
    console.error("Error ingesting data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to ingest data" },
      { status: 500 }
    );
  }
}
