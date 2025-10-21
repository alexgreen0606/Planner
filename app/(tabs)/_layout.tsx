import { userAccessAtom } from '@/atoms/userAccess';
import { EAccess } from '@/lib/enums/EAccess';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAtomValue } from 'jotai';

// ✅ 

const TabLayout = () => {
    const userAccess = useAtomValue(userAccessAtom);
    
    return (
    <NativeTabs minimizeBehavior='onScrollDown'>
        <NativeTabs.Trigger name="planners">
            <Label hidden />
            <Icon sf='note' />
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