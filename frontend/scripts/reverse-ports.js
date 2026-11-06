const { execSync } = require('child_process');

const BACKEND_PORT = 8082; // Твій порт бекенду

try {
  const output = execSync('adb devices').toString();
  const lines = output.split('\n').slice(1);
  
  const devices = lines
    .map(line => line.split('\t')[0].trim())
    .filter(device => device.length > 0 && !device.startsWith('*'));

  if (devices.length === 0) {
    console.log('⚠️ ADB: No active devices or emulators found.');
    process.exit(0);
  }

  devices.forEach(device => {
    try {
      execSync(`adb -s ${device} reverse tcp:${BACKEND_PORT} tcp:${BACKEND_PORT}`);
      console.log(`✅ ADB: Port ${BACKEND_PORT} successfully reversed for device ${device}`);
    } catch (e) {
      console.error(`❌ ADB: Failed to reverse port ${BACKEND_PORT} for device ${device}`);
    }
  });
} catch (error) {
  console.error('ADB Execution Error:', error.message);
}