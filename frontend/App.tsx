import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AnimatedSplashScreen } from './src/shared/components/AnimatedSplashScreen';

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});