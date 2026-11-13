const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const envPath = path.resolve(__dirname, '../.env');
const prodEnvPath = path.resolve(__dirname, '../.env.production');

// 1. Знаходимо локальний IPv4 в мережі (як було в твоєму оригінальному скрипті)
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
          return iface.address;
        }
      }
    }
  }
  return '10.0.2.2';
}

// 2. Перевіряємо за 1 секунду, чи піднятий локальний Docker-бекенд на 8082 порту
function checkLocalBackend() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8082/api/landmarks/nearby?lat=49.8418&lng=24.0316&radius=10', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 3. Допоміжна функція для оновлення або додавання API_URL у .env (не затираючи інші змінні, якщо вони там є)
function writeEnvFile(targetApiUrl) {
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  if (content.match(/^API_URL=.*/m)) {
    content = content.replace(/^API_URL=.*/m, `API_URL=${targetApiUrl}`);
  } else {
    content = content.trim() ? `${content.trim()}\nAPI_URL=${targetApiUrl}\n` : `API_URL=${targetApiUrl}\n`;
  }

  fs.writeFileSync(envPath, content, 'utf8');
}

async function run() {
  const isLocalRunning = await checkLocalBackend();

  if (isLocalRunning) {
    // Локальний Docker працює -> беремо локальний IP
    const localIp = getLocalIpAddress();
    const localUrl = `http://${localIp}:8082`;
    writeEnvFile(localUrl);
    console.log(`🚀 [setup-env] Local Docker detected! API_URL set to: ${localUrl}`);
  } else if (fs.existsSync(prodEnvPath)) {
    // Локальний Docker вимкнений -> шукаємо URL у .env.production
    const prodContent = fs.readFileSync(prodEnvPath, 'utf8');
    const match = prodContent.match(/^API_URL=(.+)$/m);

    if (match && match[1] && match[1].trim()) {
      const cloudUrl = match[1].trim();
      writeEnvFile(cloudUrl);
      console.log(`☁️ [setup-env] Local Docker is offline. Using Cloud API_URL: ${cloudUrl}`);
    } else {
      // Якщо .env.production пустий — фолбек на локальний IP
      const localIp = getLocalIpAddress();
      const localUrl = `http://${localIp}:8082`;
      writeEnvFile(localUrl);
      console.log(`⚠️ [setup-env] .env.production is empty. Fallback to local API_URL: ${localUrl}`);
    }
  } else {
    // Якщо файлу .env.production взагалі немає -> стандартний локальний IP
    const localIp = getLocalIpAddress();
    const localUrl = `http://${localIp}:8082`;
    writeEnvFile(localUrl);
    console.log(`🚀 [setup-env] Dynamic API_URL detected: ${localUrl}`);
  }
}

run();