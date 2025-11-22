import ExpoModulesCore

public class SortableListModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SortableList")
    View(SortableListView.self)
  }
}
