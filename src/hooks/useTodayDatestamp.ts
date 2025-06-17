import { getTodayDatestamp } from "@/utils/dateUtils";
import { useEffect, useState } from "react";

export const useTodayDatestamp = () => {
    const [todayDatestamp, setTodayDatestamp] = useState(getTodayDatestamp());

    useEffect(() => {
        const updateTodayDatestamp = () => {
            setTodayDatestamp(getTodayDatestamp());
        };

        // Calculate milliseconds until next midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const msUntilMidnight = tomorrow.getTime() - now.getTime() + 100;

        // Set initial timeout for the next midnight
        const timeoutId = setTimeout(() => {
            updateTodayDatestamp();

            // Set up recurring interval every 24 hours after the first midnight
            const intervalId = setInterval(updateTodayDatestamp, 24 * 60 * 60 * 1000);

            // Store interval ID for cleanup
            return () => clearInterval(intervalId);
        }, msUntilMidnight);

        // Cleanup function
        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    return todayDatestamp;
};