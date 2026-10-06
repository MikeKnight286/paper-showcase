import os from 'os';

export function getLanIp(): string | null {
  // Honour explicit env override first
  if (process.env.NEXT_PUBLIC_LAN_IP) return process.env.NEXT_PUBLIC_LAN_IP;

  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    // Skip loopback, Docker bridge, and common virtual adapters by name prefix
    if (/^(lo|docker|vmnet|veth|virbr|br-|utun|awdl)/.test(name.toLowerCase())) continue;
    for (const iface of interfaces[name] ?? []) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        !iface.address.startsWith('169.254.') // APIPA — no real DHCP
      ) {
        return iface.address;
      }
    }
  }
  return null;
}
