import { validPlatformColors } from "@/lib/constants/platformColors";

export const isValidPlatformColor = (color: string) => validPlatformColors.includes(color);
