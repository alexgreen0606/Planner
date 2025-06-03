import { ScrollContainerProvider } from '@/services/ScrollContainer';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ButtonText from './text/ButtonText';
import { LINEAR_ANIMATION_CONFIG } from '@/constants/animations';

const TabHighlight = Animated.createAnimatedComponent(View);

const BAR_HEIGHT = 34;
const TAB_SPACING = 32;
const INDICATOR_GAP = 6;

interface TopNavbarProps {
    children: React.ReactNode;
}

const PlannersNavbar = ({ children }: TopNavbarProps) => {

    const tabs = [
        { label: 'Planners', pathname: '/planners', index: 0, width: 60 },
        { label: 'Deadlines', pathname: '/planners/deadlines', index: 1, width: 61 },
        { label: 'Recurring', pathname: '/planners/recurring', index: 2, width: 70 }
    ];

    const pathname = usePathname();
    const router = useRouter();

    const activeTab = tabs.find(tab => pathname === tab.pathname) ?? tabs[0];

    const indicatorWidth = useSharedValue(activeTab?.width);
    const indicatorLeft = useSharedValue(((TAB_SPACING / 2) + INDICATOR_GAP) / 4);

    // ------------- Utility Functions -------------

    function handleTabChange(tab: any) {
        const targetLeft = tabs
            .slice(0, tab.index)
            .reduce((acc, { width }) => acc + width + TAB_SPACING, 0) + INDICATOR_GAP;
        const targetWidth = tab.width;

        indicatorLeft.value = withTiming(targetLeft, LINEAR_ANIMATION_CONFIG);
        indicatorWidth.value = withTiming(targetWidth, LINEAR_ANIMATION_CONFIG);

        router.push(tab.pathname)
    }

    // ------------- Highlight Animation -------------

    const tabHighlightStyle = useAnimatedStyle(() => ({
        left: indicatorLeft.value,
        width: indicatorWidth.value + TAB_SPACING
    }));

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >
            <ScrollContainerProvider
                floatingBanner={
                    <View className='w-full flex items-center'>
                        <View style={styles.bar}>

                            {/* Blurred Background */}
                            <BlurView
                                tint='default'
                                intensity={100}
                                style={styles.blur}
                            />

                            {/* Current Tab Highlight */}
                            <TabHighlight style={[tabHighlightStyle, styles.tabHighlight]} />

                            {/* Tab Options */}
                            {tabs.map((tab) => (
                                <ButtonText
                                    key={`${tab.label}-floating-tab`}
                                    textType='label'
                                    onClick={() => handleTabChange(tab)}
                                    platformColor={pathname === tab.pathname ? 'label' : 'secondaryLabel'}
                                >
                                    {tab.label}
                                </ButtonText>
                            ))}
                        </View>
                    </View>
                }
            >
                {children}
            </ScrollContainerProvider>
        </View>
    )
}

const styles = StyleSheet.create({
    bar: {
        position: 'relative',
        height: BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: TAB_SPACING,
        borderRadius: BAR_HEIGHT / 2,
        overflow: 'hidden',
        paddingHorizontal: (TAB_SPACING / 2) + INDICATOR_GAP
    },
    blur: {
        position: 'absolute',
        width: '100%',
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        overflow: 'hidden'
    },
    tabHighlight: {
        position: 'absolute',
        height: BAR_HEIGHT - (INDICATOR_GAP * 2),
        borderRadius: (BAR_HEIGHT - (INDICATOR_GAP * 2)) / 2,
        backgroundColor: PlatformColor('systemGray4')
    }
});

export default PlannersNavbar;
