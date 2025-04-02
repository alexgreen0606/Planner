import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import CustomText from '../../components/text/CustomText';
import { BlurView } from 'expo-blur';

const Indicator = Animated.createAnimatedComponent(View);

const BAR_HEIGHT = 34;
const TAB_SPACING = 32;
const INDICATOR_GAP = 6;

interface NavConfig {
    label: string;
    onClick: () => void;
}

interface TopNavbarProps {
    currentTabIndex: number;
    setCurrentTabIndex: React.Dispatch<React.SetStateAction<number>>
    tabs: NavConfig[];
}

const TopNavbar = ({
    currentTabIndex,
    setCurrentTabIndex,
    tabs
}: TopNavbarProps) => {
    const barRef = useRef<View>(null);
    const [barWidth, setBarWidth] = useState(0);
    const tabWidths = useRef<number[]>(Array(tabs.length).fill(0));
    const indicatorWidth = useSharedValue(0);
    const indicatorLeft = useSharedValue(0);

    function handleTabChange() {
        const targetLeft = tabWidths.current.slice(0, currentTabIndex).reduce((acc, width) => acc + width + TAB_SPACING, 0) + INDICATOR_GAP;
        const targetWidth = tabWidths.current[currentTabIndex] || 0;

        indicatorLeft.value = withTiming(targetLeft, { duration: 300 });
        indicatorWidth.value = withTiming(targetWidth, { duration: 300 });

        if (barWidth === 0 && tabWidths.current.length === tabs.length) {
            barRef.current?.measure((_, __, width) => {
                setBarWidth(Math.ceil(width));
            })
        }
    }

    useEffect(() => {
        handleTabChange();
    }, [currentTabIndex]);

    const indicatorStyle = useAnimatedStyle(
        () => {
            return {
                left: indicatorLeft.value,
                width: indicatorWidth.value + TAB_SPACING
            }
        },
        [indicatorLeft.value, indicatorWidth.value]
    );

    return (
        <View style={styles.container}>
            <View style={styles.bar} ref={barRef}>
                <BlurView
                    tint='default'
                    intensity={100}
                    style={{
                        height: BAR_HEIGHT,
                        borderRadius: BAR_HEIGHT / 2,
                        width: barWidth,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        overflow: 'hidden'
                    }}
                />
                <Indicator style={[styles.indicator, indicatorStyle]} />
                {tabs.map((tab, index) => (
                    <CustomText
                        key={`${tab.label}-floating-tab`}
                        type='label'
                        onPress={() => setCurrentTabIndex(index)}
                        style={{
                            color: currentTabIndex === index ? PlatformColor('label') : PlatformColor('secondaryLabel'),
                        }}
                        onLayout={(event) => {
                            const { width } = event.nativeEvent.layout;
                            tabWidths.current[index] = width;
                            if (tabWidths.current.length === tabs.length) {
                                handleTabChange();
                            }
                        }}
                    >
                        {tab.label}
                    </CustomText>
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        width: '100%'
    },
    bar: {
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        paddingHorizontal: (TAB_SPACING / 2) + INDICATOR_GAP,
        gap: TAB_SPACING
    },
    indicator: {
        position: 'absolute',
        height: BAR_HEIGHT - (INDICATOR_GAP * 2),
        borderRadius: (BAR_HEIGHT - (INDICATOR_GAP * 2)) / 2,
        backgroundColor: PlatformColor('systemGray4')
    }
});

export default TopNavbar;
