import { MotiView } from "moti";
import { ReactNode } from "react"

// ✅ 

type TFadeInViewProps = {
    children: ReactNode;
};

const SlowFadeInView = ({ children }: TFadeInViewProps) =>
    <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
            type: 'timing',
            duration: 1600,
        }}
    >
        {children}
    </MotiView>;

export default SlowFadeInView;