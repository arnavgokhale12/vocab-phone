import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Data Models

struct WordData: Codable {
    let wordId: String
    let term: String
    let definition: String
    let partOfSpeech: String
    let pronunciation: String?
}

struct WordEntry: TimelineEntry {
    let date: Date
    let wordId: String
    let term: String
    let definition: String
    let partOfSpeech: String
    let pronunciation: String
    let definitionVisible: Bool

    static var placeholder: WordEntry {
        WordEntry(
            date: Date(),
            wordId: "placeholder",
            term: "Word",
            definition: "Definition will appear here",
            partOfSpeech: "noun",
            pronunciation: "/wɜːrd/",
            definitionVisible: false
        )
    }
}

// MARK: - Premium Design System

struct WidgetColors {
    static let gradientStart = Color(red: 0.15, green: 0.15, blue: 0.2)
    static let gradientEnd = Color(red: 0.08, green: 0.08, blue: 0.12)
    static let accentPurple = Color(red: 0.6, green: 0.4, blue: 1.0)
    static let accentBlue = Color(red: 0.4, green: 0.6, blue: 1.0)
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.7)
    static let textTertiary = Color.white.opacity(0.5)
    static let glassOverlay = Color.white.opacity(0.08)
    static let glassBorder = Color.white.opacity(0.15)
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
        let definitionVisible = suite?.bool(forKey: "widget_definition_visible") ?? false

        if let jsonString = suite?.string(forKey: "widget_current_word"),
           let data = jsonString.data(using: .utf8),
           let word = try? JSONDecoder().decode(WordData.self, from: data) {
            return WordEntry(
                date: Date(),
                wordId: word.wordId,
                term: word.term,
                definition: word.definition,
                partOfSpeech: word.partOfSpeech,
                pronunciation: word.pronunciation ?? "",
                definitionVisible: definitionVisible
            )
        }

        let term = suite?.string(forKey: "daily_word") ?? "No word"
        return WordEntry(
            date: Date(),
            wordId: "unknown",
            term: term,
            definition: "Open app to see definition",
            partOfSpeech: "",
            pronunciation: "",
            definitionVisible: definitionVisible
        )
    }
}

// MARK: - Home Screen Widget View (systemSmall, systemMedium)

struct HomeScreenWidgetView: View {
    var entry: WordEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: family == .systemSmall ? 6 : 10) {
            // Part of speech pill
            Text(entry.partOfSpeech.uppercased())
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .tracking(1.2)
                .foregroundColor(WidgetColors.accentPurple)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    Capsule()
                        .fill(WidgetColors.accentPurple.opacity(0.2))
                )

            // Word
            Text(entry.term)
                .font(.system(size: family == .systemSmall ? 22 : 26, weight: .bold, design: .rounded))
                .foregroundColor(WidgetColors.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            // Pronunciation with speaker button
            if !entry.pronunciation.isEmpty {
                HStack(spacing: 6) {
                    Text(entry.pronunciation)
                        .font(.system(size: family == .systemSmall ? 11 : 13, weight: .regular, design: .rounded))
                        .foregroundColor(WidgetColors.textTertiary)
                        .italic()

                    // Speaker button - deep links to app for audio playback
                    Link(destination: URL(string: "vocabphone://pronounce/\(entry.wordId)")!) {
                        Image(systemName: "speaker.wave.2.fill")
                            .font(.system(size: 12))
                            .foregroundColor(WidgetColors.accentBlue)
                    }
                }
            }

            // Definition
            Text(entry.definition)
                .font(.system(size: family == .systemSmall ? 11 : 13, weight: .regular, design: .rounded))
                .foregroundColor(WidgetColors.textSecondary)
                .lineLimit(family == .systemSmall ? 2 : 3)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)

            // Bottom accent line
            HStack(spacing: 4) {
                Circle()
                    .fill(WidgetColors.accentPurple)
                    .frame(width: 6, height: 6)
                Text("vocab")
                    .font(.system(size: 9, weight: .medium, design: .rounded))
                    .foregroundColor(WidgetColors.textTertiary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Enhanced Interactive Lock Screen Widget (iOS 17+)

@available(iOS 17.0, *)
struct InteractiveRectangularView: View {
    var entry: WordEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            // Large word - primary focus
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(entry.term)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .lineLimit(1)

                if !entry.pronunciation.isEmpty {
                    Text(entry.pronunciation)
                        .font(.system(size: 10, weight: .regular, design: .rounded))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            if entry.definitionVisible {
                // Short definition
                Text(entry.definition)
                    .font(.system(size: 11, weight: .regular, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                // Compact action buttons
                HStack(spacing: 8) {
                    Button(intent: ToggleDefinitionIntent()) {
                        Image(systemName: "eye.slash")
                            .font(.system(size: 11))
                    }
                    .buttonStyle(.plain)

                    Spacer()

                    Button(intent: RepeatIntent(wordId: entry.wordId)) {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.system(size: 11))
                            .foregroundStyle(.orange)
                    }
                    .buttonStyle(.plain)

                    Button(intent: GotItIntent(wordId: entry.wordId)) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(.green)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 2)
            } else {
                // Part of speech + reveal button
                HStack {
                    if !entry.partOfSpeech.isEmpty {
                        Text(entry.partOfSpeech.lowercased())
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Button(intent: ToggleDefinitionIntent()) {
                        HStack(spacing: 3) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 10))
                            Text("Reveal")
                                .font(.system(size: 10, weight: .medium, design: .rounded))
                        }
                        .foregroundStyle(.blue)
                    }
                    .buttonStyle(.plain)
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
            Text(entry.term)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .lineLimit(1)
            if !entry.partOfSpeech.isEmpty {
                Text(entry.partOfSpeech.lowercased())
                    .font(.system(size: 11, weight: .medium))
                    .opacity(0.7)
            }
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
                    .containerBackground(for: .widget) {
                        ZStack {
                            LinearGradient(
                                colors: [WidgetColors.gradientStart, WidgetColors.gradientEnd],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                            Circle()
                                .fill(
                                    RadialGradient(
                                        colors: [WidgetColors.accentPurple.opacity(0.25), .clear],
                                        center: .center,
                                        startRadius: 0,
                                        endRadius: 150
                                    )
                                )
                                .offset(x: -50, y: -30)
                                .blur(radius: 40)
                        }
                    }
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
