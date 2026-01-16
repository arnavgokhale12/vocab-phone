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
    let synonyms: [String]?
}

struct WordEntry: TimelineEntry {
    let date: Date
    let wordId: String
    let term: String
    let definition: String
    let partOfSpeech: String
    let pronunciation: String
    let synonyms: [String]
    let definitionVisible: Bool

    static var placeholder: WordEntry {
        WordEntry(
            date: Date(),
            wordId: "placeholder",
            term: "Word",
            definition: "Definition will appear here",
            partOfSpeech: "noun",
            pronunciation: "/wɜːrd/",
            synonyms: ["synonym1", "synonym2"],
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
                synonyms: word.synonyms ?? [],
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
            synonyms: [],
            definitionVisible: definitionVisible
        )
    }
}

// MARK: - Medium Home Screen Widget View (systemMedium)

struct MediumHomeScreenWidgetView: View {
    var entry: WordEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Part of speech pill
            if !entry.partOfSpeech.isEmpty {
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
            }

            // Word
            Text(entry.term)
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundColor(WidgetColors.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            // Pronunciation with speaker button
            if !entry.pronunciation.isEmpty {
                HStack(spacing: 6) {
                    Text(entry.pronunciation)
                        .font(.system(size: 13, weight: .regular, design: .rounded))
                        .foregroundColor(WidgetColors.textTertiary)
                        .italic()

                    Link(destination: URL(string: "vocabphone://pronounce/\(entry.wordId)")!) {
                        Image(systemName: "speaker.wave.2.fill")
                            .font(.system(size: 12))
                            .foregroundColor(WidgetColors.accentBlue)
                    }
                }
            }

            // Definition
            Text(entry.definition)
                .font(.system(size: 13, weight: .regular, design: .rounded))
                .foregroundColor(WidgetColors.textSecondary)
                .lineLimit(3)
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

// MARK: - Large Home Screen Widget View (systemLarge)

struct LargeHomeScreenWidgetView: View {
    var entry: WordEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Part of speech pill
            if !entry.partOfSpeech.isEmpty {
                Text(entry.partOfSpeech.uppercased())
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .tracking(1.2)
                    .foregroundColor(WidgetColors.accentPurple)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        Capsule()
                            .fill(WidgetColors.accentPurple.opacity(0.2))
                    )
            }

            // Word
            Text(entry.term)
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundColor(WidgetColors.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            // Pronunciation with speaker button
            if !entry.pronunciation.isEmpty {
                HStack(spacing: 8) {
                    Text(entry.pronunciation)
                        .font(.system(size: 15, weight: .regular, design: .rounded))
                        .foregroundColor(WidgetColors.textTertiary)
                        .italic()

                    // Speaker button - deep links to app for audio playback
                    Link(destination: URL(string: "vocabphone://pronounce/\(entry.wordId)")!) {
                        Image(systemName: "speaker.wave.2.fill")
                            .font(.system(size: 14))
                            .foregroundColor(WidgetColors.accentBlue)
                    }
                }
            }

            // Definition (multi-line)
            Text(entry.definition)
                .font(.system(size: 15, weight: .regular, design: .rounded))
                .foregroundColor(WidgetColors.textSecondary)
                .lineLimit(4)
                .fixedSize(horizontal: false, vertical: true)

            // Synonyms (max 2)
            if !entry.synonyms.isEmpty {
                HStack(spacing: 8) {
                    Text("Similar:")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundColor(WidgetColors.textTertiary)

                    ForEach(entry.synonyms.prefix(2), id: \.self) { synonym in
                        Text(synonym)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundColor(WidgetColors.accentBlue)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .fill(WidgetColors.accentBlue.opacity(0.15))
                            )
                    }
                }
                .padding(.top, 4)
            }

            Spacer(minLength: 0)

            // Bottom accent line
            HStack(spacing: 4) {
                Circle()
                    .fill(WidgetColors.accentPurple)
                    .frame(width: 6, height: 6)
                Text("vocab")
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundColor(WidgetColors.textTertiary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Lock Screen Widget View (accessoryRectangular only)

@available(iOS 16.0, *)
struct LockScreenRectangularView: View {
    var entry: WordEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            // Word - prominent
            Text(entry.term)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .lineLimit(1)

            // Definition - 1-2 lines, truncated
            Text(entry.definition)
                .font(.system(size: 11, weight: .regular, design: .rounded))
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Main Widget Entry View

struct VocabWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: WordEntry

    var body: some View {
        if #available(iOS 16.0, *) {
            switch widgetFamily {
            case .accessoryRectangular:
                LockScreenRectangularView(entry: entry)
            case .systemMedium:
                MediumHomeScreenWidgetView(entry: entry)
            case .systemLarge:
                LargeHomeScreenWidgetView(entry: entry)
            default:
                MediumHomeScreenWidgetView(entry: entry)
            }
        } else {
            MediumHomeScreenWidgetView(entry: entry)
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
        .description("Learn vocabulary from your lock screen and home screen.")
        .supportedFamilies(supportedFamilies)
    }

    private var supportedFamilies: [WidgetFamily] {
        if #available(iOS 16.0, *) {
            return [
                .systemMedium,
                .systemLarge,
                .accessoryRectangular
            ]
        } else {
            return [.systemMedium, .systemLarge]
        }
    }
}
