import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UpcomingDatesHeader from '@/components/headers/UpcomingDatesHeader';
import ColorFadeView from '@/components/views/ColorFadeView';
import useAppTheme from '@/hooks/useAppTheme';
import { EHeaderHeight } from '@/lib/enums/EHeaderHeight';

const UpcomingDatesLayout = () => {
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const {
    CssColor: { background },
    ColorArray: {
      upperFade
    }
  } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        header: UpcomingDatesHeader,
        headerBackground: () => (
          <ColorFadeView
            totalHeight={TOP_SPACER + EHeaderHeight.UPCOMING_DATES}
            solidHeight={TOP_SPACER}
            colors={upperFade}
          />
        ),
        contentStyle: { backgroundColor: background },
        headerTransparent: true
      }}
    />
  );
};

export default UpcomingDatesLayout;
