import { Stack } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PlannerHeader from '@/components/headers/PlannerHeader/PlannerHeader';
import ColorFadeView from '@/components/views/ColorFadeView';
import useAppTheme from '@/hooks/useAppTheme';
import { EHeaderHeight } from '@/lib/enums/EHeaderHeight';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';

const PlannersLayout = () => {
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const {
    CssColor: { background },
    ColorArray: {
      upperFade
    }
  } = useAppTheme();
  return (
    <Stack
      screenOptions={({ route: { params } }) => ({
        // header: () => {
        //   // TODO: move this so it won't re-render each time the datestamp changes
        //   const datestamp = (params as TPlannerPageParams)?.datestamp;
        //   return datestamp && <PlannerHeader activeDatestamp={datestamp} />;
        // },
        // headerBackground: () => (
        //   <ColorFadeView
        //     totalHeight={TOP_SPACER + EHeaderHeight.PLANNER - 100} // Ignore height of carousel
        //     solidHeight={TOP_SPACER}
        //     colors={upperFade}
        //   />
        // ),
        animation: 'fade',
        contentStyle: { backgroundColor: background },
        headerShown: false,
        headerTransparent: true
      })}
    />
  );
};

export default PlannersLayout;
