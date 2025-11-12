export interface ListTextfieldProps {
    id: string;
    value: string;
    textColor?: string;
    toolbarIcons?: string[];
    onValueChange?: (newValue: string) => void;
    onToolbarPress?: (iconName: string) => void;
}
