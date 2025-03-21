import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import Navigator from './src/app/Navigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { NavigatorProvider } from './src/app/NavProvider';

const App = () => {
  return (
    <PaperProvider>
      <GestureHandlerRootView>
        <NavigationContainer>
          <SafeAreaProvider>
            <StatusBar barStyle='default' />
            <NavigatorProvider>
              <Navigator />
            </NavigatorProvider>
          </SafeAreaProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;