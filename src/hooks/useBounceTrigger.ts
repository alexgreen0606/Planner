import { useEffect, useRef, useState } from "react";

const useBounceTrigger = (dependencies: any[]) => {
    const isInitialMount = useRef(true);
    const [bounceTrigger, setBounceTrigger] = useState(false);

    // Trigger the bounce whenever the dependencies change.
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        setBounceTrigger(true);
        const timeout = setTimeout(() => setBounceTrigger(false), 0);

        return () => clearTimeout(timeout);
    }, dependencies);

    return bounceTrigger;
};

export default useBounceTrigger;