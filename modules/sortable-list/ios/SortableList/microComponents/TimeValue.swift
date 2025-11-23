import ExpoModulesCore
import SwiftUI

struct TimeValue: View {
    let time: String
    let indicator: String
    let detail: String?
    let disabled: Bool
    let onOpenTimeModal: () -> Void

    @State private var isPressed = false
    @State private var isInside = false
    @State private var frame: CGRect = .zero
    @State private var isVisible = false

    var body: some View {
        let pressGesture = DragGesture(minimumDistance: 0)
            .onChanged { value in
                // Check if touch is inside view bounds
                let pt = value.location
                let inside = frame.contains(pt)

                if inside {
                    // If entering inside for first time, animate down
                    if !isPressed {
                        isPressed = true
                        withAnimation(.linear(duration: 0.08)) {
                            isInside = true
                        }
                    }
                } else {
                    // If dragged out → cancel
                    if isPressed {
                        isPressed = false
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            isInside = false
                        }
                    }
                }
            }
            .onEnded { _ in
                // Gesture ended → lift finger
                if isInside {
                    // Valid tap → spring bounce + trigger action
                    withAnimation(
                        .spring(
                            response: 0.35,
                            dampingFraction: 0.22,
                            blendDuration: 0.1)
                    ) {
                        isPressed = false
                    }
                    onOpenTimeModal()
                } else {
                    // Cancelled → just reset scale
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        isPressed = false
                    }
                }

                // Reset after completion
                isInside = false
            }

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
        .background(
            GeometryReader { geo in
                Color.clear
                    .onAppear { frame = geo.frame(in: .local) }
                    .onChange(of: geo.size) { _ in
                        frame = geo.frame(in: .local)
                    }
            }
        )
        .contentShape(Rectangle())
        .scaleEffect(isPressed ? 0.8 : 1.0)
        .opacity(!isVisible ? 0 : isPressed ? 0.7 : 1)
        .animation(.easeIn(duration: 0.25), value: isVisible)
        // Up animation (springy bounce)
        .animation(
            .spring(),
            value: isPressed
        )

        .gesture(pressGesture)
        .onAppear { isVisible = true }
    }
}
