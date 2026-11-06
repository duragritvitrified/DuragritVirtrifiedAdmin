import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height) {
  // RGBA buffer with filter byte 0 at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded rect / shield bounds
      const cornerR = width * 0.18;
      const inBox = Math.abs(dx) <= cx - cornerR && Math.abs(dy) <= cy - cornerR;
      const inCornerX = Math.abs(dx) > cx - cornerR;
      const inCornerY = Math.abs(dy) > cy - cornerR;
      let inside = false;

      if (inBox) {
        inside = true;
      } else if (inCornerX && inCornerY) {
        const cdx = Math.abs(dx) - (cx - cornerR);
        const cdy = Math.abs(dy) - (cy - cornerR);
        inside = (cdx * cdx + cdy * cdy) <= cornerR * cornerR;
      } else {
        inside = true;
      }

      if (inside) {
        // Gold border check
        const isBorder = (dist >= radius - 8 && dist <= radius);
        // Center DG monogram block approximation
        const isCenterGold = (Math.abs(dx) < width * 0.22 && Math.abs(dy) < height * 0.18);

        if (isBorder || isCenterGold) {
          // Gold / Amber
          rawData[pixelOffset] = 217;     // R
          rawData[pixelOffset + 1] = 119; // G
          rawData[pixelOffset + 2] = 6;   // B
          rawData[pixelOffset + 3] = 255; // A
        } else {
          // DuraGrit Maroon gradient
          const factor = (y / height) * 0.4;
          rawData[pixelOffset] = Math.round(139 * (1 - factor)); // R: 139 -> 83
          rawData[pixelOffset + 1] = 0;                         // G: 0
          rawData[pixelOffset + 2] = 0;                         // B: 0
          rawData[pixelOffset + 3] = 255;                       // A
        }
      } else {
        // Transparent outside
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace: None

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    // CRC32 calculation
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (crc ^ byte) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xEDB88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ -1);
  }

  const compressed = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const icon192 = createPNG(192, 192);
fs.writeFileSync('e:/AI Projects/Duragrit Vitrified/public/icon-192.png', icon192);
console.log('Created icon-192.png (' + icon192.length + ' bytes)');

const icon512 = createPNG(512, 512);
fs.writeFileSync('e:/AI Projects/Duragrit Vitrified/public/icon-512.png', icon512);
console.log('Created icon-512.png (' + icon512.length + ' bytes)');
