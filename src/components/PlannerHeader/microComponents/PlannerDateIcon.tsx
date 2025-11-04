import { todayDatestampAtom } from "@/atoms/todayDatestamp";
import { PRESSABLE_OPACITY } from "@/lib/constants/generic";
import { PLANNER_CAROUSEL_ICON_WIDTH } from "@/lib/constants/miscLayout";
import { isTimeEarlier } from "@/utils/dateUtils";
import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { PlatformColor, TouchableOpacity } from "react-native";
import Icon from "../../icons/Icon";
import CustomText from "../../text/CustomText";
import FadeInView from "../../views/FadeInView";

// ✅ 

type TPlannerDateIconProps = {
    datestamp: string;
    isCurrentDatestamp: boolean;
};

const PlannerDateIcon = ({
    datestamp,
    isCurrentDatestamp
}: TPlannerDateIconProps) => {
    const router = useRouter();

    const todayDatestamp = useAtomValue(todayDatestampAtom);

    const { day, dayOfWeek, isWeekend } = useMemo(() => {
        const date = DateTime.fromISO(datestamp);
        const dayOfWeek = date.toFormat('ccc').toUpperCase();
        return {
            day: date.toFormat('d'),
            dayOfWeek,
            isWeekend: ['SAT', 'SUN'].includes(dayOfWeek)
        }
    }, [datestamp]);

    const { isTodayDatestamp, isPastDate } = useMemo(() => ({
        isTodayDatestamp: datestamp === todayDatestamp,
        isPastDate: isTimeEarlier(datestamp, todayDatestamp)
    }), [datestamp, todayDatestamp]);

    function handlePress() {
        router.push(`/planners/${datestamp}`);
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={PRESSABLE_OPACITY}
            style={{ width: PLANNER_CAROUSEL_ICON_WIDTH, height: PLANNER_CAROUSEL_ICON_WIDTH }}
            className='w-full h-full items-center pt-[0.3rem]'
        >

            {isCurrentDatestamp && (
                <FadeInView className='absolute'>
                    <Icon
                        name='note'
                        color='systemBlue'
                        size={PLANNER_CAROUSEL_ICON_WIDTH}
                    />
                </FadeInView>
            )}

            <CustomText
                variant='dayOfWeek'
                customStyle={{
                    color: PlatformColor(
                        isCurrentDatestamp ? 'systemBackground' :
                            isTodayDatestamp ? 'systemBlue' :
                                isPastDate ? 'tertiaryLabel' :
                                    isWeekend ? 'secondaryLabel' :
                                        'label'
                    ),
                    opacity: isTodayDatestamp && !isCurrentDatestamp ? 0.8 : undefined
                }}
            >
                {dayOfWeek}
            </CustomText>
            <CustomText
                variant='dayOfMonth'
                customStyle={{
                    color: PlatformColor(
                        isCurrentDatestamp ? 'label' :
                            isTodayDatestamp ? 'systemBlue' :
                                isPastDate ? 'tertiaryLabel' :
                                    isWeekend ? 'secondaryLabel' :
                                        'label'),
                    opacity: isTodayDatestamp && !isCurrentDatestamp ? 0.8 : undefined
                }}
            >
                {day}
            </CustomText>

        </TouchableOpacity>
    )
}

export default PlannerDateIcon;