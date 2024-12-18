import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import Navigator from './src/foundation/navigation/components/Navigator';
import { theme } from './src/theme/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { TabsProvider } from './src/foundation/navigation/services/TabsProvider';

const App = () => {
  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView>
        <NavigationContainer>
          <SafeAreaProvider >
            <StatusBar barStyle='light-content' />
            <TabsProvider>
              <Navigator />
            </TabsProvider>
          </SafeAreaProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;