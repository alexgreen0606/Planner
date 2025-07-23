import { MotiView } from "moti";
import { ReactNode } from "react"

// ✅ 

type FadeInViewProps = {
    children: ReactNode;
};

const SlowFadeInView = ({ children }: FadeInViewProps) =>
    <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
            type: 'timing',
            duration: 2000,
        }}
    >
        {children}
    </MotiView>;

export default SlowFadeInView;