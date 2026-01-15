import WidgetKit
import SwiftUI

struct WordEntry: TimelineEntry {
    let date: Date
    let word: String
}

struct Provider: TimelineProvider {
    let suite = UserDefaults(suiteName: "group.com.anonymous.vocab-phone")

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
        Text("Word: \(entry.word)")
            .lineLimit(1)
    }
}

// MARK: - Main Widget Entry View
struct VocabWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
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
