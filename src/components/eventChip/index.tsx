import { NULL } from '@/lib/constants/generic';
import { EListType } from '@/lib/enums/EListType';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TCalendarEventChip } from '@/lib/types/calendar/TCalendarEventChip';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { isValidPlatformColor } from '@/utils/colorUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { TIME_MODAL_PATHNAME } from 'app/(modals)/timeModal/[datestamp]/[eventId]/[sortId]/[eventValue]';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useMemo } from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import GenericIcon from '../icon';
import CustomText from '../text/CustomText';

const COLLAPSED_CHIP_RIGHT_MARGIN = -18;
const EXPANDED_CHIP_RIGHT_MARGIN = 6;

const CHIP_SET_GAP = 24;

interface EventChipProps {
    chip: TCalendarEventChip;
    onClick?: () => void;
    toggleCollapsed?: () => void;
    backgroundPlatformColor?: string;
    collapsed?: boolean;
    chipSetIndex: number;
    shiftChipRight: boolean;
    parentPlannerDatestamp: string;
}

const EventChip = ({
    chip,
    backgroundPlatformColor = 'systemGray6',
    collapsed = false,
    chipSetIndex,
    shiftChipRight,
    parentPlannerDatestamp,
    onClick,
    toggleCollapsed
}: EventChipProps) => {
    const { getDeletingItems } = useDeleteScheduler<IPlannerEvent>();
    const { event: { title, id, allDay }, iconConfig, color } = chip;
    const router = useRouter();

    const isPendingDelete = useMemo(() =>
        getDeletingItems(EListType.PLANNER).some(deleteItem =>
            // This deleting item is the chip's event
            deleteItem.id === id &&
            // This deleting item is not from today
            deleteItem.listId !== getTodayDatestamp()
        ),
        [getDeletingItems]
    );

    const chipColor = isPendingDelete ? 'tertiaryLabel' : color;
    const chipCssColor = isValidPlatformColor(chipColor) ? PlatformColor(chipColor) : chipColor;

    function handleOpenTimeModal() {
        router.push(`${TIME_MODAL_PATHNAME
            }${parentPlannerDatestamp
            }/${id
            }/${NULL
            }/${title
            }`
        );
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
                    variant='eventChipLabel'
                    ellipsizeMode='tail'
                    numberOfLines={1}
                    customStyle={{
                        color: chipCssColor,
                        textDecorationLine: isPendingDelete ? 'line-through' : undefined,
                    }}
                >
                    {title}
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
            {onClick ? (
                <TouchableOpacity onPress={collapsed ? toggleCollapsed : onClick}>
                    <ChipContent />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={collapsed ? toggleCollapsed : handleOpenTimeModal}>
                    <ChipContent />
                </TouchableOpacity>
            )}
        </MotiView>
    );
};

export default EventChip;