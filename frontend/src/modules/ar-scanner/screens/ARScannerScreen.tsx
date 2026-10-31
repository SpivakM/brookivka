import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export const ARScannerScreen = () => (
  <View style={styles.container}>
    <Text>AR Scanner Screen (Camera Placeholder)</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});