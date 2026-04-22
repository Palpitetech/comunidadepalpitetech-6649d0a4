export function maskIp(ip: string | null | undefined, fallback = "—"): string {
  if (!ip) return fallback;
  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.xxx.xxx.${parts[3]}`;
}
