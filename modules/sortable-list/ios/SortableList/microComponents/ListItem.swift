import Combine
import ExpoModulesCore
import SwiftUI

final class TextDebouncer: ObservableObject {
  @Published var text: String = ""
}

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
  let onFocusChange: EventDispatcher
  let onCreateItem: EventDispatcher
  let onToggleItem: EventDispatcher
  let onOpenTimeModal: EventDispatcher

  @StateObject private var debouncer = TextDebouncer()

  @State private var isFocused: Bool = false
  @State private var debounceTask: Task<Void, Never>? = nil

  var body: some View {
    VStack(alignment: .center, spacing: 0) {
      // Upper Item Trigger
      NewItemTrigger(onCreateItem: {
        onCreateItem(["baseId": id])
      })

      // Row Content
      let row = HStack(spacing: 12) {
        // Item Toggle
        ListItemToggle(
          isSelected: isSelected, isDisabled: isSelectDisabled, accentColor: accentColor
        ) {
          onToggleItem(["id": id])
        }

        // Text
        ZStack(alignment: .leading) {
          Text(debouncer.text)
            .foregroundColor(textColor)
            .opacity(isFocused ? 0 : 1)
            .font(.system(size: 16))

          NonBlurringTextField(
            text: $debouncer.text,
            isFocused: $isFocused,
          ) {
            if !debouncer.text.isEmpty {
              onCreateItem(["baseId": id, "offset": 1])
            } else {
              isFocused = false
            }
          }
          .foregroundColor(textColor)
          .opacity(isFocused ? 1 : 0)
          .tint(accentColor)
        }
        .contentShape(Rectangle())
        .onTapGesture {
          if !isSelected {
            isFocused = true
          }
        }

        // Optional Time Value
        if let timeValues = timeValues {
          TimeValue(
            time: timeValues["time"] ?? "",
            indicator: timeValues["indicator"] ?? "",
            detail: timeValues["detail"] ?? "",
            disabled: isSelected
          ) {
            onOpenTimeModal(["id": id])
          }
        }
      }
      .frame(height: 30)
      .onChange(of: debouncer.text) { newValue in
        guard newValue != value else { return }

        debounceTask?.cancel()

        debounceTask = Task {
          try? await Task.sleep(nanoseconds: 1_000_000_000)  // 1 second
          guard !Task.isCancelled else { return }
          onValueChange(["value": newValue])
        }
      }
      .onAppear {
        debouncer.text = value
        if value.isEmpty { isFocused = true }
      }
      .onChange(of: value) { newValue in
        if newValue != debouncer.text {
          debouncer.text = newValue
        }
      }
      .onChange(of: isSelected) { selected in
        if selected == true {
          isFocused = false
        }
      }
      .onChange(of: isFocused) { focused in
        if focused {
          onFocusChange(["id": id])
        } else {
          debounceTask?.cancel()

          let trimmed = debouncer.text.trimmingCharacters(in: .whitespacesAndNewlines)

          if trimmed.isEmpty {
            onDeleteItem(["id": id])
          } else if trimmed != value {
            onValueChange(["value": trimmed])
          }
        }
      }

      if #available(iOS 16.0, *) {
        row.alignmentGuide(.listRowSeparatorTrailing) {
          $0[.trailing]
        }
      } else {
        row
      }

      // Lower Item Trigger
      NewItemTrigger(onCreateItem: {
        onCreateItem(["baseId": id, "offset": 1])
      })
    }
    .listRowInsets(EdgeInsets())
  }
}
