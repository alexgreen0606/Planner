import { LINEAR_ANIMATION_CONFIG } from '@/constants/animations';
import { ScrollContainerProvider } from '@/services/ScrollContainer';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { PlatformColor, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ButtonText from './text/ButtonText';

const TabHighlight = Animated.createAnimatedComponent(View);

const BAR_HEIGHT = 34;
const BAR_WIDTH = 320;

const HIGHLIGHT_GAP = 6;

const HIGHLIGHT_HEIGHT = BAR_HEIGHT - (HIGHLIGHT_GAP * 2);
const HIGHLIGHT_WIDTH = (BAR_WIDTH - (HIGHLIGHT_GAP * 2)) / 3;

const tabs = [
    { label: 'Countdowns', pathname: '/planners/countdowns', left: HIGHLIGHT_GAP },
    { label: 'Planner', pathname: '/planners', left: HIGHLIGHT_GAP + HIGHLIGHT_WIDTH },
    { label: 'Recurring', pathname: '/planners/recurring', left: HIGHLIGHT_GAP + (HIGHLIGHT_WIDTH * 2) }
];

interface TopNavbarProps {
    children: React.ReactNode;
}

const PlannersNavbar = ({ children }: TopNavbarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const indicatorLeft = useSharedValue(HIGHLIGHT_GAP + HIGHLIGHT_WIDTH);

    const isCountdowns = pathname.includes('countdowns');

    function handleTabChange(tab: any) {
        indicatorLeft.value = withTiming(tab.left, LINEAR_ANIMATION_CONFIG);
        router.push(tab.pathname)
    }

    const tabHighlightStyle = useAnimatedStyle(() => ({
        left: indicatorLeft.value,
        width: HIGHLIGHT_WIDTH
    }));

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >
            <ScrollContainerProvider
                upperContentHeight={isCountdowns ? 0 : 48}
                floatingBannerHeight={BAR_HEIGHT}
                fixFloatingBannerOnOverscroll
                floatingBanner={
                    <View className='w-full flex items-center'>
                        <View
                            className='relative flex-row items-center overflow-hidden'
                            style={{
                                height: BAR_HEIGHT,
                                width: BAR_WIDTH,
                                paddingHorizontal: HIGHLIGHT_GAP,
                                borderRadius: BAR_HEIGHT / 2
                            }}
                        >

                            {/* Blurred Background */}
                            <BlurView
                                tint='default'
                                intensity={90}
                                className='absolute overflow-hidden'
                                style={{
                                    width: BAR_WIDTH,
                                    height: BAR_HEIGHT
                                }}
                            />

                            {/* Current Tab Highlight */}
                            <TabHighlight
                                className='absolute'
                                style={[
                                    tabHighlightStyle,
                                    {
                                        height: HIGHLIGHT_HEIGHT,
                                        borderRadius: HIGHLIGHT_HEIGHT / 2,
                                        backgroundColor: PlatformColor('systemGray4')
                                    }
                                ]}
                            />

                            {/* Tab Options */}
                            {tabs.map((tab) => (
                                <View
                                    key={`${tab.label}-floating-tab`}
                                    className='flex items-center'
                                    style={{ width: (BAR_WIDTH - (HIGHLIGHT_GAP * 2)) / 3 }}
                                >
                                    <ButtonText
                                        textType='label'
                                        onClick={() => handleTabChange(tab)}
                                        platformColor={pathname === tab.pathname ? 'label' : 'secondaryLabel'}

                                    >
                                        {tab.label}
                                    </ButtonText>
                                </View>
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

export default PlannersNavbar;
