import ExpoModulesCore
import SwiftUI

final class SortableListProps: ExpoSwiftUI.ViewProps {
  @Field var toolbarIcons: [String] = []
  @Field var accentColor: Color = Color.blue
  @Field var topInset: CGFloat = 0
  @Field var bottomInset: CGFloat = 0
  @Field var slideToIdTrigger: String? = nil
  @Field var snapToIdTrigger: String? = nil
  @Field var sortedItemIds: [String] = []
  @Field var itemValueMap: [String: String] = [:]
  @Field var itemTextColorsMap: [String: Color] = [:]
  @Field var itemTimeValuesMap: [String: [String: String]]?
  @Field var selectedItemIds: [String] = []
  @Field var disabledItemIds: [String] = []
  var onMoveItem = EventDispatcher()
  var onToolbarPress = EventDispatcher()
  var onDeleteItem = EventDispatcher()
  var onValueChange = EventDispatcher()
  var onCreateItem = EventDispatcher()
  var onToggleItem = EventDispatcher()
  var onOpenTimeModal = EventDispatcher()
  var onScrollChange = EventDispatcher()
}

class FocusController: ObservableObject {
  @Published var focusedId: String?
}

struct SortableListView: ExpoSwiftUI.View {
  typealias Props = SortableListProps
  @ObservedObject var props: SortableListProps

  @State private var lastDragY: CGFloat? = nil

  @StateObject var focusController = FocusController()

  private var selectedIds: Set<String> { Set(props.selectedItemIds) }
  private var disabledIds: Set<String> { Set(props.disabledItemIds) }

  @State private var scrollProxy: ScrollViewProxy?

  init(props: SortableListProps) {
    self.props = props
  }

  var body: some View {
    // ZStack(alignment: .bottom) {
    NavigationStack {

      // Screen Content
      VStack(spacing: 0) {
        // List Rows
        ScrollViewReader { proxy in
          List {
            Section {
              // Upper Item Trigger
              NewItemTrigger(onCreateItem: {
                props.onCreateItem(["baseId": props.sortedItemIds.first])
              })
            }
            .listRowInsets(EdgeInsets())
            .listSectionSeparator(.hidden, edges: .top)
            .listSectionSeparator(props.sortedItemIds.isEmpty ? .hidden : .visible, edges: .bottom)
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
                  onCreateItem: props.onCreateItem,
                  onToggleItem: props.onToggleItem,
                  onOpenTimeModal: props.onOpenTimeModal
                )
                .id(itemId)
                .environmentObject(focusController)
              }
              .onMove(perform: handleMove)
            } footer: {
              // Lower Item Trigger
              NewItemTrigger(onCreateItem: handleCreateLowerItem)
                .listRowInsets(EdgeInsets())
                .listRowSeparator(.hidden, edges: .bottom)
            }
          }
          .onAppear {
            scrollProxy = proxy
          }
          .listStyle(.plain)
          .environment(\.defaultMinListRowHeight, 0)
          .animation(.default, value: props.sortedItemIds)
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
          .safeAreaPadding(.top, props.topInset ?? 0)
          .safeAreaPadding(.bottom, props.bottomInset ?? 0)

          // Snap to an item.
          .onChange(of: props.slideToIdTrigger) { slideToIdTrigger in
            guard let slideToIdTrigger,
              let proxy = scrollProxy
            else { return }
            withAnimation(.easeInOut) {
              proxy.scrollTo(slideToIdTrigger, anchor: .bottom)
            }
          }

          // Slide to an item.
          .onChange(of: props.snapToIdTrigger) { snapToIdTrigger in
            guard let snapToIdTrigger,
              let proxy = scrollProxy
            else { return }
            proxy.scrollTo(snapToIdTrigger, anchor: .bottom)
          }

          // .toolbar {
          //   // --- Keyboard Toolbar ---
          //   ToolbarItemGroup(placement: .keyboard) {
          //     Button("Cancel") {}
          //     Spacer()
          //     Text("Title").bold()
          //     Spacer()
          //     Button("Done") {}
          //   }
          // }
          .toolbar {
            // --- Bottom Bar Toolbar ---
            ToolbarItemGroup(placement: .topBarTrailing) {
              Button("Cancel") {}
              Spacer()
              Text("Title").bold()
              Spacer()
              Button("Done") {}
            }
          }
        }
      }

      // Toolbar
      // HStack {
      //   let isItemFocused = focusController.focusedId != nil
      //   Button {
      //     if isItemFocused {
      //       focusController.focusedId = nil
      //     } else {
      //       handleCreateLowerItem()
      //     }
      //   } label: {
      //     Image(systemName: isItemFocused ? "checkmark" : "plus")
      //       .font(.system(size: 24))
      //       .fontWeight(.light)
      //       .foregroundColor(props.accentColor)
      //       .contentTransition(.symbolEffect(.replace))
      //       .animation(.linear(duration: 0.2), value: isItemFocused)
      //       .padding(4)
      //   }
      //   .buttonStyle(.glass)
      //   .buttonBorderShape(.circle)

      //   Spacer()

      //   HStack(spacing: 16) {
      //     ForEach(props.toolbarIcons, id: \.self) { icon in
      //       Button {
      //         props.onToolbarPress([
      //           "icon": icon,
      //           "itemId": focusController.focusedId,
      //         ])
      //       } label: {
      //         Image(systemName: icon)
      //           .font(.system(size: 24))
      //           .foregroundColor(Color(uiColor: .label))
      //           .fontWeight(.light)
      //           .padding(4)
      //       }
      //       .buttonStyle(.glass)
      //       .buttonBorderShape(.circle)
      //     }
      //   }
      // }
      // .padding(.horizontal, 24)
      // .padding(.vertical, 8)
      // .frame(maxWidth: .infinity)
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
      "shouldSlideTo": true,
    ])
  }

}
