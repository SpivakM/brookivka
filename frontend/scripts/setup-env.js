const fs = require('fs');
const os = require('os');

function getDynamicIp() {
  const interfaces = os.networkInterfaces();
  
  let homeIp = null;

  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    
    // 1. Повністю відсікаємо віртуальні та службові адаптери Docker / WSL / Radmin
    if (
      lowerName.includes('radmin') || 
      lowerName.includes('hamachi') || 
      lowerName.includes('vbox') || 
      lowerName.includes('vethernet') ||
      lowerName.includes('virtual') ||
      lowerName.includes('hotspot') ||
      lowerName.includes('docker') ||
      lowerName.includes('wsl')
    ) {
      continue;
    }

    for (const iface of interfaces[name]) {
      // Шукаємо тільки активні IPv4 адреси
      if (iface.family === 'IPv4' && !iface.internal) {
        
        // Ігноруємо підмережу Hotspot Windows
        if (iface.address.startsWith('192.168.137.')) {
          continue;
        }

        // Пріоритет №1: Стандартна домашня мережа (192.168.x.x)
        if (iface.address.startsWith('192.168.')) {
          homeIp = iface.address;
          break;
        }
      }
    }
    if (homeIp) break;
  }

  // Якщо ми вдома (є 192.168.x.x) — віддаємо її.
  // Якщо ми в універі (10.x.x.x) або без Wi-Fi — віддаємо 127.0.0.1, 
  // щоб емулятор працював через ADB reverse без мережевих завад.
  return homeIp || '127.0.0.1';
}

const targetIp = getDynamicIp();
const envContent = `API_URL=http://${targetIp}:8082\n`;

// Записуємо у всі можливі env-файли проєкту
fs.writeFileSync('.env', envContent);
fs.writeFileSync('.env.development', envContent);

console.log(`\n🚀 [setup-env] Dynamic API_URL detected: http://${targetIp}:8082`);