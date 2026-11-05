const PORT = '8082';

/**
 * Завдяки ADB Reverse (`adb reverse tcp:8082 tcp:8082`) 
 * і фізичний Android-телефон, і емулятор, і iOS-симулятор 
 * стукають на комп'ютер через єдиний localhost!
 */
const getBaseUrl = (): string => {
  if (!__DEV__) {
    return 'https://api.brookivka.com'; // Продакшн сервер
  }

  return `http://localhost:${PORT}`;
};

export const API_BASE_URL = getBaseUrl();