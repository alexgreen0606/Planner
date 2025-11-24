import ExpoModulesCore
import SwiftUI

final class SortableListProps: ExpoSwiftUI.ViewProps {
  @Field var toolbarIcons: [String] = []
  @Field var accentColor: Color = Color.blue
  @Field var focusedId: String?
  @Field var topInset: CGFloat = 0
  @Field var bottomInset: CGFloat = 0
  @Field var sortedItemIds: [String] = []
  @Field var itemValueMap: [String: String] = [:]
  @Field var itemTextColorsMap: [String: Color] = [:]
  @Field var itemTimeValuesMap: [String: [String: String]]?
  @Field var selectedItemIds: [String] = []
  @Field var disabledItemIds: [String] = []
  var onMoveItem = EventDispatcher()
  var onToolbarPress = EventDispatcher()
  var onFocusChange = EventDispatcher()
  var onDeleteItem = EventDispatcher()
  var onValueChange = EventDispatcher()
  var onCreateItem = EventDispatcher()
  var onToggleItem = EventDispatcher()
  var onOpenTimeModal = EventDispatcher()
  var onScrollChange = EventDispatcher()
}

struct SortableListView: ExpoSwiftUI.View {
  typealias Props = SortableListProps
  @ObservedObject var props: SortableListProps

  @State private var lastDragY: CGFloat? = nil

  private var selectedIds: Set<String> { Set(props.selectedItemIds) }
  private var disabledIds: Set<String> { Set(props.disabledItemIds) }

  init(props: SortableListProps) {
    self.props = props
  }

  var body: some View {
    ZStack(alignment: .bottom) {

      // Screen Content
      VStack(spacing: 0) {
        // List Rows
        let list = List {
          Section {
            // Upper Item Trigger
            NewItemTrigger(onCreateItem: {
              props.onCreateItem(["baseId": props.sortedItemIds.first])
            })
          }
          .listRowInsets(EdgeInsets())
          .listSectionSeparator(.hidden, edges: .top)
          .listSectionSeparatorTint(Color(uiColor: .quaternaryLabel))
          Section {
            ForEach(props.sortedItemIds, id: \.self) { itemId in
              ListItem(
                id: itemId,
                value: props.itemValueMap[itemId] ?? "Error Loading Data",
                isSelected: selectedIds.contains(itemId),
                isSelectDisabled: disabledIds.contains(itemId),
                accentColor: props.accentColor,
                textColor: props.itemTextColorsMap[itemId] ?? Color(uiColor: .label),
                timeValues: props.itemTimeValuesMap?[itemId],
                onValueChange: props.onValueChange,
                onDeleteItem: props.onDeleteItem,
                onFocusChange: props.onFocusChange,
                onCreateItem: props.onCreateItem,
                onToggleItem: props.onToggleItem,
                onOpenTimeModal: props.onOpenTimeModal
              )
            }
            .onMove(perform: handleMove)
          } footer: {
            // Lower Item Trigger
            NewItemTrigger(onCreateItem: handleCreateLowerItem)
              .listRowInsets(EdgeInsets())
              .listRowSeparator(.hidden, edges: .bottom)
          }
        }
        .simultaneousGesture(
          DragGesture()
            .onChanged { value in
              let currentY = value.location.y

              if let lastDragY {
                let diff = currentY - lastDragY

                if diff < 0 {
                  props.onScrollChange(["isScrollingDown": true])
                } else if diff > 0 {
                  props.onScrollChange(["isScrollingDown": false])
                }
              }

              lastDragY = currentY
            }
            .onEnded { _ in
              lastDragY = nil
            }
        )
        .listStyle(.plain)
        .environment(\.defaultMinListRowHeight, 0)
        .animation(.default, value: props.sortedItemIds)

        if #available(iOS 17.0, *) {
          list
            .safeAreaPadding(.top, props.topInset ?? 0)
            .safeAreaPadding(.bottom, props.bottomInset ?? 0)
        } else {
          list
        }
      }

      // Toolbar
      HStack {
        if #available(iOS 26.0, *) {
          GlassEffectContainer {
            HStack(spacing: 16) {
              ForEach(props.toolbarIcons, id: \.self) { icon in
                Button {
                  props.onToolbarPress([
                    "icon": icon,
                    "itemId": props.focusedId,
                  ])
                } label: {
                  Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(Color(uiColor: .label))
                }
                .frame(width: 22, height: 22)
              }
            }
          }
          .padding(12)
          .glassEffect()

          Spacer()

          GlassEffectContainer {
            Button {
              handleCreateLowerItem()
            } label: {
              Image(systemName: props.focusedId != nil ? "checkmark" : "plus")
                .font(.system(size: 20))
                .foregroundColor(props.accentColor)
            }
            .frame(width: 22, height: 22)
          }
          .padding(12)
          .glassEffect()
        }
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 12)
      .frame(maxWidth: .infinity)
    }
  }

  private func handleMove(from sources: IndexSet, to destination: Int) {
    for source in sources {
      var to = destination

      if to > source {
        to -= 1
      }

      props.onMoveItem([
        "from": source,
        "to": to,
      ])
    }
  }

  private func handleCreateLowerItem() {
    let baseId = props.sortedItemIds.last
    props.onCreateItem([
      "baseId": baseId,
      "offset": 1,
    ])
  }

}
