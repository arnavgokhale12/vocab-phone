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

struct WidgetStats: Codable {
    let learned: Int
    let goal: Int
    let streak: Int
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
    let stats: WidgetStats

    static var placeholder: WordEntry {
        WordEntry(
            date: Date(),
            wordId: "placeholder",
            term: "Word",
            definition: "Definition will appear here",
            partOfSpeech: "noun",
            pronunciation: "/wɜːrd/",
            synonyms: ["synonym1", "synonym2"],
            definitionVisible: false,
            stats: WidgetStats(learned: 0, goal: 5, streak: 0)
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
            policy: .after(Date().addingTimeInterval(60 * 60 * 4))
        )
        completion(timeline)
    }

    private func getCurrentStats() -> WidgetStats {
        if let jsonString = suite?.string(forKey: "widget_stats"),
           let data = jsonString.data(using: .utf8),
           let stats = try? JSONDecoder().decode(WidgetStats.self, from: data) {
            return stats
        }
        return WidgetStats(learned: 0, goal: 5, streak: 0)
    }

    private func getCurrentEntry() -> WordEntry {
        let stats = getCurrentStats()

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
                definitionVisible: true,
                stats: stats
            )
        }

        // Fallback
        return WordEntry(
            date: Date(),
            wordId: "unknown",
            term: suite?.string(forKey: "daily_word") ?? "Open App",
            definition: "Open LexiStack to load words",
            partOfSpeech: "",
            pronunciation: "",
            synonyms: [],
            definitionVisible: true,
            stats: stats
        )
    }
}

// MARK: - Medium Home Screen Widget View (systemMedium)

struct MediumHomeScreenWidgetView: View {
    var entry: WordEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Part of speech pill
            if !entry.partOfSpeech.isEmpty {
                Text(entry.partOfSpeech.uppercased())
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .tracking(1.2)
                    .foregroundColor(WidgetColors.accentPurple)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(
                        Capsule()
                            .fill(WidgetColors.accentPurple.opacity(0.2))
                    )
            }

            // Word
            Text(entry.term)
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundColor(WidgetColors.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            // Pronunciation with speaker button
            if !entry.pronunciation.isEmpty {
                HStack(spacing: 6) {
                    Text(entry.pronunciation)
                        .font(.system(size: 12, weight: .regular, design: .rounded))
                        .foregroundColor(WidgetColors.textTertiary)
                        .italic()

                    if let url = URL(string: "vocabphone://pronounce/\(entry.wordId)") {
                        Link(destination: url) {
                            Image(systemName: "speaker.wave.2.fill")
                                .font(.system(size: 11))
                                .foregroundColor(WidgetColors.accentBlue)
                        }
                    }
                }
            }

            // Definition
            Text(entry.definition)
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .foregroundColor(WidgetColors.textSecondary)
                .lineLimit(2)

            // Synonyms (max 2)
            if !entry.synonyms.isEmpty {
                HStack(spacing: 4) {
                    Text("Similar:")
                        .font(.system(size: 9, weight: .medium, design: .rounded))
                        .foregroundColor(WidgetColors.textTertiary)

                    ForEach(entry.synonyms.prefix(2), id: \.self) { synonym in
                        Text(synonym)
                            .font(.system(size: 9, weight: .medium, design: .rounded))
                            .foregroundColor(WidgetColors.accentBlue)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(
                                Capsule()
                                    .fill(WidgetColors.accentBlue.opacity(0.15))
                            )
                    }
                }
            }

            Spacer(minLength: 2)

            // Progress bar
            HStack(spacing: 0) {
                Text("\(entry.stats.learned)/\(entry.stats.goal) words")
                    .font(.system(size: 9, weight: .medium, design: .rounded))
                    .foregroundColor(WidgetColors.textTertiary)

                Spacer()

                // Progress bar inline
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(WidgetColors.glassOverlay)
                            .frame(height: 3)
                        RoundedRectangle(cornerRadius: 2)
                            .fill(
                                LinearGradient(
                                    colors: [WidgetColors.accentPurple, WidgetColors.accentBlue],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * progressFraction, height: 3)
                    }
                }
                .frame(width: 60, height: 3)

                if entry.stats.streak > 0 {
                    HStack(spacing: 2) {
                        Text("🔥")
                            .font(.system(size: 8))
                        Text("\(entry.stats.streak)")
                            .font(.system(size: 9, weight: .semibold, design: .rounded))
                            .foregroundColor(WidgetColors.accentPurple)
                    }
                    .padding(.leading, 6)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var progressFraction: CGFloat {
        guard entry.stats.goal > 0 else { return 0 }
        return min(CGFloat(entry.stats.learned) / CGFloat(entry.stats.goal), 1.0)
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
                    if let url = URL(string: "vocabphone://pronounce/\(entry.wordId)") {
                        Link(destination: url) {
                            Image(systemName: "speaker.wave.2.fill")
                                .font(.system(size: 14))
                                .foregroundColor(WidgetColors.accentBlue)
                        }
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

            // Progress bar
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("\(entry.stats.learned)/\(entry.stats.goal) words today")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundColor(WidgetColors.textTertiary)
                    Spacer()
                    if entry.stats.streak > 0 {
                        HStack(spacing: 3) {
                            Text("🔥")
                                .font(.system(size: 11))
                            Text("\(entry.stats.streak) day\(entry.stats.streak == 1 ? "" : "s")")
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundColor(WidgetColors.accentPurple)
                        }
                    }
                }
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(WidgetColors.glassOverlay)
                            .frame(height: 6)
                        RoundedRectangle(cornerRadius: 3)
                            .fill(
                                LinearGradient(
                                    colors: [WidgetColors.accentPurple, WidgetColors.accentBlue],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * progressFraction, height: 6)
                    }
                }
                .frame(height: 6)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var progressFraction: CGFloat {
        guard entry.stats.goal > 0 else { return 0 }
        return min(CGFloat(entry.stats.learned) / CGFloat(entry.stats.goal), 1.0)
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
        switch widgetFamily {
        case .systemMedium:
            MediumHomeScreenWidgetView(entry: entry)
        case .systemLarge:
            LargeHomeScreenWidgetView(entry: entry)
        default:
            MediumHomeScreenWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget Configuration

struct VocabWidget: Widget {
    let kind = "VocabWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            VocabWidgetEntryView(entry: entry)
                .containerBackground(.black, for: .widget)
        }
        .configurationDisplayName("LexiStack")
        .description("Learn vocabulary from your lock screen and home screen.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}
