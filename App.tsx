import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import Navigator from './src/foundation/navigation/Navigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { DeleteSchedulerProvider } from './src/foundation/sortedLists/services/DeleteScheduler';
import { NavigatorProvider } from './src/foundation/navigation/services/NavProvider';

const App = () => {
  return (
    <PaperProvider>
      <GestureHandlerRootView>
        <NavigationContainer>
            <DeleteSchedulerProvider>
              <StatusBar translucent backgroundColor='transparent' barStyle='default' />
              <NavigatorProvider>
                <Navigator />
              </NavigatorProvider>
            </DeleteSchedulerProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;