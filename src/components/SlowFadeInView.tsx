import { MotiView } from "moti";
import { ReactNode } from "react"
import { ViewProps } from "react-native";

// ✅ 

interface IFadeInViewProps extends ViewProps {
    children: ReactNode;
};

const SlowFadeInView = ({ children, ...rest }: IFadeInViewProps) =>
    <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
            type: 'timing',
            duration: 1000,
        }}
        {...rest}
    >
        {children}
    </MotiView>;

export default SlowFadeInView;