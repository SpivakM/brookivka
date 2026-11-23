import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import { EntryScreen } from '../modules/home/screens/EntryScreen';
import { ARScannerScreen } from '../modules/ar-scanner/screens/ARScannerScreen';
import { MapScreen } from '../modules/map-routes/screens/MapScreen';
import { LandmarksScreen } from '../modules/landmarks/screens/LandmarkScreen';
import { AIGuideScreen } from '../modules/ai-guide/screens/AIGuideScreen';
import { SettingsScreen } from '../modules/settings/screens/SettingsScreen';
import { RegisterScreen } from '../modules/auth/screens/RegisterScreen';
import { LoginScreen } from '../modules/auth/screens/LoginScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Entry" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Entry" component={EntryScreen} />
      <Stack.Screen name="ARScanner" component={ARScannerScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Landmarks" component={LandmarksScreen} />
      <Stack.Screen name="AIGuide" component={AIGuideScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};