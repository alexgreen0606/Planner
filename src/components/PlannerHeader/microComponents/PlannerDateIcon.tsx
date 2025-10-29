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

    const { day, dayOfWeek } = useMemo(() => {
        const date = DateTime.fromISO(datestamp);
        return {
            month: date.toFormat('MMM').toUpperCase(),
            day: date.toFormat('d'),
            dayOfWeek: date.toFormat('ccc').toUpperCase()
        }
    }, [datestamp]);

    const isTodayDatestamp = datestamp === todayDatestamp;

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
                    color: PlatformColor(isCurrentDatestamp ? 'systemBackground' : isTodayDatestamp ? 'systemBlue' : 'label'),
                    opacity: isCurrentDatestamp ? 1 : isTodayDatestamp ? 0.8  : 0.6
                }}
            >
                {dayOfWeek}
            </CustomText>
            <CustomText
                variant='dayOfMonth'
                customStyle={{
                    color: PlatformColor(isTodayDatestamp && !isCurrentDatestamp ? 'systemBlue' : 'label'),
                    opacity: isCurrentDatestamp ? 1 : isTodayDatestamp ? 0.8  : 0.6
                }}
            >
                {day}
            </CustomText>

        </Pressable>
    )
}

export default PlannerDateIcon;