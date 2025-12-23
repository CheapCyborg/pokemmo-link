package handlers

/**
 * Interface for extensible packet handlers.
 * Each handler can process specific packet types without modifying core snooper logic.
 */
interface PacketHandler {
    /** Unique name for this handler (e.g., "Pokemon", "Character", "Discovery") */
    val name: String

    /** Packet class this handler processes (e.g., "f.FQ0", or "*" for wildcard) */
    val packetClass: String

    /** Check if this handler should process the given packet */
    fun canHandle(packet: Any): Boolean

    /** Process the packet (extract, transform, persist, send to API, etc.) */
    fun process(packet: Any)

    /** Optional: Return a brief description of what this handler does */
    fun describe(): String = "$name handler for $packetClass"
}
