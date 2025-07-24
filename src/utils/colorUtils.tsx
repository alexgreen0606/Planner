import { validPlatformColors } from "@/lib/constants/colors";

export const isValidPlatformColor = (color: string) => validPlatformColors.includes(color);
