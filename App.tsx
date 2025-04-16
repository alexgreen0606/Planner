import React from 'react';
import { PaperProvider } from 'react-native-paper';
import Navigator from './src/foundation/navigation/Navigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { DeleteSchedulerProvider } from './src/foundation/sortedLists/services/DeleteScheduler';
import { NavigationProvider } from './src/foundation/navigation/services/NavigationProvider';

const App = () => {
  return (
    <PaperProvider>
      <GestureHandlerRootView>
        <DeleteSchedulerProvider>
          <NavigationProvider>
            <StatusBar translucent backgroundColor='transparent' barStyle='default' />
            <Navigator />
          </NavigationProvider>
        </DeleteSchedulerProvider>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;