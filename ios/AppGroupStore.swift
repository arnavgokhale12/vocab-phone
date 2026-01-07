import Foundation
import React
import WidgetKit

@objc(AppGroupStore)
class AppGroupStore: NSObject {

  private let suiteName = "group.com.anonymous.vocab-phone"

  @objc(setString:value:)
  func setString(_ key: String, value: String) {
      guard let defaults = UserDefaults(suiteName: suiteName) else { return }
      defaults.set(value, forKey: key)
      WidgetCenter.shared.reloadAllTimelines()
  }

  @objc(getString:resolver:rejecter:)
  func getString(_ key: String,
                 resolver resolve: RCTPromiseResolveBlock,
                 rejecter reject: RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: suiteName) else {
      resolve(nil)
      return
    }
    resolve(defaults.string(forKey: key))
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
