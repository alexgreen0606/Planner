import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import { userAccessAtom } from '@/atoms/userAccess';
import { EAccess } from '@/lib/enums/EAccess';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SFSymbol } from 'expo-symbols';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { useMemo } from 'react';

// ✅ 

const TabLayout = () => {
    const userAccess = useAtomValue(userAccessAtom);
    const todayDatestamp = useAtomValue(todayDatestampAtom);

    const plannerIconName: SFSymbol = useMemo(() => {
        const date = DateTime.fromISO(todayDatestamp);
        return `${date.toFormat('d')}.calendar` as SFSymbol
    }, [todayDatestamp]);

    return (
        <NativeTabs>
            <NativeTabs.Trigger name="planners">
                <Label hidden />
                <Icon sf={plannerIconName} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger hidden={!userAccess.get(EAccess.CALENDAR)} name='upcomingDates'>
                <Label hidden />
                <Icon sf='calendar' />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="checklists">
                <Label hidden />
                <Icon sf='list.bullet.clipboard' />
            </NativeTabs.Trigger>
            {/* <NativeTabs.Trigger name='recurring'>
            <Label hidden />
            <Icon sf='repeat' />
        </NativeTabs.Trigger> */}
        </NativeTabs>
    )
};

export default TabLayout;