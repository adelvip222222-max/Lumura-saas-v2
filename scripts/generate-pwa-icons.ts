import sharp from "sharp";
import path from "path";
import fs from "fs";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const candidateFiles = [
  path.join(PUBLIC_DIR, "loglo1.png"),
  path.join(PUBLIC_DIR, "logo.png"),
  path.join(PUBLIC_DIR, "logo2.png"),
];

async function generateIcons() {
  let sourceFile = "";
  for (const file of candidateFiles) {
    if (fs.existsSync(file)) {
      try {
        // Test if sharp can read it
        await sharp(file).metadata();
        sourceFile = file;
        console.log(`Found readable source file: ${file}`);
        break;
      } catch (err) {
        console.warn(`File ${file} is not readable by sharp: ${(err as Error).message}`);
      }
    }
  }

  if (!sourceFile) {
    console.error("❌ No readable logo file found in public folder!");
    process.exit(1);
  }

  console.log(`⏳ Generating PWA icons from source: ${sourceFile}`);
  try {
    // Ensure public directory exists
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    // 192x192 icon
    await sharp(sourceFile)
      .resize(192, 192, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFile(path.join(PUBLIC_DIR, "icon-192.png"));
    console.log("✅ Successfully generated icon-192.png");

    // 512x512 icon
    await sharp(sourceFile)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFile(path.join(PUBLIC_DIR, "icon-512.png"));
    console.log("✅ Successfully generated icon-512.png");

    // Maskable 192x192 icon
    await sharp(sourceFile)
      .resize(192, 192, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFile(path.join(PUBLIC_DIR, "icon-192-maskable.png"));
    console.log("✅ Successfully generated icon-192-maskable.png");

    // Maskable 512x512 icon
    await sharp(sourceFile)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFile(path.join(PUBLIC_DIR, "icon-512-maskable.png"));
    console.log("✅ Successfully generated icon-512-maskable.png");
  } catch (error) {
    console.error("❌ Error generating icons:", error);
    process.exit(1);
  }
}

generateIcons();
