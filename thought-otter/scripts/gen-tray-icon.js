// Generate tray icon PNG data URL
const zlib = require("zlib");

function createPNG(w, h, pixels) {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    pixels.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw);

  function crc(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0); }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const t = Buffer.from(type);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, c]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const S = 16, R = 7;
const pixels = Buffer.alloc(S * S * 4, 0);
for (let y = 0; y < S; y++)
  for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    if ((x - 8) ** 2 + (y - 8) ** 2 <= R * R) {
      pixels[i] = 0xe8; pixels[i + 1] = 0x8a; pixels[i + 2] = 0x3a; pixels[i + 3] = 0xff;
    }
  }

const png = createPNG(S, S, pixels);
console.log("data:image/png;base64," + png.toString("base64"));
