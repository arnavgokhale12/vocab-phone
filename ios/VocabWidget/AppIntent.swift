import WidgetKit
import AppIntents

// MARK: - Widget Configuration Intent (required)
struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Vocab Widget" }
    static var description: IntentDescription { "Display your daily vocabulary word" }
}

// MARK: - Progress Data Model
struct WordProgressData: Codable {
    var masteryLevel: String
    var correctCount: Int
    var incorrectCount: Int
    var consecutiveCorrect: Int
    var lastSeenAt: String?
}

// MARK: - Shared Constants
private let appGroupSuite = "group.com.anonymous.vocab-phone"
private let progressKey = "word_progress"
private let currentWordKey = "widget_current_word"
private let wordQueueKey = "widget_word_queue"

// MARK: - Got It Intent
@available(iOS 17.0, *)
struct GotItIntent: AppIntent {
    static var title: LocalizedStringResource = "Got It"
    static var description = IntentDescription("Mark word as known")

    @Parameter(title: "Word ID")
    var wordId: String

    init() {
        self.wordId = ""
    }

    init(wordId: String) {
        self.wordId = wordId
    }

    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: appGroupSuite)

        // Update progress
        var progress = getProgressDict(defaults: defaults)
        var wordProgress = progress[wordId] ?? defaultProgress()

        wordProgress.correctCount += 1
        wordProgress.consecutiveCorrect += 1
        wordProgress.lastSeenAt = ISO8601DateFormatter().string(from: Date())

        // Update mastery level
        if wordProgress.consecutiveCorrect >= 3 {
            wordProgress.masteryLevel = "mastered"
        } else if wordProgress.consecutiveCorrect >= 1 {
            wordProgress.masteryLevel = "learning"
        }

        progress[wordId] = wordProgress
        saveProgressDict(progress, defaults: defaults)

        // Update daily reviewed count
        incrementDailyCount(defaults: defaults)

        // Load next word
        loadNextWord(defaults: defaults)

        // Reload widget
        WidgetCenter.shared.reloadAllTimelines()

        return .result()
    }
}

// MARK: - Repeat Intent
@available(iOS 17.0, *)
struct RepeatIntent: AppIntent {
    static var title: LocalizedStringResource = "Repeat"
    static var description = IntentDescription("Mark word for review")

    @Parameter(title: "Word ID")
    var wordId: String

    init() {
        self.wordId = ""
    }

    init(wordId: String) {
        self.wordId = wordId
    }

    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: appGroupSuite)

        // Update progress
        var progress = getProgressDict(defaults: defaults)
        var wordProgress = progress[wordId] ?? defaultProgress()

        wordProgress.incorrectCount += 1
        wordProgress.consecutiveCorrect = 0 // Reset streak
        wordProgress.masteryLevel = "learning"
        wordProgress.lastSeenAt = ISO8601DateFormatter().string(from: Date())

        progress[wordId] = wordProgress
        saveProgressDict(progress, defaults: defaults)

        // Update daily reviewed count
        incrementDailyCount(defaults: defaults)

        // Load next word (this word will appear again later)
        loadNextWord(defaults: defaults)

        // Reload widget
        WidgetCenter.shared.reloadAllTimelines()

        return .result()
    }
}

// MARK: - Helper Functions

private func getProgressDict(defaults: UserDefaults?) -> [String: WordProgressData] {
    guard let data = defaults?.data(forKey: progressKey),
          let dict = try? JSONDecoder().decode([String: WordProgressData].self, from: data) else {
        return [:]
    }
    return dict
}

private func saveProgressDict(_ dict: [String: WordProgressData], defaults: UserDefaults?) {
    if let data = try? JSONEncoder().encode(dict) {
        defaults?.set(data, forKey: progressKey)
    }
}

private func defaultProgress() -> WordProgressData {
    return WordProgressData(
        masteryLevel: "new",
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        lastSeenAt: nil
    )
}

private func incrementDailyCount(defaults: UserDefaults?) {
    let today = getTodayString()
    let lastDate = defaults?.string(forKey: "last_review_date") ?? ""

    if lastDate == today {
        let count = defaults?.integer(forKey: "today_reviewed_count") ?? 0
        defaults?.set(count + 1, forKey: "today_reviewed_count")
    } else {
        // New day, reset count
        defaults?.set(1, forKey: "today_reviewed_count")
        defaults?.set(today, forKey: "last_review_date")
    }
}

private func getTodayString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: Date())
}

private func loadNextWord(defaults: UserDefaults?) {
    // Get word queue from shared storage (stored as JSON string)
    guard let jsonString = defaults?.string(forKey: wordQueueKey),
          let queueData = jsonString.data(using: .utf8),
          var queue = try? JSONDecoder().decode([[String: String]].self, from: queueData),
          !queue.isEmpty else {
        return
    }

    // Remove current word, get next
    queue.removeFirst()

    if let nextWord = queue.first {
        // Update current word as JSON string
        if let wordData = try? JSONEncoder().encode(nextWord),
           let wordString = String(data: wordData, encoding: .utf8) {
            defaults?.set(wordString, forKey: currentWordKey)
        }

        // Update queue as JSON string
        if let newQueueData = try? JSONEncoder().encode(queue),
           let queueString = String(data: newQueueData, encoding: .utf8) {
            defaults?.set(queueString, forKey: wordQueueKey)
        }
    }
}
