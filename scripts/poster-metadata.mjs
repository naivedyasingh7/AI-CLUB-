import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export function imageSize(data, filename) {
  if (/\.svg$/i.test(filename)) {
    const tag = data.toString("utf8").match(/<svg\b[^>]*>/i)?.[0] || "";
    const width = Number(tag.match(/\bwidth=["']([\d.]+)(?:px)?["']/)?.[1]);
    const height = Number(tag.match(/\bheight=["']([\d.]+)(?:px)?["']/)?.[1]);
    if (width && height) return { width, height };
    const view = tag.match(
      /viewBox=["']\s*[\d.-]+[ ,]+[\d.-]+[ ,]+([\d.]+)[ ,]+([\d.]+)/,
    );
    if (view) return { width: +view[1], height: +view[2] };
  }
  if (
    data.length >= 24 &&
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  if (
    data.length >= 30 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  ) {
    const kind = data.toString("ascii", 12, 16);
    if (kind === "VP8X")
      return {
        width: 1 + data.readUIntLE(24, 3),
        height: 1 + data.readUIntLE(27, 3),
      };
    if (kind === "VP8 ")
      return {
        width: data.readUInt16LE(26) & 16383,
        height: data.readUInt16LE(28) & 16383,
      };
    if (kind === "VP8L") {
      const bits = data.readUInt32LE(21);
      return { width: (bits & 16383) + 1, height: ((bits >>> 14) & 16383) + 1 };
    }
  }
  if (data.length > 4 && data[0] === 255 && data[1] === 216) {
    let offset = 2;
    while (offset + 8 < data.length) {
      if (data[offset] !== 255) {
        offset++;
        continue;
      }
      const marker = data[offset + 1],
        length = data.readUInt16BE(offset + 2);
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker)
      )
        return {
          width: data.readUInt16BE(offset + 7),
          height: data.readUInt16BE(offset + 5),
        };
      if (length < 2) break;
      offset += length + 2;
    }
  }
  return null;
}

export async function readPosters(directory) {
  const names = await readdir(directory);
  return Object.fromEntries(
    await Promise.all(
      names
        .filter((name) => /\.(webp|png|jpe?g|svg)$/i.test(name))
        .map(async (name) => {
          const bytes = await readFile(join(directory, name));
          let size;
          try {
            size = imageSize(bytes, name);
          } catch {
            size = null;
          }
          return [
            name,
            {
              ...size,
              bytes: bytes.length,
              invalid: !size || !size.width || !size.height,
            },
          ];
        }),
    ),
  );
}
