import ExpoModulesCore
import SwiftUI

struct TimeValue: View {
    let time: String
    let indicator: String
    let detail: String?
    let disabled: Bool
    let onOpenTimeModal: () -> Void

    @State private var isBouncing = false
    @State private var isVisible = false

    var body: some View {
        HStack(alignment: .top, spacing: 1) {
            // Time Value (12:30)
            Text(time)
                .font(.system(size: 14, weight: .black, design: .rounded))
                .foregroundStyle(
                    disabled ? Color(uiColor: .tertiaryLabel) : Color(.systemBlue)
                )
            // Indicator (PM / AM)
            Text(indicator)
                .font(.system(size: 7, weight: .medium))
                .foregroundStyle(disabled ? Color(uiColor: .tertiaryLabel) : Color.secondary)
        }
        .overlay(alignment: .topLeading) {
            if let detail = detail {
                // Multi-Day Detail (START / END)
                Text(detail)
                    .font(.system(size: 7, weight: .medium))
                    .foregroundStyle(disabled ? Color(uiColor: .tertiaryLabel) : Color.secondary)
                    .offset(y: 16)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            isBouncing = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                isBouncing = false
            }
            onOpenTimeModal()
        }
        .scaleEffect(isBouncing ? 0.9 : 1.0)
        .opacity(isVisible ? 1 : 0)
        .animation(.easeIn(duration: 0.25), value: isVisible)
        .onAppear { isVisible = true }
        .animation(.spring(response: 0.4, dampingFraction: 0.1), value: isBouncing)
    }
}
