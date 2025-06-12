import { Slot } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { DeleteSchedulerProvider } from './src/providers/DeleteScheduler';
import { ReloadProvider } from './src/providers/ReloadScheduler';

const App = () => {
  return (
    <PaperProvider>
      <GestureHandlerRootView>
        <DeleteSchedulerProvider>
          <ReloadProvider>
            <StatusBar translucent backgroundColor='transparent' barStyle='default' />
            <Slot />
          </ReloadProvider>
        </DeleteSchedulerProvider>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;