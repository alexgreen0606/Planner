import ExpoModulesCore
import SwiftUI

struct ListItemToggle: View {
    let isSelected: Bool
    let isDisabled: Bool
    let accentColor: Color
    let onToggleItem: () -> Void

    var body: some View {
        let img = Image(systemName: isSelected ? "circle.inset.filled" : "circle")
            .onTapGesture(perform: onToggleItem)
            .imageScale(.medium)
            .foregroundStyle(
                isDisabled
                    ? Color(uiColor: .tertiaryLabel)
                    : isSelected
                        ? accentColor
                        : Color(uiColor: .secondaryLabel),
                isDisabled
                    ? Color(uiColor: .tertiaryLabel)
                    : isSelected
                        ? Color(uiColor: .secondaryLabel)
                        : accentColor
            )

        if #available(iOS 17.0, *) {
            img
                .symbolEffect(.bounce.down, value: isSelected)
                .fontWeight(.thin)
        } else {
            img
        }
    }
}
