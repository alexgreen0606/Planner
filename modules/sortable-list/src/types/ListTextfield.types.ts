import { NativeSyntheticEvent } from "react-native";

export interface ListTextfieldProps {
    id: string;
    value: string;
    textColor?: string;
    onValueChange?: (event: NativeSyntheticEvent<{ value: string }>) => void;
}
