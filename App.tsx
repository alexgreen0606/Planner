import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { DeleteSchedulerProvider } from './src/foundation/sortedLists/services/DeleteScheduler';
import { ReloadProvider } from './src/services/ReloadProvider';
import { Slot } from 'expo-router';

const App = () => {
  return (
    <PaperProvider>
      <GestureHandlerRootView>
        <DeleteSchedulerProvider>
          <ReloadProvider>
            <StatusBar translucent backgroundColor='transparent' barStyle='default' />
            {/* <Navigator /> */}
            <Slot/>
          </ReloadProvider>
        </DeleteSchedulerProvider>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;