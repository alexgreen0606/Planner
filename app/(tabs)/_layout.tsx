import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SFSymbol } from 'expo-symbols';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { useMemo } from 'react';

import { todayDatestampAtom } from '@/atoms/planner/todayDatestamp';
import usePermissions from '@/hooks/usePermissions';
import { EAccess } from '@/lib/enums/EAccess';

const TabLayout = () => {
  const { permission: hasCalendarPermissions } = usePermissions(EAccess.CALENDAR);

  const todayDatestamp = useAtomValue(todayDatestampAtom);
  const todayPlannerIcon = useMemo(
    () => `${DateTime.fromISO(todayDatestamp).toFormat('d')}.calendar` as SFSymbol,
    [todayDatestamp]
  );

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="planners">
        <Label hidden />
        <Icon sf={todayPlannerIcon} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger hidden={!hasCalendarPermissions} name="upcomingDates">
        <Label hidden />
        <Icon sf="calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="checklists">
        <Label hidden />
        <Icon sf="list.bullet.clipboard" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabLayout;
