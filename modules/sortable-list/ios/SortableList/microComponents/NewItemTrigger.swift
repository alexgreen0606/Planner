import ExpoModulesCore
import SwiftUI

struct NewItemTrigger: View {
    let height: CGFloat
    let onCreateItem: () -> Void

    init(height: CGFloat = 8, onCreateItem: @escaping () -> Void) {
        self.height = height
        self.onCreateItem = onCreateItem
    }

    var body: some View {
        Rectangle()
            .fill(Color.clear)
            .frame(height: height)
            .contentShape(Rectangle())
            .onTapGesture(perform: onCreateItem)
    }
}
