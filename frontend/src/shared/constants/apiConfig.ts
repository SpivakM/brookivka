import Config from 'react-native-config';

export const API_BASE_URL = Config.API_URL || '';

if (!API_BASE_URL) {
  console.warn('[API Config] WARNING: API_URL is undefined in react-native-config!');
} else {
  console.log('[API Config] Dynamically loaded API_URL:', API_BASE_URL);
}