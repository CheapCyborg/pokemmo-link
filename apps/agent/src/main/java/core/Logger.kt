package core

import java.io.File
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * Structured logging system with multiple severity levels and optional file output.
 * Replaces scattered println() calls with consistent, configurable logging.
 */
object Logger {
    enum class Level(val priority: Int) {
        DEBUG(0),
        INFO(1),
        WARN(2),
        ERROR(3)
    }

    private var currentLevel: Level = Level.INFO
    private var logFile: File? = null
    private val timestampFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")

    /**
     * Initialize the logger with a minimum log level and optional file output.
     *
     * @param level Minimum level to log (messages below this are ignored)
     * @param enableFileLogging If true, logs are also written to snooper.log
     */
    fun init(level: Level = Level.INFO, enableFileLogging: Boolean = true, outputFile: File? = null) {
        currentLevel = level
        if (enableFileLogging) {
            logFile = outputFile ?: File("snooper.log")
            logFile?.writeText("")  // Clear existing log on startup
            info("Logger initialized (level: ${level.name}, file: ${logFile?.absolutePath})")
        } else {
            info("Logger initialized (level: ${level.name}, file output disabled)")
        }
    }

    /**
     * Log a debug message (verbose details for development)
     */
    fun debug(message: String, tag: String = "Snooper") {
        log(Level.DEBUG, tag, message)
    }

    /**
     * Log an informational message (normal operations)
     */
    fun info(message: String, tag: String = "Snooper") {
        log(Level.INFO, tag, message)
    }

    /**
     * Log a warning message (potential issues)
     */
    fun warn(message: String, tag: String = "Snooper") {
        log(Level.WARN, tag, message)
    }

    /**
     * Log an error message with optional exception details
     */
    fun error(message: String, throwable: Throwable? = null, tag: String = "Snooper") {
        log(Level.ERROR, tag, message)
        throwable?.let {
            val stackTrace = it.stackTraceToString()
            log(Level.ERROR, tag, stackTrace)
        }
    }

    /**
     * Change the minimum log level at runtime
     */
    fun setLevel(level: Level) {
        currentLevel = level
        info("Log level changed to ${level.name}")
    }

    /**
     * Internal logging implementation
     */
    private fun log(level: Level, tag: String, message: String) {
        if (level.priority < currentLevel.priority) return

        val timestamp = LocalDateTime.now().format(timestampFormatter)
        val levelStr = level.name.padEnd(5)
        val tagStr = tag.padEnd(12)
        val logLine = "[$timestamp] [$levelStr] [$tagStr] $message"

        // Console output (always)
        when (level) {
            Level.ERROR -> System.err.println(logLine)
            else -> println(logLine)
        }

        // File output (if enabled)
        logFile?.appendText("$logLine\n")
    }

    /**
     * Flush log file to disk (useful before shutdown)
     */
    fun flush() {
        // File appends are already flushed in Kotlin, but keep method for future use
    }
}
