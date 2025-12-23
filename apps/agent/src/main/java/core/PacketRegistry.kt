package core

import handlers.PacketHandler

/**
 * Central registry for packet handlers.
 * Dispatches incoming packets to all registered handlers that can process them.
 */
object PacketRegistry {
    private val handlers = mutableListOf<PacketHandler>()

    /**
     * Register a new packet handler
     */
    fun register(handler: PacketHandler) {
        handlers.add(handler)
        Logger.info("Registered handler: ${handler.name} for ${handler.packetClass}", "Registry")
    }

    /**
     * Register multiple handlers at once
     */
    fun registerAll(vararg handlers: PacketHandler) {
        handlers.forEach { register(it) }
    }

    /**
     * Dispatch a packet to all matching handlers
     */
    fun dispatch(packet: Any) {
        val className = packet.javaClass.name
        val matchedHandlers = handlers.filter { it.canHandle(packet) }

        if (matchedHandlers.isEmpty() && ConfigManager.get().debug.logAllPackets) {
            Logger.debug("Unhandled packet: $className", "Registry")
        }

        matchedHandlers.forEach { handler ->
            runCatching {
                handler.process(packet)
            }.onFailure { e ->
                Logger.error("Handler '${handler.name}' failed for $className: ${e.message}", e, "Registry")
            }
        }
    }

    /**
     * Get list of registered handlers
     */
    fun getHandlers(): List<PacketHandler> = handlers.toList()

    /**
     * Clear all handlers (useful for testing)
     */
    fun clear() {
        handlers.clear()
        Logger.info("All handlers cleared", "Registry")
    }
}
