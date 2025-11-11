export type TFormFieldControl<T> = {
    value: T;
    onChange: (val: T) => void;
};