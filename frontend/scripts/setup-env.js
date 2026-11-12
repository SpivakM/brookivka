const fs = require('fs');
const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  
  let fallbackIp = null;

  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    
    // Фільтруємо віртуальні адаптери, Radmin, Hamachi та Windows Hotspot
    if (
      lowerName.includes('radmin') || 
      lowerName.includes('hamachi') || 
      lowerName.includes('vbox') || 
      lowerName.includes('vethernet') ||
      lowerName.includes('virtual') ||
      lowerName.includes('hotspot')
    ) {
      continue;
    }

    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Ігноруємо підмережу Windows Hotspot (192.168.137.x)
        if (iface.address.startsWith('192.168.137.')) {
          continue;
        }

        // Перевага надається стандартним Wi-Fi / Ethernet адресам (192.168.x.x або 10.x.x.x)
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }

        fallbackIp = iface.address;
      }
    }
  }

  return fallbackIp || '127.0.0.1';
}

const localIp = getLocalIp();
const envContent = `API_URL=http://${localIp}:8082\n`;

fs.writeFileSync('.env', envContent);
fs.writeFileSync('.env.development', envContent);

console.log(`[setup-env] Correct IP generated: http://${localIp}:8082`);