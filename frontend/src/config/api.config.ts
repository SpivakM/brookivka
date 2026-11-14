import { Platform } from 'react-native';
import Config from 'react-native-config';
import { API_BASE_URL } from '../shared/constants/apiConfig';

export const API_CONFIG = {
  baseUrl:
    API_BASE_URL ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:8082' : 'http://localhost:8082'),
  googleMapsApiKey: Config.GOOGLE_MAPS_API_KEY || '',
};