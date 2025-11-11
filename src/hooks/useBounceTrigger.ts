import { useEffect, useRef, useState } from 'react';

const useBounceTrigger = (dependencies: any[], cooldown = 200) => {
  const cooldownRef = useRef(false);
  const isInitialMount = useRef(true);

  const [bounceTrigger, setBounceTrigger] = useState(false);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Already bouncing — ignore new triggers.
    if (cooldownRef.current) return;

    cooldownRef.current = true;
    setBounceTrigger(true);

    const timeout = setTimeout(() => {
      setBounceTrigger(false);
      cooldownRef.current = false;
    }, cooldown);

    return () => clearTimeout(timeout);
  }, dependencies);

  return bounceTrigger;
};

export default useBounceTrigger;
