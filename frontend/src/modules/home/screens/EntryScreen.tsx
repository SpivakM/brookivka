import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const EntryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Entry Screen Placeholder</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});