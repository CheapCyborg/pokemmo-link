const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "../output/packet-discovery.log");

if (!fs.existsSync(logPath)) {
  console.log("Log file not found:", logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, "utf8");
const lines = content.split("\n");

let currentPacket = null;
let inPartyPacket = false;
let currentSlot = -1;
let currentMon = {};
let partyData = [];

// Regex to match indentation and key-value
const lineRegex = /^(\s*)([^:]+): (.+)$/;
const packetStartRegex = /^PACKET #(\d+): (f\.FQ0)/; // Only look for f.FQ0 (Party/PC)

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check for new packet start
  const packetMatch = line.match(packetStartRegex);
  if (packetMatch) {
    inPartyPacket = true;
    currentPacket = { id: packetMatch[1], mons: [] };
    partyData.push(currentPacket);
    currentSlot = -1;
    continue;
  }

  if (!inPartyPacket) continue;

  // Check if we left the packet (heuristic: indentation 0 and not a property of the packet)
  // But the log format is recursive, so we just look for the next packet start or end of file.
  // Actually, let's just parse everything until the next packet start.

  // We are looking for "jH1" which indicates a Pokemon wrapper
  if (line.includes("jH1") && line.includes("{")) {
    // New mon found (roughly)
    currentSlot++;
    currentMon = {
      slot: currentSlot,
      flags: null,
      variant: null,
      species: null,
    };
    currentPacket.mons.push(currentMon);
  }

  // Extract fields if we are inside a mon
  if (currentSlot >= 0) {
    const trimmed = line.trim();
    if (trimmed.startsWith("U30:")) {
      currentMon.flags = trimmed.split(":")[1].trim();
    }
    if (trimmed.startsWith("sW:")) {
      currentMon.variant = trimmed.split(":")[1].trim();
    }
    if (trimmed.startsWith("QW0:")) {
      currentMon.species = trimmed.split(":")[1].trim();
    }
    if (trimmed.startsWith("kr0:")) {
      currentMon.ot = trimmed.split(":")[1].trim();
    }
  }
}

// Print the last few packets
const lastPackets = partyData.slice(-3);
lastPackets.forEach((p) => {
  console.log(`\nPacket [${p.id}] f.FQ0:`);
  if (p.mons.length === 0) {
    console.log("  (No Pokemon data found in this packet)");
  }
  p.mons.forEach((m) => {
    // Only show if we found some data
    if (m.species || m.flags || m.variant) {
      console.log(
        `  Slot ${m.slot}: Species=${m.species}, Flags(U30)=${m.flags}, Variant(sW)=${m.variant}, OT=${m.ot}`
      );

      // Decode Flags
      if (m.flags) {
        const flags = BigInt(m.flags);
        const isShinyA = (flags & 65536n) !== 0n;
        const isShinyB = (flags & 67108864n) !== 0n;
        const isGift = (flags & 2097152n) !== 0n;
        console.log(
          `    -> Shiny(Bit16)=${isShinyA}, Shiny(Bit26)=${isShinyB}, Gift(Bit21)=${isGift}`
        );
      }
    }
  });
});
