import { ScrollContainerProvider } from '@/services/ScrollContainer';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, PlatformColor, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ButtonText from './text/ButtonText';

const TabHighlight = Animated.createAnimatedComponent(View);

const BAR_HEIGHT = 34;
const TAB_SPACING = 32;
const INDICATOR_GAP = 6;

interface TopNavbarProps {
    children: React.ReactNode;
}

const TopNavbar = ({ children }: TopNavbarProps) => {

    const tabs = [
        { label: 'Planners', pathname: '/planners', index: 0 },
        { label: 'Deadlines', pathname: '/planners/deadlines', index: 1 },
        { label: 'Recurring', pathname: '/planners/recurring', index: 2 }
    ];

    const pathname = usePathname();
    const router = useRouter();
    const barRef = useRef<View>(null);
    const tabWidths = useRef<Record<string, number>>({});
    const [barWidth, setBarWidth] = useState(0);
    const indicatorWidth = useSharedValue(0);
    const indicatorLeft = useSharedValue(0);

    const activeTab = tabs.find(tab => pathname === tab.pathname) ?? tabs[0];

    // Trigger the highlight animation on tab change
    useEffect(() => {
        handleTabChange();
    }, [pathname]);

    // ------------- Utility Functions -------------

    function handleTabLayout(event: LayoutChangeEvent, pathname: string) {
        const { width } = event.nativeEvent.layout;
        tabWidths.current[pathname] = width;
        if (pathname === activeTab.pathname) {
            handleTabChange();
        }
    }

    function handleTabChange() {
        const targetLeft = Object.values(tabWidths.current)
            .slice(0, activeTab.index)
            .reduce((acc, width) => acc + width + TAB_SPACING, 0) + INDICATOR_GAP;
        const targetWidth = tabWidths.current[activeTab.pathname] || 0;

        indicatorLeft.value = withTiming(targetLeft, { duration: 300 });
        indicatorWidth.value = withTiming(targetWidth, { duration: 300 });

        if (barWidth === 0 && tabWidths.current.length === tabs.length) {
            barRef.current?.measure((_, __, width) => {
                setBarWidth(Math.ceil(width));
            })
        }
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
                        <View style={styles.bar} ref={barRef}>

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
                                    onClick={() => router.push(tab.pathname)}
                                    platformColor={pathname === tab.pathname ? 'label' : 'secondaryLabel'}
                                    onLayout={(e) => handleTabLayout(e, tab.pathname)}
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

export default TopNavbar;
