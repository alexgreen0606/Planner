import { Pressable, PressableProps } from "react-native";
import GenericIcon from "..";

// ✅ 

const OpenCalendarIconButton = (props: Omit<PressableProps, 'className'>) =>
    <Pressable {...props} className='flex-row items-center'>
        <GenericIcon
            type='calendar'
            size='l'
            hideRipple
            platformColor="label"
        />
        <GenericIcon
            type='chevronRight'
            size='xs'
            hideRipple
            platformColor="label"
        />
    </Pressable>;

export default OpenCalendarIconButton;