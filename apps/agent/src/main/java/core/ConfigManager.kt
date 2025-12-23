package core

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import java.io.File

/**
 * Runtime configuration manager that loads settings from JSON.
 * Eliminates hardcoded constants and enables configuration without recompilation.
 */
object ConfigManager {
    data class Config(
        val debug: DebugConfig = DebugConfig(),
        val handlers: HandlerConfig = HandlerConfig(),
        val network: NetworkConfig = NetworkConfig(),
        val output: OutputConfig = OutputConfig(),
        val fieldMappings: Map<String, String> = emptyMap()
    )

    data class DebugConfig(
        val logLevel: String = "INFO",          // DEBUG, INFO, WARN, ERROR
        val logAllPackets: Boolean = true,
        val dumpPacketFields: Boolean = true,
        val discoveryMode: Boolean = true,      // ENABLED by default for packet discovery
        val verboseDiscovery: Boolean = true,  // Log EVERY packet instance (not just unique classes)
        val logToFile: Boolean = true,
        val peekMonCount: Int = 8               // How many Pokemon to peek in FQ0 summary
    )

    data class HandlerConfig(
        val enabled: List<String> = listOf("pokemon"),  // "pokemon", "character", "inventory"
        val pokemonPacketClass: String = "f.FQ0",
        val handlePacketMethod: String = "yk0"
    )

    data class NetworkConfig(
        val nextJsUrl: String = "http://localhost:3000",
        val ingestEndpoint: String = "/api/ingest",
        val timeout: Int = 5000,
        val retryAttempts: Int = 3
    )

    data class OutputConfig(
        val path: String = System.getProperty("project.dir")?.let { "$it/output" } ?: "./output",
        val useAbsolutePath: Boolean = System.getProperty("project.dir") != null,
        val absolutePath: String = System.getProperty("project.dir")?.let { "$it/output" } ?: ""
    )

    private val gson: Gson = GsonBuilder().setPrettyPrinting().create()

    // Always use project directory from Gradle (not current working directory which changes when PokeMMO runs)
    private val configFile: File = run {
        val projectDir = System.getProperty("project.dir")
        if (projectDir != null) {
            File(projectDir, "snooper-config.json")
        } else {
            // Fallback for non-Gradle runs (shouldn't happen in production)
            File("snooper-config.json")
        }
    }

    private var config: Config = loadOrDefault()

    /**
     * Load configuration from file, creating default if it doesn't exist
     */
    fun load(file: File = configFile): Config {
        // Debug: Log the absolute path being checked
        println("[ConfigManager DEBUG] Looking for config at: ${file.absolutePath}")
        println("[ConfigManager DEBUG] File exists: ${file.exists()}")

        return if (file.exists()) {
            try {
                val json = file.readText()
                gson.fromJson(json, Config::class.java).also {
                    Logger.info("Configuration loaded from ${file.absolutePath}", "ConfigManager")
                }
            } catch (e: Exception) {
                Logger.error("Failed to parse config file, using defaults", e, "ConfigManager")
                createDefaultConfig(file)
            }
        } else {
            Logger.warn("Config file not found, creating default at ${file.absolutePath}", "ConfigManager")
            createDefaultConfig(file)
        }
    }

    /**
     * Create default configuration file
     */
    private fun createDefaultConfig(file: File): Config {
        val defaultConfig = Config()
        file.writeText(gson.toJson(defaultConfig))
        Logger.info("Default configuration created at ${file.absolutePath}", "ConfigManager")
        return defaultConfig
    }

    /**
     * Reload configuration from disk (useful for runtime updates)
     */
    fun reload() {
        config = load()
        Logger.info("Configuration reloaded", "ConfigManager")
    }

    /**
     * Get current configuration
     */
    fun get(): Config = config

    /**
     * Get a specific field mapping by key (obfuscated field names)
     */
    fun getFieldMapping(key: String): String? {
        return config.fieldMappings[key]
    }

    /**
     * Check if a handler is enabled
     */
    fun isHandlerEnabled(handlerName: String): Boolean {
        return config.handlers.enabled.contains(handlerName)
    }

    /**
     * Parse log level string to Logger.Level enum
     */
    fun getLogLevel(): Logger.Level {
        return when (config.debug.logLevel.uppercase()) {
            "DEBUG" -> Logger.Level.DEBUG
            "INFO" -> Logger.Level.INFO
            "WARN" -> Logger.Level.WARN
            "ERROR" -> Logger.Level.ERROR
            else -> {
                Logger.warn("Invalid log level '${config.debug.logLevel}', defaulting to INFO", "ConfigManager")
                Logger.Level.INFO
            }
        }
    }

    /**
     * Initialize configuration on first access
     */
    private fun loadOrDefault(): Config {
        return if (configFile.exists()) {
            try {
                gson.fromJson(configFile.readText(), Config::class.java)
            } catch (e: Exception) {
                createDefaultConfig(configFile)
            }
        } else {
            createDefaultConfig(configFile)
        }
    }

    /**
     * Update field mappings at runtime (useful for quick fixes without editing JSON)
     */
    fun updateFieldMapping(key: String, value: String) {
        val updatedMappings = config.fieldMappings.toMutableMap()
        updatedMappings[key] = value
        config = config.copy(fieldMappings = updatedMappings)
        Logger.info("Field mapping updated: $key = $value", "ConfigManager")
    }

    /**
     * Save current configuration to disk
     */
    fun save(file: File = configFile) {
        try {
            file.writeText(gson.toJson(config))
            Logger.info("Configuration saved to ${file.absolutePath}", "ConfigManager")
        } catch (e: Exception) {
            Logger.error("Failed to save configuration", e, "ConfigManager")
        }
    }

    /**
     * Get the output directory where all generated files should be written
     */
    fun getOutputDir(): File {
        val outputPath = if (config.output.useAbsolutePath && config.output.absolutePath.isNotEmpty()) {
            config.output.absolutePath
        } else {
            config.output.path
        }
        val dir = File(outputPath)
        if (!dir.exists()) {
            dir.mkdirs()
            Logger.info("Created output directory: ${dir.absolutePath}", "ConfigManager")
        }
        return dir
    }

    /**
     * Get a File object in the output directory
     */
    fun getOutputFile(filename: String): File {
        return File(getOutputDir(), filename)
    }
}
