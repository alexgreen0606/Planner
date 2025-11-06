import { Stack } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PlannerHeader from '@/components/headers/PlannerHeader/PlannerHeader';
import ColorFadeView from '@/components/views/ColorFadeView';
import useAppTheme from '@/hooks/useAppTheme';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';

const PlannersLayout = () => {
  const { top: TOP_SPACER } = useSafeAreaInsets();

  const {
    CssColor: { background },
    ColorArray: {
      Screen: { upper }
    }
  } = useAppTheme();

  return (
    <Stack
      screenOptions={({ route: { params } }) => ({
        header: () => {
          // TODO: move this to a special page ScrollView so it won't re-render each time the datestamp changes
          const datestamp = (params as TPlannerPageParams)?.datestamp;
          return datestamp && <PlannerHeader datestamp={datestamp} />;
        },
        headerBackground: () => (
          <ColorFadeView totalHeight={TOP_SPACER + 32} solidHeight={TOP_SPACER} colors={upper} />
        ),
        animation: 'fade',
        contentStyle: { backgroundColor: background },
        headerShown: true,
        headerTransparent: true
      })}
    />
  );
};

export default PlannersLayout;
