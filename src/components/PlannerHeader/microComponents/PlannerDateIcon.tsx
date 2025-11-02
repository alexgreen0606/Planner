import { PLANNER_CAROUSEL_ICON_WIDTH } from "@/lib/constants/miscLayout";
import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { PlatformColor, Pressable, View } from "react-native";
import CustomText from "../../text/CustomText";
import Icon from "../../icons/Icon";
import FadeInView from "../../views/FadeInView";
import { useAtomValue } from "jotai";
import { todayDatestampAtom } from "@/atoms/todayDatestamp";
import { isTimeEarlier } from "@/utils/dateUtils";

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

    const isTodayDatestamp = datestamp === todayDatestamp;
    const isPastDate = isTimeEarlier(datestamp, todayDatestamp);

    function handlePress() {
        router.push(`/planners/${datestamp}`);
    }

    return (
        <Pressable
            onPress={handlePress}
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

        </Pressable>
    )
}

export default PlannerDateIcon;