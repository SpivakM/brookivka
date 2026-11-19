module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: {
          packageImportPath: 'import org.asyncstorage.AsyncStoragePackage;',
        },
      },
    },
  },
};