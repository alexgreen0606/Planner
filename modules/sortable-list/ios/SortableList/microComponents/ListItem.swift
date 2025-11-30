import ExpoModulesCore
import SwiftUI

struct ListItem: View {
  let id: String
  let value: String
  let isSelected: Bool
  let isSelectDisabled: Bool
  let accentColor: Color
  let textColor: Color
  let timeValues: [String: String]?
  let onValueChange: EventDispatcher
  let onDeleteItem: EventDispatcher
  let onCreateItem: EventDispatcher
  let onToggleItem: EventDispatcher
  let onOpenTimeModal: EventDispatcher

  // Will be updated dynamically within the NonBlurringTextfield.
  @State private var height: CGFloat = 0

  @EnvironmentObject var focusController: FocusController

  @State private var text: String = ""
  @State private var isFocused: Bool = false
  @State private var debounceTask: Task<Void, Never>? = nil

  var body: some View {
    VStack(alignment: .center, spacing: 0) {
      // Upper Item Trigger
      NewItemTrigger(onCreateItem: {
        onCreateItem(["baseId": id])
      })

      // Row Content
      HStack(alignment: .top, spacing: 12) {
        // Item Toggle
        HStack(alignment: .center) {
          ListItemToggle(
            isSelected: isSelected, isDisabled: isSelectDisabled, accentColor: accentColor
          ) {
            onToggleItem(["id": id])
          }
        }
        .frame(height: 26)

        // Text
        ZStack(alignment: .leading) {
          Text(text)
            .foregroundColor(textColor)
            .opacity(isFocused ? 0 : 1)
            .font(.system(size: 14))
            .lineLimit(nil)
            .fixedSize(horizontal: false, vertical: true)

          NonBlurringTextField(
            text: $text,
            isFocused: $isFocused,
            height: $height
          ) {
            if !text.isEmpty {
              onCreateItem(["baseId": id, "offset": 1])
            } else {
              focusController.focusedId = nil
            }
          }
          .frame(height: height)
          .foregroundColor(textColor)
          .opacity(isFocused ? 1 : 0)
          .tint(accentColor)
          .frame(maxWidth: .infinity, alignment: .leading)
          .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 5)

        // Optional Time Value
        if let timeValues = timeValues {
          HStack(alignment: .center) {
            TimeValue(
              time: timeValues["time"] ?? "",
              indicator: timeValues["indicator"] ?? "",
              detail: timeValues["detail"] ?? "",
              disabled: isSelected
            ) {
              onOpenTimeModal(["id": id])
            }
          }
          .frame(height: 26)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .contentShape(Rectangle())
      .alignmentGuide(.listRowSeparatorTrailing) {
        $0[.trailing]
      }
      .onTapGesture {
        if !isSelected {
          isFocused = true
        }
      }
      .onAppear {
        text = value
        if value.isEmpty {
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            isFocused = true
          }
        }
      }

      // Debounce the external save each time the text changes.
      .onChange(of: text) { newValue in
        guard newValue != value else { return }

        debounceTask?.cancel()

        debounceTask = Task {
          try? await Task.sleep(nanoseconds: 1_000_000_000)  // 1 second
          guard !Task.isCancelled else { return }
          onValueChange(["value": newValue, "id": id])
        }
      }

      // Sync text when value changes externally.
      .onChange(of: value) { newValue in
        if text != newValue {
          text = newValue  // TODO: not working properly.
        }
      }

      // Blur the textfield when this item has been selected.
      .onChange(of: isSelected) { selected in
        if selected == true {
          isFocused = false
        }
      }

      // Handle focus side effects.
      .onChange(of: isFocused) { focused in
        if focused {
          // Mark the global focused ID so other fields are blurred.
          focusController.focusedId = id
        } else {
          // Immediately trigger the item save.
          debounceTask?.cancel()

          let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)

          if trimmed.isEmpty {
            onDeleteItem(["id": id])
          } else if trimmed != value {
            onValueChange(["value": trimmed, "id": id])
          }
        }
      }

      // Blur the textfield when a different field is focused.
      .onChange(of: focusController.focusedId) { focusedId in
        if focusedId != id,
          isFocused == true
        {
          isFocused = false
        }
      }

      // Lower Item Trigger
      NewItemTrigger(onCreateItem: {
        onCreateItem(["baseId": id, "offset": 1])
      })
    }
    .frame(maxWidth: .infinity, alignment: .top)
    .listRowInsets(EdgeInsets())
    .listRowSeparatorTint(Color(uiColor: .quaternaryLabel))
    .listRowBackground(Color.clear)
    .padding(.horizontal, 16)
  }
}
