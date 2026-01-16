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
    let definitionVisible: Bool

    static var placeholder: WordEntry {
        WordEntry(
            date: Date(),
            wordId: "placeholder",
            term: "Word",
            definition: "Definition will appear here",
            partOfSpeech: "noun",
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
        // Read definition visibility state
        let definitionVisible = suite?.bool(forKey: "widget_definition_visible") ?? false

        // Try to get structured word data first (stored as JSON string)
        if let jsonString = suite?.string(forKey: "widget_current_word"),
           let data = jsonString.data(using: .utf8),
           let word = try? JSONDecoder().decode(WordData.self, from: data) {
            return WordEntry(
                date: Date(),
                wordId: word.wordId,
                term: word.term,
                definition: word.definition,
                partOfSpeech: word.partOfSpeech,
                definitionVisible: definitionVisible
            )
        }

        // Fallback to simple daily_word string
        let term = suite?.string(forKey: "daily_word") ?? "No word"
        return WordEntry(
            date: Date(),
            wordId: "unknown",
            term: term,
            definition: "Open app to see definition",
            partOfSpeech: "",
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

// MARK: - Interactive Lock Screen Widget (iOS 17+)

@available(iOS 17.0, *)
struct InteractiveRectangularView: View {
    var entry: WordEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            // Header row
            HStack(alignment: .center) {
                Text(entry.term)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .lineLimit(1)
                Spacer()
                if !entry.partOfSpeech.isEmpty {
                    Text(entry.partOfSpeech.lowercased())
                        .font(.system(size: 9, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(
                            Capsule()
                                .fill(.secondary.opacity(0.2))
                        )
                }
            }

            if entry.definitionVisible {
                Text(entry.definition)
                    .font(.system(size: 10, weight: .regular, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                    .padding(.top, 1)

                // Action buttons
                HStack(spacing: 6) {
                    Button(intent: ToggleDefinitionIntent()) {
                        Label("Hide", systemImage: "eye.slash")
                            .font(.system(size: 9, weight: .medium, design: .rounded))
                    }
                    .buttonStyle(.plain)

                    Spacer()

                    Button(intent: RepeatIntent(wordId: entry.wordId)) {
                        Label("Again", systemImage: "arrow.counterclockwise")
                            .font(.system(size: 9, weight: .medium, design: .rounded))
                            .foregroundStyle(.orange)
                    }
                    .buttonStyle(.plain)

                    Button(intent: GotItIntent(wordId: entry.wordId)) {
                        Label("Got it", systemImage: "checkmark.circle.fill")
                            .font(.system(size: 9, weight: .medium, design: .rounded))
                            .foregroundStyle(.green)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 3)
            } else {
                Button(intent: ToggleDefinitionIntent()) {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 10))
                        Text("Tap to reveal")
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                    }
                    .foregroundStyle(.blue)
                }
                .buttonStyle(.plain)
                .padding(.top, 2)
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
                    .containerBackground(for: .widget) {
                        // Premium gradient for home screen widgets
                        ZStack {
                            LinearGradient(
                                colors: [WidgetColors.gradientStart, WidgetColors.gradientEnd],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                            // Accent glow
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
