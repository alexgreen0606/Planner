import useAppTheme from '@/hooks/useAppTheme';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useMemo, useRef } from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import CustomText from './text/CustomText';

// ✅ 

type TTopNavbarProps = {
    children: React.ReactNode;
};

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

const PlannersNavbar = ({ children }: TTopNavbarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const prevTabLeft = useRef(HIGHLIGHT_GAP + HIGHLIGHT_WIDTH);

    const { plannersNavbar: { indicator, background } } = useAppTheme();

    // Determine the current tab's left position based on pathname.
    const currentTabLeft = useMemo(() => {
        const currentTab = tabs.find(tab => tab.pathname === pathname);
        const newLeft = currentTab?.left ?? prevTabLeft.current;
        prevTabLeft.current = newLeft;
        return newLeft;
    }, [pathname]);

    const isCountdowns = pathname.includes('countdowns');

    function handleTabChange(tab: any) {
        router.push(tab.pathname);
    }

    return (
        <ScrollContainerProvider
            upperContentHeight={isCountdowns ? 0 : BAR_HEIGHT}
            floatingBannerHeight={BAR_HEIGHT}
            fixFloatingBannerOnOverscroll
            floatingBanner={
                <View style={{ flexDirection: 'row', width: '100%' }}>
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
                                tint={background.color}
                                intensity={background.intensity}
                                className='absolute overflow-hidden'
                                style={{
                                    width: BAR_WIDTH,
                                    height: BAR_HEIGHT
                                }}
                            />

                            {/* Current Tab Highlight */}
                            <MotiView
                                className="absolute overflow-hidden"
                                animate={{
                                    left: currentTabLeft,
                                }}
                                transition={{
                                    type: "timing",
                                    duration: 300,
                                }}
                                style={{
                                    width: HIGHLIGHT_WIDTH,
                                    height: HIGHLIGHT_HEIGHT,
                                    borderRadius: HIGHLIGHT_HEIGHT / 2,
                                }}
                            >
                                <BlurView
                                    tint={indicator.color}
                                    intensity={indicator.intensity}
                                    style={{
                                        flex: 1,
                                        borderRadius: HIGHLIGHT_HEIGHT / 2,
                                    }}
                                />
                            </MotiView>


                            {/* Tab Options */}
                            {tabs.map((tab) => (
                                <TouchableOpacity
                                    key={`${tab.label}-floating-tab`}
                                    className='flex items-center justify-center h-full'
                                    style={{ width: (BAR_WIDTH - (HIGHLIGHT_GAP * 2)) / 3 }}
                                    onPress={() => handleTabChange(tab)}
                                >
                                    <CustomText
                                        variant='plannerTabLabel'
                                        style={{ color: PlatformColor(pathname === tab.pathname ? 'label' : 'secondaryLabel') }}
                                    >
                                        {tab.label}
                                    </CustomText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            }
        >
            {children}
        </ScrollContainerProvider>
    )
};

export default PlannersNavbar;