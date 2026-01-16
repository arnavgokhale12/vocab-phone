import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Data Models

struct WordData: Codable {
    let wordId: String
    let term: String
    let definition: String
    let partOfSpeech: String
}

struct WordEntry: TimelineEntry {
    let date: Date
    let wordId: String
    let term: String
    let definition: String
    let partOfSpeech: String

    static var placeholder: WordEntry {
        WordEntry(
            date: Date(),
            wordId: "placeholder",
            term: "Word",
            definition: "Definition will appear here",
            partOfSpeech: "noun"
        )
    }
}

// MARK: - Timeline Provider

struct Provider: TimelineProvider {
    let suite = UserDefaults(suiteName: "group.com.anonymous.vocab-phone")

    func placeholder(in context: Context) -> WordEntry {
        WordEntry.placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (WordEntry) -> Void) {
        completion(getCurrentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WordEntry>) -> Void) {
        let entry = getCurrentEntry()
        let timeline = Timeline(
            entries: [entry],
            policy: .after(Date().addingTimeInterval(60 * 30))
        )
        completion(timeline)
    }

    private func getCurrentEntry() -> WordEntry {
        // Try to get structured word data first (stored as JSON string)
        if let jsonString = suite?.string(forKey: "widget_current_word"),
           let data = jsonString.data(using: .utf8),
           let word = try? JSONDecoder().decode(WordData.self, from: data) {
            return WordEntry(
                date: Date(),
                wordId: word.wordId,
                term: word.term,
                definition: word.definition,
                partOfSpeech: word.partOfSpeech
            )
        }

        // Fallback to simple daily_word string
        let term = suite?.string(forKey: "daily_word") ?? "No word"
        return WordEntry(
            date: Date(),
            wordId: "unknown",
            term: term,
            definition: "Open app to see definition",
            partOfSpeech: ""
        )
    }
}

// MARK: - Home Screen Widget View (systemSmall, systemMedium)

struct HomeScreenWidgetView: View {
    var entry: WordEntry

    var body: some View {
        ZStack {
            Color.black
            VStack(alignment: .leading, spacing: 8) {
                Text(entry.partOfSpeech)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.gray)
                Text(entry.term)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding()
        }
    }
}

// MARK: - Interactive Lock Screen Widget (iOS 17+)

@available(iOS 17.0, *)
struct InteractiveRectangularView: View {
    var entry: WordEntry
    @State private var revealed = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(entry.term)
                    .font(.system(size: 16, weight: .bold))
                Spacer()
                if !entry.partOfSpeech.isEmpty {
                    Text(entry.partOfSpeech)
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }

            if revealed {
                Text(entry.definition)
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                    .lineLimit(2)

                HStack(spacing: 12) {
                    Button(intent: RepeatIntent(wordId: entry.wordId)) {
                        HStack(spacing: 2) {
                            Image(systemName: "arrow.counterclockwise")
                            Text("Again")
                        }
                        .font(.system(size: 10, weight: .medium))
                    }
                    .buttonStyle(.plain)

                    Button(intent: GotItIntent(wordId: entry.wordId)) {
                        HStack(spacing: 2) {
                            Image(systemName: "checkmark")
                            Text("Got it")
                        }
                        .font(.system(size: 10, weight: .medium))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 2)
            } else {
                Button(action: {}) {
                    Text("Tap to reveal")
                        .font(.system(size: 11))
                        .foregroundColor(.blue)
                }
                .buttonStyle(.plain)
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        revealed = true
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Static Lock Screen Views (iOS 16, fallback)

@available(iOS 16.0, *)
struct RectangularLockScreenView: View {
    var entry: WordEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("TODAY'S WORD")
                .font(.system(size: 10, weight: .semibold))
                .opacity(0.7)
            Text(entry.term)
                .font(.system(size: 18, weight: .bold))
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

@available(iOS 16.0, *)
struct CircularLockScreenView: View {
    var entry: WordEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            Text(entry.term.prefix(4))
                .font(.system(size: 14, weight: .bold))
                .lineLimit(1)
        }
    }
}

@available(iOS 16.0, *)
struct InlineLockScreenView: View {
    var entry: WordEntry

    var body: some View {
        Text("Word: \(entry.term)")
            .lineLimit(1)
    }
}

// MARK: - Main Widget Entry View

struct VocabWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: WordEntry

    var body: some View {
        if #available(iOS 17.0, *) {
            switch widgetFamily {
            case .accessoryRectangular:
                InteractiveRectangularView(entry: entry)
            case .accessoryCircular:
                CircularLockScreenView(entry: entry)
            case .accessoryInline:
                InlineLockScreenView(entry: entry)
            default:
                HomeScreenWidgetView(entry: entry)
            }
        } else if #available(iOS 16.0, *) {
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
        .description("Learn vocabulary from your lock screen. Tap to reveal, then mark as known or repeat.")
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
