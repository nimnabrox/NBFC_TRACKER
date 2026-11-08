// Generated from VERSION by scripts/version.mjs.
export const version = "0.1.0";
export const displayVersion = "v0.1.0";
export const releaseUrl = "https://github.com/nimnabrox/NBFC_TRACKER/releases/tag/v0.1.0";
export function compareVersions(a, b) {
  const left = String(a).replace(/^v/i, '').split('.').map(Number);
  const right = String(b).replace(/^v/i, '').split('.').map(Number);
  if (left.length !== 3 || right.length !== 3 || [...left, ...right].some(n => !Number.isInteger(n) || n < 0)) throw new Error('Invalid version');
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1;
  return 0;
}
