import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outputDir) {
  throw new Error("MAKEFUN_OUTPUT_DIR is not set");
}

const data = fs.readFileSync(inputPath);

// Validate PNG signature (8 bytes: 89 50 4E 47 0D 0A 1A 0A).
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (data.length < 8 || !data.subarray(0, 8).equals(PNG_SIGNATURE)) {
  throw new Error("entry.png is not a valid PNG file (bad signature)");
}

// Validate IHDR dimensions: width/height are big-endian uint32 at bytes 16/20.
if (data.length < 24 || data.toString("ascii", 12, 16) !== "IHDR") {
  throw new Error("entry.png is missing a valid IHDR chunk");
}
const width = data.readUInt32BE(16);
const height = data.readUInt32BE(20);
if (width > 1024 || height > 1024 || width === 0 || height === 0) {
  throw new Error(`entry.png dimensions ${width}x${height} exceed the 1024x1024 maximum`);
}
console.log(`entry.png dimensions: ${width}x${height}`);

// Enforce the competition size cap of 1,048,576 bytes.
if (data.length > 1048576) {
  throw new Error(`entry.png is ${data.length} bytes, over the 1,048,576 byte limit`);
}
const outputPath = path.join(outputDir, "entry.png");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, data);

const sha256 = crypto.createHash("sha256").update(data).digest("hex");
console.log(`entry.png: ${data.length} bytes, sha256=${sha256}`);
console.log(`wrote ${outputPath}`);
