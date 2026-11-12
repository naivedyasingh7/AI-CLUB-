import { TextureLoader, SRGBColorSpace } from "three";
import logo from "../../public/img/svg/ai-club-logo-custom.svg?raw";
import { POSTER_SPEC } from "./eventModel.js";

const textures = new Map();
const escape = (value) =>
  String(value || "To be announced").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char],
  );
const embeddedLogo = `data:image/svg+xml;base64,${btoa(logo)}`;

export function defaultBadgeFace(title) {
  const words = String(title || "To be announced").split(/\s+/),
    lines = [];
  for (const word of words) {
    if (lines.length && `${lines.at(-1)} ${word}`.length <= 23)
      lines[lines.length - 1] += ` ${word}`;
    else lines.push(word);
  }
  const text = lines
    .slice(0, 3)
    .map(
      (line, i) =>
        `<text x="410" y="${790 + i * 55}">${escape(line.slice(0, 26))}</text>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_SPEC.width}" height="${POSTER_SPEC.height}" viewBox="0 0 820 1070"><rect width="820" height="1070" fill="#000000"/><image x="160" y="160" width="500" height="500" href="${embeddedLogo}"/><g fill="#E9F7FC" font-family="Arial,sans-serif" font-size="43" text-anchor="middle">${text}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function badgeTexture(url, fallback, id) {
  const key = `${url || ""}|${fallback}`;
  if (!textures.has(key)) {
    const loader = new TextureLoader();
    const pending = loader
      .loadAsync(url || fallback)
      .catch(() => {
        if (import.meta.env.DEV)
          console.warn(
            `${id}: "poster" could not load. Using the default logo and title.`,
          );
        return loader.loadAsync(fallback);
      })
      .then((texture) => {
        texture.colorSpace = SRGBColorSpace;
        return texture;
      });
    textures.set(key, pending);
  }
  return textures.get(key);
}

export function badgeMaps(front, back, fallback, id) {
  const key = `pair|${front || ""}|${back || ""}|${fallback}`;
  if (!textures.has(key))
    textures.set(
      key,
      Promise.all([
        badgeTexture(front, fallback, id),
        badgeTexture(back, fallback, id),
      ]),
    );
  return textures.get(key);
}

if (import.meta.hot)
  import.meta.hot.dispose(() => {
    for (const [key, pending] of textures)
      if (!key.startsWith("pair|"))
        pending.then((texture) => texture.dispose());
    textures.clear();
  });
