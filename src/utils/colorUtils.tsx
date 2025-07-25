import { validPlatformColors } from "@/lib/constants/colors";

// ✅ 

export function isValidPlatformColor(color: string) {
    return validPlatformColors.includes(color);
}
