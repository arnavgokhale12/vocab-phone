import Foundation
import WidgetKit

@objc(AppGroupStore)
class AppGroupStore: NSObject {

    @objc
    func setString(_ key: String, value: String) {
        let suite = UserDefaults(suiteName: "group.com.anonymous.vocab-phone")
        suite?.set(value, forKey: key)
        suite?.synchronize()

        // Reload widget timelines (must be on main thread)
        DispatchQueue.main.async {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    @objc
    func getString(_ key: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let suite = UserDefaults(suiteName: "group.com.anonymous.vocab-phone")
        let value = suite?.string(forKey: key)
        resolve(value)
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
