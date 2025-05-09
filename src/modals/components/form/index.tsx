import { Control, Controller } from "react-hook-form";
import { IFormField } from "./types";
import { View } from "react-native";
import ThinLine from "../../../foundation/sortedLists/components/list/ThinLine";
import FormField from "./FormField";

interface FormProps {
    options: IFormField[];
    control: Control<any>;
}

const Form = ({
    options,
    control
}: FormProps) => {
    return (
        options.map(({ name, type, defaultValue, rules, ...rest }) => (
            <View key={name}>
                <Controller
                    name={name}
                    control={control}
                    defaultValue={defaultValue}
                    rules={rules}
                    render={({ field: { onChange, value } }) => (
                        <FormField
                            type={type}
                            value={value}
                            onChange={onChange}
                            {...rest}
                        />
                    )}
                />
                <ThinLine />
            </View>
        ))
    );
}

export default Form;