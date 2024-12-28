import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#16f3ff', // cyan
    background: 'rgb(15, 15, 15)', // dark grey
    outline: '#808080', // grey
    secondary: '#FFFFFF', // white
    backdrop: 'rgb(10, 10, 10)'
  },
};
