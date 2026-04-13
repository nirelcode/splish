import ExpoModulesCore
import WidgetKit

public class WidgetSyncModule: Module {
    public func definition() -> ModuleDefinition {
        Name("WidgetSync")

        Function("updateWidgetData") { (json: String) in
            let defaults = UserDefaults(suiteName: "group.io.splish.app")
            defaults?.set(json, forKey: "splish_widget_data")
            defaults?.synchronize()
            // Reload all Splish widgets immediately
            WidgetCenter.shared.reloadTimelines(ofKind: "SplishWidget")
        }
    }
}
