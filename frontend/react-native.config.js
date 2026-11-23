module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: {
          packageImportPath: 'import org.asyncstorage.AsyncStoragePackage;',
        },
      },
    },
    'react-native-worklets-core': {
      platforms: {
        android: {
          libraryName: null,
          cmakeListsPath: null,
        },
      },
    },
  },
};