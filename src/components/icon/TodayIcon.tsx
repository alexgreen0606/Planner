import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { PlatformColor, View } from "react-native";
import GenericIcon from ".";
import CustomText from "../text/CustomText";

// ✅ 

type TodayIconProps = {
    platformColor: string;
};

const TodayIcon = ({ platformColor }: TodayIconProps) => {
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const month = useMemo(() => {
        const monthFormat = 'MMM';
        const date = DateTime.fromISO(todayDatestamp);
        return date.toFormat(monthFormat).toUpperCase();
    }, [todayDatestamp]);

    const day = useMemo(() => {
        const monthFormat = 'd';
        const date = DateTime.fromISO(todayDatestamp);
        return date.toFormat(monthFormat).toUpperCase();
    }, [todayDatestamp]);

    return (
        <View className='relative scale-[1.12]'>
            <GenericIcon
                type='note'
                size='xl'
                hideRipple
                platformColor={platformColor}
            />
            <View className='absolute w-full h-full items-center pt-[0.6px]'>
                <CustomText variant='todayMonth'>
                    {month}
                </CustomText>
                <CustomText
                    variant='todayDate'
                    customStyle={{
                        color: PlatformColor(platformColor),
                    }}
                >
                    {day}
                </CustomText>
            </View>
        </View>
    )
}

export default TodayIcon;