import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UpcomingDatesHeader from '@/components/headers/UpcomingDatesHeader/UpcomingDatesHeader';
import ColorFadeView from '@/components/views/ColorFadeView';
import useAppTheme from '@/hooks/useAppTheme';

const UpcomingDatesLayout = () => {
  const { top: TOP_SPACER } = useSafeAreaInsets();

  const {
    CssColor: { background },
    ColorArray: {
      Screen: { upperDark }
    }
  } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        header: UpcomingDatesHeader,
        headerBackground: () => (
          <ColorFadeView
            totalHeight={TOP_SPACER + 86}
            solidHeight={TOP_SPACER}
            colors={upperDark}
          />
        ),
        contentStyle: { backgroundColor: background },
        headerTransparent: true
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
};

export default UpcomingDatesLayout;
