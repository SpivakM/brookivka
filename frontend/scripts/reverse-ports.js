const { execSync } = require('child_process');

const PORTS = [8081, 8082]; // Прокидаємо і Metro (8081), і backend (8082)

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
    PORTS.forEach(port => {
      try {
        execSync(`adb -s ${device} reverse tcp:${port} tcp:${port}`);
        console.log(`✅ ADB: Port ${port} reversed for ${device}`);
      } catch (e) {
        console.error(`❌ ADB: Failed to reverse port ${port} for ${device}`);
      }
    });
  });
} catch (error) {
  console.error('ADB Execution Error:', error.message);
}