import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';

import { EntryScreen } from '../modules/home/screens/EntryScreen';
import { ARScannerScreen } from '../modules/ar-scanner/screens/ARScannerScreen';
import { MapScreen } from '../modules/map-routes/screens/MapScreen';
import { LandmarksScreen } from '../modules/landmarks/screens/LandmarksScreen';
import { AIGuideScreen } from '../modules/ai-guide/screens/AIGuideScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Entry" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Entry" component={EntryScreen} />
      <Stack.Screen name="ARScanner" component={ARScannerScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Landmarks" component={LandmarksScreen} />
      <Stack.Screen name="AIGuide" component={AIGuideScreen} />
    </Stack.Navigator>
  );
};