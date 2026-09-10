function readPort(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/** Next.js 站点。不用 3000，避免和本机其它服务抢端口。 */
export const SITE_PORT = readPort("SITE_PORT", 3100);

/** 文章工坊。不用 8787，避免和本机其它服务抢端口。 */
export const STUDIO_PORT = readPort("STUDIO_PORT", 4310);

export const STUDIO_HOST = "127.0.0.1";
export const SITE_ORIGIN = `http://127.0.0.1:${SITE_PORT}`;
export const STUDIO_ORIGIN = `http://${STUDIO_HOST}:${STUDIO_PORT}`;
