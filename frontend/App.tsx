import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AnimatedSplashScreen } from './src/shared/components/AnimatedSplashScreen';
import { ThemeProvider } from './src/shared/context/ThemeContext';
import { AuthProvider } from './src/shared/context/AuthContext';
import { AlertProvider } from './src/shared/context/AlertContext';

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AlertProvider>
            <View style={styles.root}>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>

              {isSplashVisible && (
                <AnimatedSplashScreen
                  onAnimationFinish={() => setIsSplashVisible(false)}
                />
              )}
            </View>
          </AlertProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});