export function itemDetailPath(assetId: string) {
  return `/items/${encodeURIComponent(assetId)}`;
}

export function kitDetailPath(assetId: string) {
  return `/kits/${encodeURIComponent(assetId)}`;
}

export function itemEditPath(assetId: string) {
  return `${itemDetailPath(assetId)}/edit`;
}

export function itemMovePath(assetId: string) {
  return `${itemDetailPath(assetId)}/move`;
}

export function kitReturnPath(assetId: string) {
  return `${kitDetailPath(assetId)}/return`;
}

export function itemLabelPath(assetId: string) {
  return `/labels/${encodeURIComponent(assetId)}`;
}

export function kitLabelPath(assetId: string) {
  return `/labels/kits/${encodeURIComponent(assetId)}`;
}

export function itemScanPath(assetId: string) {
  return `/scan/${encodeURIComponent(assetId)}`;
}

export function buildQrCodeValue(assetId: string) {
  return itemScanPath(assetId);
}

export function normalizeAppOrigin(origin?: string | null) {
  return (origin ?? "http://localhost:3000").replace(/\/$/, "");
}

export function buildPublicAppUrl(path: string, origin?: string | null) {
  const normalizedOrigin = normalizeAppOrigin(origin ?? process.env.NEXT_PUBLIC_APP_URL);
  return `${normalizedOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPublicScanUrl(assetId: string, origin?: string | null) {
  return buildPublicAppUrl(itemScanPath(assetId), origin);
}

export function isLoopbackOrigin(origin?: string | null) {
  const normalizedOrigin = normalizeAppOrigin(origin ?? process.env.NEXT_PUBLIC_APP_URL);
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(normalizedOrigin);
}

export function isLocalhostAppUrl() {
  return isLoopbackOrigin(process.env.NEXT_PUBLIC_APP_URL);
}

export function chooseReachableOrigin(requestOrigin?: string | null) {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL;
  const vercelOrigin =
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : null;

  if (envOrigin && !isLoopbackOrigin(envOrigin)) {
    return normalizeAppOrigin(envOrigin);
  }

  if (requestOrigin && !isLoopbackOrigin(requestOrigin)) {
    return normalizeAppOrigin(requestOrigin);
  }

  if (vercelOrigin && !isLoopbackOrigin(vercelOrigin)) {
    return normalizeAppOrigin(vercelOrigin);
  }

  return normalizeAppOrigin(requestOrigin ?? envOrigin ?? vercelOrigin);
}

export function isUsingFallbackOrigin(requestOrigin?: string | null) {
  const resolved = chooseReachableOrigin(requestOrigin);
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL;

  return !envOrigin || normalizeAppOrigin(envOrigin) !== resolved;
}

export function describeScanReachability(requestOrigin?: string | null) {
  const resolvedOrigin = chooseReachableOrigin(requestOrigin);
  const resolvedIsLoopback = isLoopbackOrigin(resolvedOrigin);

  return {
    resolvedOrigin,
    resolvedIsLoopback,
    needsLanHostForPhone: resolvedIsLoopback,
  };
}
