export const iconMap = {
    transfer: 'arrow.uturn.right',
    recurringCalendar: 'arrow.trianglehead.2.clockwise.rotate.90',
    recurringTime: 'clock.arrow.trianglehead.2.counterclockwise.rotate.90',
    folder: 'folder.fill',
    folderThin: 'folder',
    openFolder: 'folder.fill',
    checklist: 'list.bullet',
    calendar: 'calendar',
    plannerStack: 'square.stack',
    lists: 'list.bullet.clipboard',
    coffee: 'cup.and.saucer.fill',
    add: 'plus',
    edit: 'pencil',
    note: 'note',
    chevronLeft: 'chevron.left',
    chevronDown: 'chevron.down',
    chevronUp: 'chevron.up',
    chevronRight: 'chevron.right',
    circleFilled: 'inset.filled.circle',
    circle: 'circle',
    trash: 'trash',
    more: 'ellipsis.circle',
    megaphone: 'megaphone',
    globe: 'globe.americas.fill',
    birthday: 'gift',
    clock: 'clock',
    message: 'message',
    messageFilled: 'checkmark.message',
    alert: 'exclamationmark.triangle',
    refresh: 'arrow.trianglehead.counterclockwise',
    refreshComplete: 'checkmark.arrow.trianglehead.counterclockwise',
    turnDown: 'arrow.turn.right.down',
    turnUp: 'arrow.turn.left.up',
    deleteTime: 'clock.badge.xmark',

    // TODO; choose which to use
    sunny: "sun.max.fill",
    sunnyWithClouds: "cloud.sun.fill",
    cloudy: "cloud.fill",
    foggy: "cloud.fog.fill",
    rainyWithSun: "cloud.sun.rain.fill",
    rain: "cloud.rain.fill",
    snow: "snowflake",
    thunderstorm: "cloud.bolt.rain.fill",


};

export type TIconType = keyof typeof iconMap;

export const sizeMap = {
    xs: 14,
    ms: 16,
    s: 18,
    m: 20,
    l: 22,
    ml: 30,
    xl: 46
};