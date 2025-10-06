import PlannerCard from '@/_deprecated/DepPlannerCard';
import ColorFadeView from '@/components/views/ColorFadeView';
import FadeInView from '@/components/views/FadeInView';
import useAppTheme from '@/hooks/useAppTheme';
import { getNextEightDayDatestamps } from '@/utils/dateUtils';
import { Host, Picker } from '@expo/ui/swift-ui';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    SlideInRight,
    SlideOutRight
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PlannerSelectModal = () => {
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const router = useRouter();

    const [closing, setClosing] = useState(false);
    const [datestamps, setDatestamps] = useState(getNextEightDayDatestamps());

    const { ColorArray: { TransparentModal: { upper, lower } } } = useAppTheme();

    function handleClose() {
        setClosing(true);
        setTimeout(() => router.back(), 300);
    }

    // Trigger the exiting animations below.
    if (closing) return null;

    return (
        <FadeInView style={StyleSheet.absoluteFillObject}>

            {/* Blur Background */}
            <BlurView intensity={40} style={StyleSheet.absoluteFillObject} />

            {/* Upper Fade Out */}
            <View className='absolute top-0, left-0 z-[1000] w-full pointer-events-none'>
                <ColorFadeView solidHeight={TOP_SPACER} totalHeight={TOP_SPACER * 2} colors={upper} />
            </View>

            {/* Scroll Content */}
            <Animated.ScrollView
                entering={SlideInRight}
                exiting={SlideOutRight}
                contentContainerClassName='gap-6 justify-center items-center flex-1 pt-80'
            >

                {/* Pressable Background Close Trigger */}
                <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

                <View className='w-80'>
                    <Host matchContents>
                        <Picker
                            options={['Next 7 Days']}
                            variant='menu'
                            selectedIndex={0}
                        />
                    </Host>
                </View>

                {/* Planner Cards */}
                {datestamps.map((datestamp) => (
                    <PlannerCard
                        key={datestamp}
                        datestamp={datestamp}
                    />
                ))}

            </Animated.ScrollView>

            {/* Lower Fade Out */}
            <View className='absolute bottom-0 left-0 z-[1000] w-full pointer-events-none'>
                <ColorFadeView totalHeight={TOP_SPACER} colors={lower} />
            </View>

        </FadeInView>
    )
};

export default PlannerSelectModal;