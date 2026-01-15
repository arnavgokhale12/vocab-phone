const {
  withXcodeProject,
  withEntitlementsPlist,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const WIDGET_NAME = "VocabWidget";
const APP_GROUP_ID = "group.com.anonymous.vocab-phone";

// Widget Swift code
const WIDGET_SWIFT = `import WidgetKit
import SwiftUI

struct WordEntry: TimelineEntry {
    let date: Date
    let word: String
}

struct Provider: TimelineProvider {
    let suite = UserDefaults(suiteName: "${APP_GROUP_ID}")

    func placeholder(in context: Context) -> WordEntry {
        WordEntry(date: Date(), word: "Word")
    }

    func getSnapshot(in context: Context, completion: @escaping (WordEntry) -> Void) {
        let word = suite?.string(forKey: "daily_word") ?? "No word"
        completion(WordEntry(date: Date(), word: word))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WordEntry>) -> Void) {
        let word = suite?.string(forKey: "daily_word") ?? "No word"
        let entry = WordEntry(date: Date(), word: word)

        let timeline = Timeline(
            entries: [entry],
            policy: .after(Date().addingTimeInterval(60 * 30))
        )

        completion(timeline)
    }
}

// MARK: - Home Screen Widget View (systemSmall, systemMedium)
struct HomeScreenWidgetView: View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            Color.black
            Text(entry.word)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .padding()
        }
    }
}

// MARK: - Lock Screen Widget Views (iOS 16+)
@available(iOS 16.0, *)
struct RectangularLockScreenView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("TODAY'S WORD")
                .font(.system(size: 10, weight: .semibold))
                .opacity(0.7)
            Text(entry.word)
                .font(.system(size: 18, weight: .bold))
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

@available(iOS 16.0, *)
struct CircularLockScreenView: View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            Text(entry.word.prefix(4))
                .font(.system(size: 14, weight: .bold))
                .lineLimit(1)
        }
    }
}

@available(iOS 16.0, *)
struct InlineLockScreenView: View {
    var entry: Provider.Entry

    var body: some View {
        Text("Word: \\(entry.word)")
            .lineLimit(1)
    }
}

// MARK: - Main Widget Entry View
struct VocabWidgetEntryView: View {
    @Environment(\\.widgetFamily) var widgetFamily
    var entry: Provider.Entry

    var body: some View {
        if #available(iOS 16.0, *) {
            switch widgetFamily {
            case .accessoryRectangular:
                RectangularLockScreenView(entry: entry)
            case .accessoryCircular:
                CircularLockScreenView(entry: entry)
            case .accessoryInline:
                InlineLockScreenView(entry: entry)
            default:
                HomeScreenWidgetView(entry: entry)
            }
        } else {
            HomeScreenWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget Configuration
struct VocabWidget: Widget {
    let kind = "VocabWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                VocabWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                VocabWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Vocab Word")
        .description("Your daily vocabulary word on your home or lock screen.")
        .supportedFamilies(supportedFamilies)
    }

    private var supportedFamilies: [WidgetFamily] {
        if #available(iOS 16.0, *) {
            return [
                .systemSmall,
                .systemMedium,
                .accessoryRectangular,
                .accessoryCircular,
                .accessoryInline
            ]
        } else {
            return [.systemSmall, .systemMedium]
        }
    }
}
`;

const WIDGET_BUNDLE_SWIFT = `import WidgetKit
import SwiftUI

@main
struct VocabWidgetBundle: WidgetBundle {
    var body: some Widget {
        VocabWidget()
    }
}
`;

const APP_INTENT_SWIFT = `import WidgetKit
import AppIntents

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }
    static var description: IntentDescription { "This is an example widget." }
}
`;

// Native module for App Groups communication
const APP_GROUP_STORE_SWIFT = `import Foundation
import WidgetKit

@objc(AppGroupStore)
class AppGroupStore: NSObject {

    @objc
    func setString(_ key: String, value: String) {
        let suite = UserDefaults(suiteName: "${APP_GROUP_ID}")
        suite?.set(value, forKey: key)
        suite?.synchronize()

        // Reload widget timelines
        WidgetCenter.shared.reloadAllTimelines()
    }

    @objc
    func getString(_ key: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let suite = UserDefaults(suiteName: "${APP_GROUP_ID}")
        let value = suite?.string(forKey: key)
        resolve(value)
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
`;

const APP_GROUP_STORE_M = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppGroupStore, NSObject)

RCT_EXTERN_METHOD(setString:(NSString *)key value:(NSString *)value)
RCT_EXTERN_METHOD(getString:(NSString *)key resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
`;

const WIDGET_INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>Vocab Widget</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>
`;

const WIDGET_ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP_ID}</string>
    </array>
</dict>
</plist>
`;

// Add App Groups entitlement to main app
const withAppGroupsEntitlement = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.security.application-groups"] = [APP_GROUP_ID];
    return config;
  });
};

// Write widget files to iOS directory
const withWidgetFiles = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosPath = config.modRequest.platformProjectRoot;
      const widgetPath = path.join(iosPath, WIDGET_NAME);

      // Create widget directory
      if (!fs.existsSync(widgetPath)) {
        fs.mkdirSync(widgetPath, { recursive: true });
      }

      // Write widget files
      fs.writeFileSync(
        path.join(widgetPath, "VocabWidget.swift"),
        WIDGET_SWIFT
      );
      fs.writeFileSync(
        path.join(widgetPath, "VocabWidgetBundle.swift"),
        WIDGET_BUNDLE_SWIFT
      );
      fs.writeFileSync(
        path.join(widgetPath, "AppIntent.swift"),
        APP_INTENT_SWIFT
      );
      fs.writeFileSync(path.join(widgetPath, "Info.plist"), WIDGET_INFO_PLIST);
      fs.writeFileSync(
        path.join(iosPath, "VocabWidgetExtension.entitlements"),
        WIDGET_ENTITLEMENTS
      );

      // Create Native directory and write native module files
      const appName = config.modRequest.projectName;
      const nativePath = path.join(iosPath, appName, "Native");
      if (!fs.existsSync(nativePath)) {
        fs.mkdirSync(nativePath, { recursive: true });
      }

      fs.writeFileSync(
        path.join(nativePath, "AppGroupStore.swift"),
        APP_GROUP_STORE_SWIFT
      );
      fs.writeFileSync(
        path.join(nativePath, "AppGroupStore.m"),
        APP_GROUP_STORE_M
      );

      // Update bridging header to include React Native bridge
      const bridgingHeaderPath = path.join(
        iosPath,
        appName,
        `${appName}-Bridging-Header.h`
      );
      const bridgingHeaderContent = `//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//
#import <React/RCTBridgeModule.h>
`;
      fs.writeFileSync(bridgingHeaderPath, bridgingHeaderContent);

      // Create main app entitlements
      const mainEntitlementsPath = path.join(
        iosPath,
        appName,
        `${appName}.entitlements`
      );
      const mainEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP_ID}</string>
    </array>
</dict>
</plist>
`;
      fs.writeFileSync(mainEntitlementsPath, mainEntitlements);

      return config;
    },
  ]);
};

// Add native module files to Xcode project and configure entitlements
const withNativeModuleAndEntitlements = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const appName = config.modRequest.projectName;

    // Find the main app group
    const mainGroupKey = xcodeProject.findPBXGroupKey({ name: appName });

    if (mainGroupKey) {
      // Add native module Swift file to the project
      xcodeProject.addSourceFile(
        `${appName}/Native/AppGroupStore.swift`,
        { target: xcodeProject.getFirstTarget().uuid },
        mainGroupKey
      );

      // Add native module Obj-C file to the project
      xcodeProject.addSourceFile(
        `${appName}/Native/AppGroupStore.m`,
        { target: xcodeProject.getFirstTarget().uuid },
        mainGroupKey
      );
    }

    // Update build settings for main app - add entitlements
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    const bundleId =
      config.ios?.bundleIdentifier || `com.anonymous.${appName}`;

    Object.keys(configurations).forEach((key) => {
      const buildConfig = configurations[key];
      if (
        buildConfig.buildSettings &&
        buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === bundleId
      ) {
        buildConfig.buildSettings.CODE_SIGN_ENTITLEMENTS = `${appName}/${appName}.entitlements`;
      }
    });

    return config;
  });
};

// Main plugin
const withVocabWidget = (config) => {
  config = withAppGroupsEntitlement(config);
  config = withWidgetFiles(config);
  config = withNativeModuleAndEntitlements(config);
  return config;
};

module.exports = withVocabWidget;
