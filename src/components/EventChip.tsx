import { LINEAR_ANIMATION_CONFIG } from '@/lib/constants/animations';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { openTimeModal } from '@/utils/plannerUtils';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import GenericIcon, { GenericIconProps } from './GenericIcon';
import CustomText from './text/CustomText';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';

const Chip = Animated.createAnimatedComponent(View);
const ChipLabel = Animated.createAnimatedComponent(View);

const COLLAPSED_CHIP_RIGHT_MARGIN = -18;
const EXPANDED_CHIP_RIGHT_MARGIN = 6;

const CHIP_SET_GAP = 24;

interface EventChipProps {
    label: string;
    iconConfig: GenericIconProps;
    color: string;
    backgroundPlatformColor?: string;
    collapsed?: boolean;
    chipSetIndex: number;
    shiftChipRight: boolean;
    planEvent?: IPlannerEvent;
    onClick?: () => void;
    toggleCollapsed?: () => void;
}

const EventChip = ({
    label,
    iconConfig,
    color,
    backgroundPlatformColor = 'systemGray6',
    collapsed = false,
    chipSetIndex,
    shiftChipRight,
    planEvent,
    onClick,
    toggleCollapsed
}: EventChipProps) => {
    const { getDeletingItems } = useDeleteScheduler<IPlannerEvent>();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();

    const [hideLabel, setHideLabel] = useState(true);

    const isPendingDelete = useMemo(() => planEvent &&
        getDeletingItems().some(deleteItem =>
            // This deleting item is the chip's event
            deleteItem.id === planEvent.id &&
            // This deleting item is not from today
            deleteItem.listId !== getTodayDatestamp()
        ),
        [getDeletingItems]
    );

    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;
    const chipCssColor = isValidPlatformColor(chipColor) ? PlatformColor(chipColor) : chipColor;

    const maxLabelWidth = SCREEN_WIDTH - 64;

    const labelWidth = useSharedValue(collapsed ? 0 : maxLabelWidth);
    const chipMarginRight = useSharedValue(collapsed ? COLLAPSED_CHIP_RIGHT_MARGIN : EXPANDED_CHIP_RIGHT_MARGIN);

    function handleOpenTimeModal() {
        if (planEvent) openTimeModal(planEvent.listId, planEvent, router);
    }

    // ------------- Animations -------------

    useEffect(() => {
        if (collapsed) {
            labelWidth.value = withTiming(0, LINEAR_ANIMATION_CONFIG);
            chipMarginRight.value = withTiming(COLLAPSED_CHIP_RIGHT_MARGIN, LINEAR_ANIMATION_CONFIG);
        } else {
            labelWidth.value = withTiming(maxLabelWidth, LINEAR_ANIMATION_CONFIG);
            chipMarginRight.value = withTiming(EXPANDED_CHIP_RIGHT_MARGIN, LINEAR_ANIMATION_CONFIG);
        }
    }, [collapsed]);

    useAnimatedReaction(
        () => labelWidth.value,
        (curr) => {
            if (curr !== 0 && hideLabel) {
                runOnJS(setHideLabel)(false);
            } else if (curr === 0 && !hideLabel) {
                runOnJS(setHideLabel)(true);
            }
        });

    const chipStyle = useAnimatedStyle(() => {
        return {
            // Chips stack with the firstly rendered on top
            zIndex: 9000 + (40 / (chipSetIndex + 1)),
            marginLeft: shiftChipRight ? CHIP_SET_GAP : 0,
            marginRight: chipMarginRight.value
        }
    });

    const chipLabelStyle = useAnimatedStyle(() => ({
        maxWidth: labelWidth.value
    }));

    // ------------- Render Helper Function -------------

    const ChipContent = () => (
        <View
            className='flex-row gap-1 h-6 min-w-6 items-center justify-center rounded-xl mt-2 border'
            style={{
                borderColor: chipCssColor,
                backgroundColor: PlatformColor(backgroundPlatformColor),
                paddingHorizontal: hideLabel ? 0 : 8
            }}
        >
            <GenericIcon
                {...iconConfig}
                platformColor={chipColor}
                size='xs'
            />
            {!hideLabel && (
                <ChipLabel style={chipLabelStyle}>
                    <CustomText
                        type='soft'
                        ellipsizeMode='tail'
                        numberOfLines={1}
                        style={{
                            color: chipCssColor,
                            textDecorationLine: isPendingDelete ? 'line-through' : undefined
                        }}
                    >
                        {label}
                    </CustomText>
                </ChipLabel>
            )}
        </View>
    )

    return (
        <Chip style={chipStyle}>
            {planEvent ? (
                <TouchableOpacity onPress={collapsed ? toggleCollapsed : handleOpenTimeModal}>
                    <ChipContent />
                </TouchableOpacity>
            ) : onClick ? (
                <TouchableOpacity onPress={collapsed ? toggleCollapsed : onClick}>
                    <ChipContent />
                </TouchableOpacity>
            ) : (
                <ChipContent />
            )}
        </Chip>
    );
};

export default EventChip;