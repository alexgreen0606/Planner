import { useScrollDirectionRegistry } from '@/providers/ScrollDirectionRegistry';

const useCollapsedHeaderSwift = (key: string) => {
    const { scrollDirectionMap, onTrackIsScrollingDown } = useScrollDirectionRegistry();

    function handleSetIsScrollingDown(isScrollingDown: boolean) {
        onTrackIsScrollingDown(key, isScrollingDown);
    }

    return {
        isCollapsed: scrollDirectionMap[key] ?? false,
        onSetIsScrollingDown: handleSetIsScrollingDown
    };
};

export default useCollapsedHeaderSwift;