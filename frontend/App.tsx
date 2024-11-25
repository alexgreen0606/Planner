import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import Navigator from './src/foundation/navigation/Navigator';
import { theme } from './src/theme/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App = () => {
  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView>
        <NavigationContainer>
          <SafeAreaProvider >
            <Navigator />
          </SafeAreaProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;