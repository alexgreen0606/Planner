import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import ButtonText from './text/ButtonText';

const BAR_HEIGHT = 36;
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

    const isCountdowns = pathname.includes('countdowns');

    // Determine the current tab's left position based on pathname
    const currentTabLeft = useMemo(() => {
        const currentTab = tabs.find(tab => tab.pathname === pathname);
        return currentTab?.left ?? (HIGHLIGHT_GAP + HIGHLIGHT_WIDTH);
    }, [pathname]);

    function handleTabChange(tab: any) {
        router.push(tab.pathname);
    }

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >
            <ScrollContainerProvider
                upperContentHeight={isCountdowns ? 0 : BAR_HEIGHT}
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
                            <MotiView
                                className='absolute'
                                animate={{
                                    left: currentTabLeft,
                                }}
                                transition={{
                                    type: 'timing',
                                    duration: 300
                                }}
                                style={{
                                    width: HIGHLIGHT_WIDTH,
                                    height: HIGHLIGHT_HEIGHT,
                                    borderRadius: HIGHLIGHT_HEIGHT / 2,
                                    backgroundColor: PlatformColor('systemGray4')
                                }}
                            />

                            {/* Tab Options */}
                            {tabs.map((tab) => (
                                <View
                                    key={`${tab.label}-floating-tab`}
                                    className='flex items-center'
                                    style={{ width: (BAR_WIDTH - (HIGHLIGHT_GAP * 2)) / 3 }}
                                >
                                    <ButtonText
                                        textType='plannerTabLabel'
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