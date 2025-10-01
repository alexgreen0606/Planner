import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

// ✅ 

const TabLayout = () => (
    <NativeTabs minimizeBehavior='onScrollDown'>
        <NativeTabs.Trigger name="planners">
            <Label hidden />
            <Icon sf='note' />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="checklists">
            <Label hidden />
            <Icon sf='list.bullet.clipboard' />
        </NativeTabs.Trigger>
        {/* <NativeTabs.Trigger name='recurring'>
            <Label hidden />
            <Icon sf='repeat' />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='countdowns'>
            <Label hidden />
            <Icon sf='calendar.badge.exclamationmark' />
        </NativeTabs.Trigger> */}
    </NativeTabs>
);

export default TabLayout;