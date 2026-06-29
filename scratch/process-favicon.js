const { Jimp } = require("jimp");
const path = require("path");

async function main() {
  const inputPath = "C:\\Users\\T14s\\.gemini\\antigravity-ide\\brain\\e7d0d155-b253-4932-94d5-2366b9d4d51f\\orin_favicon_1782717626001.png";
  const outputPath = "c:\\Users\\T14s\\Desktop\\blog-website\\src\\app\\icon.png";

  console.log("Loading image from:", inputPath);
  const image = await Jimp.read(inputPath);

  console.log("Resizing to 512x512");
  image.resize({ w: 512, h: 512 });

  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width / 2 - 2; // slight margin

  console.log("Applying circular mask for transparency");

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > radius) {
        // Make background transparent
        image.setPixelColor(0x00000000, x, y);
      } else if (distance > radius - 1.5) {
        // Antialiasing: blend edge pixels
        const color = image.getPixelColor(x, y);
        const alpha = Math.max(0, Math.floor((radius - distance) * 255));
        
        // Extract RGB
        const r = (color >> 24) & 0xff;
        const g = (color >> 16) & 0xff;
        const b = (color >> 8) & 0xff;
        
        // Construct new 32-bit RGBA color
        const newColor = ((r << 24) | (g << 16) | (b << 8) | alpha) >>> 0;
        image.setPixelColor(newColor, x, y);
      }
    }
  }

  console.log("Saving processed rounded icon to:", outputPath);
  await image.write(outputPath);
  console.log("Success!");
}

main().catch(console.error);
