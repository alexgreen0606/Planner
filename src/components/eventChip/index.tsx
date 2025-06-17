import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { openTimeModal } from '@/utils/plannerUtils';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useMemo } from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import GenericIcon, { GenericIconProps } from '../icon';
import CustomText from '../text/CustomText';

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
    const router = useRouter();

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

    function handleOpenTimeModal() {
        if (planEvent) openTimeModal(planEvent.listId, planEvent, router);
    }

    // ------------- Render Helper Function -------------

    const ChipContent = () => (
        <View
            className='flex-row h-6 gap-1 min-w-6 items-center justify-center rounded-xl mt-2 border'
            style={{
                borderColor: chipCssColor,
                backgroundColor: PlatformColor(backgroundPlatformColor),
                paddingHorizontal: collapsed ? 0 : 8
            }}
        >
            <GenericIcon
                {...iconConfig}
                platformColor={chipColor}
                size='xs'
            />
            {!collapsed && (
                <CustomText
                    type='soft'
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    style={{
                        color: chipCssColor,
                        textDecorationLine: isPendingDelete ? 'line-through' : undefined,
                    }}
                >
                    {label}
                </CustomText>
            )}
        </View>
    );

    return (
        <MotiView
            animate={{
                marginRight: collapsed ? COLLAPSED_CHIP_RIGHT_MARGIN : EXPANDED_CHIP_RIGHT_MARGIN
            }}
            style={{
                // Chips stack with the firstly rendered on top
                zIndex: 9000 + (40 / (chipSetIndex + 1)),
                marginLeft: shiftChipRight ? CHIP_SET_GAP : 0,
            }}
        >
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
        </MotiView>
    );
};

export default EventChip;