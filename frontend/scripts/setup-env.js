const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const envPath = path.resolve(__dirname, '../.env');
const prodEnvPath = path.resolve(__dirname, '../.env.production');

// 1. Знаходимо реальний IPv4 ноута в локальній мережі (ігноруючи віртуальні інтерфейси WSL/Docker/Hyper-V)
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const virtualKeywords = ['vethernet', 'wsl', 'hyper-v', 'docker', 'vmware', 'virtualbox', 'loopback', 'bluetooth'];
  const preferredKeywords = ['wi-fi', 'wifi', 'wlan', 'безпроводная', 'бездротова', 'ethernet'];

  let preferredIp = null;
  let fallbackIp = null;

  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    const isVirtual = virtualKeywords.some((kw) => lowerName.includes(kw));
    const isPreferred = preferredKeywords.some((kw) => lowerName.includes(kw));

    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isPrivate =
          iface.address.startsWith('192.168.') ||
          iface.address.startsWith('10.') ||
          iface.address.startsWith('172.');

        if (!isPrivate || isVirtual) continue;

        if (isPreferred) {
          preferredIp = iface.address;
          break;
        }
        if (!fallbackIp) {
          fallbackIp = iface.address;
        }
      }
    }
    if (preferredIp) break;
  }

  return preferredIp || fallbackIp || '10.0.2.2';
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

// 3. Оновлюємо API_URL у .env
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
    const localIp = getLocalIpAddress();
    const localUrl = `http://${localIp}:8082`;
    writeEnvFile(localUrl);
    console.log(`🚀 [setup-env] Local Docker detected! API_URL set to: ${localUrl}`);
  } else if (fs.existsSync(prodEnvPath)) {
    const prodContent = fs.readFileSync(prodEnvPath, 'utf8');
    const match = prodContent.match(/^API_URL=(.+)$/m);

    if (match && match[1] && match[1].trim()) {
      const cloudUrl = match[1].trim();
      writeEnvFile(cloudUrl);
      console.log(`☁️ [setup-env] Local Docker is offline. Using Cloud API_URL: ${cloudUrl}`);
    } else {
      const localIp = getLocalIpAddress();
      const localUrl = `http://${localIp}:8082`;
      writeEnvFile(localUrl);
      console.log(`⚠️ [setup-env] .env.production is empty. Fallback to local API_URL: ${localUrl}`);
    }
  } else {
    const localIp = getLocalIpAddress();
    const localUrl = `http://${localIp}:8082`;
    writeEnvFile(localUrl);
    console.log(`🚀 [setup-env] Dynamic API_URL detected: ${localUrl}`);
  }
}

run();