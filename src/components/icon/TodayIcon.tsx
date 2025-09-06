import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { PlatformColor, View } from "react-native";
import GenericIcon from ".";
import CustomText from "../text/CustomText";
import useAppTheme from "@/hooks/useAppTheme";

// ✅ 

type TodayIconProps = {
    platformColor: string;
};

const TodayIcon = ({ platformColor }: TodayIconProps) => {
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const { background } = useAppTheme();

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
        <View className='relative'>
            <GenericIcon
                type='note'
                size='xl'
                hideRipple
                platformColor={platformColor}
            />
            <View className='absolute w-full h-full'>
                <View className='w-full items-center mt-[0.275rem] ml-[0.275rem]'>
                    <CustomText variant='todayMonth' customStyle={{ color: PlatformColor(background) }}>
                        {month}
                    </CustomText>
                </View>
                <View className='w-full items-center ml-[0.275rem]'>
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
        </View>
    )
}

export default TodayIcon;