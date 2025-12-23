package handlers

import core.ConfigManager
import core.Logger
import java.io.File
import java.lang.reflect.Modifier

/**
 * Discovery handler that recursively dumps ALL fields of every packet (Fiereu's approach).
 * Use this to identify which packets contain character data, inventory, battle state, etc.
 */
class PacketDiscoveryLogger(outputFile: File? = null) : PacketHandler {
    override val name = "PacketDiscovery"
    override val packetClass = "*"  // Wildcard - handles all packets

    private val discoveryFile = outputFile ?: File("packet-discovery.log")
    private val seenPackets = mutableSetOf<String>()
    private var packetCount = 0

    init {
        // Clear discovery log on startup
        discoveryFile.writeText("")
        discoveryFile.appendText("=".repeat(80) + "\n")
        discoveryFile.appendText("POKEMMO PACKET DISCOVERY LOG (Recursive Field Dump)\n")
        discoveryFile.appendText("Session started: ${java.time.LocalDateTime.now()}\n")
        discoveryFile.appendText("Mode: ${if (ConfigManager.get().debug.verboseDiscovery) "VERBOSE (all instances)" else "UNIQUE (one per class)"}\n")
        discoveryFile.appendText("=".repeat(80) + "\n\n")
        Logger.info("Discovery log initialized: ${discoveryFile.path}", "Discovery")
    }

    override fun canHandle(packet: Any): Boolean {
        return ConfigManager.get().debug.discoveryMode
    }

    override fun process(packet: Any) {
        val className = packet.javaClass.name
        val isVerbose = ConfigManager.get().debug.verboseDiscovery

        if (isVerbose) {
            // Log EVERY packet instance with full recursive field dump
            packetCount++
            seenPackets.add(className)
            val report = printObj(packet, packetCount)
            discoveryFile.appendText("\n$report\n")

            // Progress feedback every 100 packets
            if (packetCount % 100 == 0) {
                Logger.info("Logged $packetCount packets (${seenPackets.size} unique types)", "Discovery")
            }
        } else {
            // Original behavior: only log unique classes
            if (seenPackets.add(className)) {
                packetCount++
                val report = printObj(packet, null)
                discoveryFile.appendText("\n$report\n")
                Logger.info("Discovered new packet: $className", "Discovery")
            }
        }
    }

    /**
     * Recursive field printer (based on Fiereu's approach from blog posts).
     * Dumps ALL fields of an object recursively to discover packet structure.
     */
    private fun recursivePrint(
        obj: Any,
        sb: StringBuilder,
        indent: Int,
        visitedObjects: MutableList<Any> = mutableListOf()
    ) {
        // Avoid infinite loops from circular references
        if (visitedObjects.contains(obj)) {
            return
        }
        visitedObjects.add(obj)

        val indentStr = " ".repeat(indent * 4)
        val fields = obj.javaClass.declaredFields

        for (field in fields) {
            // Skip static fields
            if (Modifier.isStatic(field.modifiers)) continue

            try {
                field.isAccessible = true
            } catch (e: Exception) {
                continue
            }

            val value = field.get(obj)
            if (value != null) {
                sb.append("\n")
                sb.append(indentStr)
                sb.append(field.name)
                sb.append(": ")

                when {
                    value.javaClass.isArray -> {
                        sb.append("[")
                        // Print array contents (limit to 20 elements to prevent massive logs)
                        val len = java.lang.reflect.Array.getLength(value)
                        for (i in 0 until minOf(len, 20)) {
                            if (i != 0) {
                                sb.append(", ")
                            }
                            val item = java.lang.reflect.Array.get(value, i)
                            if (item != null && !item.javaClass.isPrimitive && !item.javaClass.name.startsWith("java.lang") && indent < 10) {
                                sb.append("\n")
                                sb.append(indentStr + "    ") // Indent for array item
                                sb.append(item.javaClass.name)
                                sb.append(" {")
                                recursivePrint(item, sb, indent + 2, visitedObjects)
                                sb.append("\n")
                                sb.append(indentStr + "    ")
                                sb.append("}")
                            } else {
                                sb.append(item)
                            }
                        }
                        if (len > 20) {
                            sb.append(", ... (${len - 20} more)")
                        }
                        sb.append("]")
                    }
                    value.javaClass.isPrimitive ||
                    value.javaClass.name.startsWith("java.lang") ||
                    value.javaClass.name.startsWith("java.util") -> {
                        // Primitive or common Java type - just print value
                        sb.append(value)
                    }
                    indent < 10 -> {
                        // Complex object - recurse (limit depth to 10 to prevent huge logs)
                        sb.append(value.javaClass.name)
                        sb.append(" {")
                        recursivePrint(value, sb, indent + 1, visitedObjects)
                        sb.append("\n")
                        sb.append(indentStr)
                        sb.append("}")
                    }
                    else -> {
                        // Max depth reached - just show type
                        sb.append(value.javaClass.name)
                        sb.append(" (max depth)")
                    }
                }
            }
        }
    }

    /**
     * Main entry point - formats a packet dump with header
     */
    private fun printObj(obj: Any, count: Int? = null): String {
        val sb = StringBuilder()
        val className = obj.javaClass.name

        sb.append("=".repeat(80))
        sb.append("\n")
        if (count != null) {
            sb.append("PACKET #$count: $className")
        } else {
            sb.append("PACKET CLASS: $className")
        }
        sb.append("\n")
        sb.append("=".repeat(80))

        sb.append("\n")
        sb.append(className)
        sb.append(" {")
        recursivePrint(obj, sb, 1)
        sb.append("\n}")

        return sb.toString()
    }

    override fun describe(): String {
        return "Discovery Logger (recursive field dump to ${discoveryFile.name})"
    }

    /**
     * Get statistics about discovered packets
     */
    fun getStats(): String {
        return "Discovered ${seenPackets.size} unique packet types ($packetCount total packets)"
    }
}
