import com.google.gson.Gson
import com.pokeemu.client.Client
import core.ConfigManager
import core.Logger
import core.PacketRegistry
import handlers.PacketDiscoveryLogger
import java.io.File
import java.lang.reflect.Modifier
import java.net.HttpURLConnection
import java.net.URI
import java.util.LinkedHashMap
import net.bytebuddy.agent.ByteBuddyAgent
import net.bytebuddy.agent.builder.AgentBuilder
import net.bytebuddy.asm.Advice
import net.bytebuddy.matcher.ElementMatchers

// --- Configuration ---
val HANDLE_PACKET_METHOD_NAME = "yk0"
val POKEMMO_PACKAGE_PREFIX = "f."
val TARGET_PACKET_CLASS = "f.FQ0"

// --- Field Mappings ---
// Packet: f.FQ0 (Party/PC Update)
val PARTY_ARRAY_FIELD = "IB0"
val WRAPPER_FIELD_POKEMON = "jH1"
val WRAPPER_FIELD_SPECIES_DATA = "id1"

// Packet: f.Of (Usage Stats / Tier List)
// Maps Species ID (Int) -> Tier Name (String)
// e.g. 6 -> "Over Used" (Charizard)

// Ch1 behaves like: party order (0..5), and PC global slot (0..capacity-1)
val FIELD_SLOT_INDEX_REAL = "Ch1"

val FIELD_CONTAINER_INFO = "Dq1"
val FIELD_CONTAINER_CAPACITY = "qN1"
val FIELD_CONTAINER_ID_REAL = "hb"

// Pokemon Data Fields
val FIELD_SPECIES_ID = "QW0"
val FIELD_LEVEL = "pt0"
val FIELD_EVS = "iM0"
val FIELD_IVS_PACKED = "Tm1"
val FIELD_OT_NAME = "kr0"
val FIELD_NICKNAME = "Uy0"

// UUID Fields (Wrappers)
val FIELD_UUID_WRAPPER = "Gg0" // Pokemon UUID Wrapper (f.Is)
val FIELD_OT_UUID_WRAPPER = "Em1" // OT UUID Wrapper (f.Is)
val FIELD_UUID_VALUE = "px0" // The actual long value inside the wrapper

// Nature (Object)
val FIELD_NATURE_OBJ = "FB1"
val FIELD_NATURE_ID_INTERNAL = "XS1"

// Extra Fields
val FIELD_CURRENT_HP = "eA0"
val FIELD_XP = "Sp0"
val FIELD_GENDER = "bG0"
val FIELD_HAPPINESS = "Vt1"

// Flags & Variants
val FIELD_FLAGS = "U30" // Long: Contains Shiny (Bit 16/26), Gift (Bit 21)
val FIELD_VARIANT = "sW" // Short/Int: 1=Shiny, 6=Alpha

val FIELD_MOVES = "y5"
val FIELD_PP = "vr0"
val FIELD_ABILITY_SLOT = "t8"
val FIELD_ABILITY_SLOT_ALT = "lR1" // Potential 1-based slot?
val FIELD_ABILITY_LIST = "oS"
val FIELD_FORM_ID = "Kv"
val FIELD_PERSONALITY_VALUE = "rC"

// Nature Map
val NATURE_MAP =
        mapOf(
                0 to "Hardy",
                1 to "Lonely",
                2 to "Brave",
                3 to "Adamant",
                4 to "Naughty",
                5 to "Bold",
                6 to "Docile",
                7 to "Relaxed",
                8 to "Impish",
                9 to "Lax",
                10 to "Timid",
                11 to "Hasty",
                12 to "Serious",
                13 to "Jolly",
                14 to "Naive",
                15 to "Modest",
                16 to "Mild",
                17 to "Quiet",
                18 to "Bashful",
                19 to "Rash",
                20 to "Calm",
                21 to "Gentle",
                22 to "Sassy",
                23 to "Careful",
                24 to "Quirky"
        )

// Known daycare ids
// 3 = Hoenn Daycare (Confirmed by user)
// 6, 7 = Other Daycares (Kanto/Unova/Sinnoh?)
val DAYCARE_CONTAINER_IDS = setOf(3, 6, 7)
val DAYCARE_REGION_CAPACITY = 26

object SnooperHelper {
    val gson = Gson()

    // In-memory accumulator for PC boxes (multiple packets)
    // Maps boxId -> List of Pokemon in that box
    var pcBoxAccumulator: MutableMap<String, MutableList<PokemonDumpSchema.PokemonRecord>> =
            mutableMapOf()
    var lastPcPacketTime: Long = 0L
    private const val PC_PACKET_TIMEOUT_MS = 5000L // Reset if no packets for 5 seconds

    // Load configuration at startup
    private val config = ConfigManager.get()

    fun postToNextJs(payload: Any) {
        try {
            val url = URI("${config.network.nextJsUrl}${config.network.ingestEndpoint}").toURL()
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true
            connection.connectTimeout = config.network.timeout
            connection.readTimeout = config.network.timeout

            val jsonData = gson.toJson(payload)
            connection.outputStream.use { os -> os.write(jsonData.toByteArray(Charsets.UTF_8)) }

            if (connection.responseCode == 200) {
                val containerType =
                        when (payload) {
                            is PokemonDumpSchema.DumpEnvelope -> payload.source.containerType
                            is Map<*, *> ->
                                    (payload["source"] as? Map<*, *>)
                                            ?.get("container_type")
                                            ?.toString()
                            else -> null
                        }
                Logger.info("Synced to Next.js" + (containerType?.let { " ($it)" } ?: ""), "API")
            } else {
                Logger.warn("Next.js returned HTTP ${connection.responseCode}", "API")
            }
        } catch (e: Exception) {
            Logger.debug("API unavailable: ${e.message}", "API")
        }
    }

    fun dumpDebug(obj: Any, label: String) {
        try {
            val file = File("dump-debug-fields.txt")
            val sb = StringBuilder()
            sb.append("\n==========================================\n")
            sb.append("--- DEBUG: $label ---\n")
            sb.append("==========================================\n")

            fun dumpObj(o: Any, prefix: String) {
                var clazz: Class<*>? = o.javaClass
                while (clazz != null) {
                    for (field in clazz.declaredFields) {
                        if (Modifier.isStatic(field.modifiers)) continue
                        field.isAccessible = true
                        try {
                            val value = field.get(o)
                            sb.append("$prefix${field.name} (${field.type.simpleName}) = $value\n")

                            if (value != null &&
                                            !field.type.isPrimitive &&
                                            field.type != String::class.java &&
                                            !field.type.name.startsWith("java.") &&
                                            prefix.length < 20
                            ) {
                                sb.append(
                                        "$prefix  >>> Expanding ${field.name} (${field.type.simpleName}):\n"
                                )
                                dumpObj(value, "$prefix    ")
                            }

                            if (value != null && field.type.isArray && prefix.length < 20) {
                                val len = java.lang.reflect.Array.getLength(value)
                                sb.append(
                                        "$prefix  >>> Expanding Array ${field.name} (len=$len):\n"
                                )
                                val componentType = field.type.componentType
                                for (i in 0 until minOf(len, 10)) {
                                    val item = java.lang.reflect.Array.get(value, i)
                                    if (componentType.isPrimitive) {
                                        sb.append("$prefix    [$i] = $item\n")
                                    } else if (item != null) {
                                        sb.append("$prefix    [$i]:\n")
                                        dumpObj(item, "$prefix      ")
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            sb.append("$prefix${field.name} = ERROR: ${e.message}\n")
                        }
                    }
                    clazz = clazz.superclass
                }
            }

            dumpObj(obj, "")
            sb.append("\n")
            file.appendText(sb.toString())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun anyToInt(v: Any?): Int? =
            when (v) {
                is Int -> v
                is Number -> v.toInt()
                else -> null
            }

    private fun anyToLong(v: Any?): Long? =
            when (v) {
                is Long -> v
                is Number -> v.toLong()
                else -> null
            }

    fun debugPacket(packet: Any) {
        val cls = packet.javaClass.name
        val config = ConfigManager.get()

        if (config.debug.logAllPackets) {
            Logger.debug("Packet: $cls", "Interceptor")
        }

        if (cls != TARGET_PACKET_CLASS) return

        if (!config.debug.dumpPacketFields && !config.debug.discoveryMode) {
            // Quick summary mode
            val pokemonArray = getFieldValue(packet, PARTY_ARRAY_FIELD)
            val length =
                    if (pokemonArray != null && pokemonArray.javaClass.isArray)
                            java.lang.reflect.Array.getLength(pokemonArray)
                    else -1

            var hbRaw = -1
            var cap = -1

            if (pokemonArray != null && pokemonArray.javaClass.isArray) {
                for (i in 0 until length) {
                    val slotWrapper = java.lang.reflect.Array.get(pokemonArray, i) ?: continue
                    val pokemon = getFieldValue(slotWrapper, WRAPPER_FIELD_POKEMON) ?: continue
                    val containerInfo = getFieldValue(pokemon, FIELD_CONTAINER_INFO) ?: continue
                    hbRaw =
                            (getFieldValue(containerInfo, FIELD_CONTAINER_ID_REAL) as? Number)
                                    ?.toInt()
                                    ?: hbRaw
                    cap =
                            (getFieldValue(containerInfo, FIELD_CONTAINER_CAPACITY) as? Number)
                                    ?.toInt()
                                    ?: cap
                    break
                }
            }

            Logger.debug("FQ0 summary: hb=$hbRaw, capacity=$cap, arrayLen=$length", "Packet")

            if (pokemonArray != null && pokemonArray.javaClass.isArray) {
                var shown = 0
                for (i in 0 until length) {
                    if (shown >= config.debug.peekMonCount) break
                    val slotWrapper = java.lang.reflect.Array.get(pokemonArray, i) ?: continue
                    val pokemon = getFieldValue(slotWrapper, WRAPPER_FIELD_POKEMON) ?: continue

                    val speciesObj = getFieldValue(pokemon, FIELD_SPECIES_ID)
                    val speciesId =
                            when (speciesObj) {
                                is Int -> speciesObj
                                is Short -> speciesObj.toInt()
                                else -> continue
                            }

                    val ch1 = (getFieldValue(pokemon, FIELD_SLOT_INDEX_REAL) as? Number)?.toInt()
                    Logger.debug("  mon[$i]: species=$speciesId, Ch1=$ch1", "Packet")
                    shown++
                }
            }
        }

        if (config.debug.dumpPacketFields) {
            dumpDebug(packet, "TARGET PACKET (Party/PC Update)")
        }
    }

    private fun boxKeyRank(key: String): Pair<Int, Int> =
            when {
                key.startsWith("box_") ->
                        0 to (key.removePrefix("box_").toIntOrNull() ?: Int.MAX_VALUE)
                key == "account_box" -> 1 to 0
                key.startsWith("extra_box_") ->
                        2 to (key.removePrefix("extra_box_").toIntOrNull() ?: Int.MAX_VALUE)
                else -> 3 to Int.MAX_VALUE
            }

    private fun <T> orderedByBoxKey(map: Map<String, T>): LinkedHashMap<String, T> {
        val ordered = LinkedHashMap<String, T>()
        val keys =
                map.keys.sortedWith(
                        compareBy<String> { boxKeyRank(it).first }
                                .thenBy { boxKeyRank(it).second }
                                .thenBy { it }
                )
        for (k in keys) ordered[k] = map.getValue(k)
        return ordered
    }

    @JvmStatic
    fun processPacket(packet: Any) {
        try {
            val cls = packet.javaClass.name

            // Handle Character List (Reset State)
            if (cls == "f.Do0") {
                Logger.info("Character List received.", "Snooper")
                return
            }

            // Handle Party/PC Update
            if (cls == TARGET_PACKET_CLASS) {
                val pokemonArray = getFieldValue(packet, PARTY_ARRAY_FIELD)
                if (pokemonArray == null || !pokemonArray.javaClass.isArray) return

                val length = java.lang.reflect.Array.getLength(pokemonArray)
                val pokemonList = mutableListOf<Map<String, Any?>>()
                val pokemonUuids = mutableSetOf<Long>()

                var hbRaw = -1
                var containerCapacity = -1

                for (i in 0 until length) {
                    val slotWrapper = java.lang.reflect.Array.get(pokemonArray, i) ?: continue
                    val pokemon = getFieldValue(slotWrapper, WRAPPER_FIELD_POKEMON) ?: continue

                    if (hbRaw == -1 || containerCapacity == -1) {
                        val containerInfo = getFieldValue(pokemon, FIELD_CONTAINER_INFO)
                        if (containerInfo != null) {
                            val cap =
                                    (getFieldValue(containerInfo, FIELD_CONTAINER_CAPACITY) as?
                                                    Number)
                                            ?.toInt()
                            val realHb =
                                    (getFieldValue(containerInfo, FIELD_CONTAINER_ID_REAL) as?
                                                    Number)
                                            ?.toInt()
                            if (cap != null) containerCapacity = cap
                            if (realHb != null) hbRaw = realHb
                        }
                    }

                    // Extract OT UUID for party matching
                    val otUuidWrapper = getFieldValue(pokemon, FIELD_OT_UUID_WRAPPER)
                    if (otUuidWrapper != null) {
                        val uuid = anyToLong(getFieldValue(otUuidWrapper, FIELD_UUID_VALUE))
                        if (uuid != null) pokemonUuids.add(uuid)
                    }

                    val data = extractPokemonData(pokemon)
                    if (data != null) {
                        val m = data.toMutableMap()
                        m["slot_index_array"] = i

                        // Extract Ability List from Species Data (in wrapper)
                        val speciesData = getFieldValue(slotWrapper, WRAPPER_FIELD_SPECIES_DATA)
                        if (speciesData != null) {
                            val abilityList =
                                    parseIntArray(getFieldValue(speciesData, FIELD_ABILITY_LIST))
                            m["ability_list"] = abilityList
                        }

                        pokemonList.add(m)
                    }
                }

                if (pokemonList.isEmpty()) {
                    // Keep moving if empty but it's a known container update (cleared box)
                    if (hbRaw == -1) return
                }

                val isPcStorage =
                        containerCapacity >= 30 &&
                                (containerCapacity % 30 == 0) &&
                                containerCapacity != 6 &&
                                containerCapacity != DAYCARE_REGION_CAPACITY

                val isDaycare =
                        (hbRaw in DAYCARE_CONTAINER_IDS) ||
                                (containerCapacity == DAYCARE_REGION_CAPACITY) ||
                                (containerCapacity == 2 || containerCapacity == 3)

                val containerType =
                        when {
                            isPcStorage -> "pc_boxes"
                            containerCapacity == 6 -> "party"
                            isDaycare -> "daycare"
                            else -> "unknown"
                        }

                Logger.info(
                        "Processing FQ0: hb=$hbRaw, Capacity=$containerCapacity, Type=$containerType, Count=${pokemonList.size}",
                        "Packet"
                )

                fun resolveSlotIdx(extracted: Map<String, Any?>, fallback: Int, type: String): Int {
                    val ch1 = anyToInt(extracted["slot_index_real"])
                    val arr = anyToInt(extracted["slot_index_array"]) ?: fallback
                    return when (type) {
                        "pc_boxes" -> ch1 ?: arr
                        "party" -> if (ch1 != null && ch1 in 0..5) ch1 else arr
                        "daycare" -> ch1 ?: arr
                        else -> arr
                    }
                }

                var records =
                        pokemonList
                                .mapIndexedNotNull { idx, extracted ->
                                    val slotIdx = resolveSlotIdx(extracted, idx, containerType)

                                    // Resolve Ability ID if we have the list and slot
                                    val abilityList = extracted["ability_list"] as? IntArray
                                    // Default to -1 to distinguish between "missing" and "0"
                                    val abilitySlot =
                                            (extracted["ability_slot"] as? Number)?.toInt() ?: -1
                                    val abilitySlotAlt =
                                            (extracted["ability_slot_alt"] as? Number)?.toInt()
                                                    ?: -1

                                    if (abilityList != null &&
                                                    abilitySlot >= 0 &&
                                                    abilitySlot < abilityList.size
                                    ) {
                                        // abilitySlot is 0-based index into the array
                                        var abId = abilityList[abilitySlot]
                                        // Fallback: If the selected slot is 0 (empty) but we have a
                                        // primary ability, use that.
                                        // This handles cases like Rotom/Archeops where slot=2 but
                                        // ability_list=[id, 0, 0]
                                        if (abId == 0 && abilityList.isNotEmpty()) {
                                            abId = abilityList[0]
                                        }
                                        (extracted as MutableMap<String, Any?>)["ability_id"] = abId

                                        // DEBUG LOGGING
                                        val speciesId = extracted["species_id"]
                                        Logger.info(
                                                "DEBUG ABILITY: Species=$speciesId, Slot=$abilitySlot, AltSlot=$abilitySlotAlt, List=${abilityList.joinToString(",")}, ResolvedID=$abId",
                                                "Snooper"
                                        )
                                    } else if (abilityList != null) {
                                        val speciesId = extracted["species_id"]
                                        Logger.info(
                                                "DEBUG ABILITY MISSING SLOT: Species=$speciesId, Slot=$abilitySlot, AltSlot=$abilitySlotAlt, List=${abilityList.joinToString(",")}",
                                                "Snooper"
                                        )
                                    }

                                    // ALPHA OVERRIDE: Alphas always have Hidden Ability (usually
                                    // Slot 3 / Index 2)
                                    // If the game reports Slot 0 for an Alpha, it's likely a bug or
                                    // visual quirk.
                                    if (extracted["is_alpha"] == true &&
                                                    abilityList != null &&
                                                    abilityList.size >= 3
                                    ) {
                                        val hiddenId = abilityList[2]
                                        val currentId = (extracted["ability_id"] as? Int) ?: 0
                                        if (currentId != hiddenId) {
                                            (extracted as MutableMap<String, Any?>)["ability_id"] =
                                                    hiddenId
                                            Logger.info(
                                                    "ALPHA OVERRIDE: Species=${extracted["species_id"]} forced to Hidden Ability ($hiddenId)",
                                                    "Snooper"
                                            )
                                        }
                                    }

                                    PokemonDumpSchema.fromExtractedMap(extracted, slotIdx)
                                }
                                .sortedBy { it.slot }

                // Write logic based on container type
                when (containerType) {
                    "party" -> {
                        val env =
                                PokemonDumpSchema.envelope(
                                        packetClass = packet.javaClass.name,
                                        containerId = hbRaw,
                                        containerType = "party",
                                        records = records
                                )

                        // Always write party dump (assume f.FQ0 is only sent for local player's
                        // data)
                        PokemonDumpSchema.writeEnvelope(
                                ConfigManager.getOutputFile("team_dump.json"),
                                env
                        )
                        SnooperHelper.postToNextJs(env)
                    }
                    "daycare" -> {
                        val sorted = records.sortedBy { it.slot }
                        records = sorted.mapIndexed { idx, rec -> rec.copy(slot = idx) }
                        val normalizedCapacity = 2.coerceAtLeast(records.size).coerceAtMost(3)
                        val env =
                                PokemonDumpSchema.envelope(
                                        packet.javaClass.name,
                                        hbRaw,
                                        "daycare",
                                        normalizedCapacity,
                                        records
                                )
                        PokemonDumpSchema.writeEnvelope(
                                ConfigManager.getOutputFile("daycare_dump.json"),
                                env
                        )
                        SnooperHelper.postToNextJs(env)
                    }
                    "pc_boxes" -> {
                        val PC_BOX_SIZE = 60
                        val STANDARD_BOX_COUNT = 11

                        fun resolveBoxId(boxIndex0: Int): String =
                                when {
                                    boxIndex0 in 0 until STANDARD_BOX_COUNT ->
                                            "box_${boxIndex0 + 1}"
                                    boxIndex0 == STANDARD_BOX_COUNT -> "account_box"
                                    else -> "extra_box_${boxIndex0 + 1}"
                                }

                        // Accumulate Pokemon across multiple packets
                        val now = System.currentTimeMillis()

                        // Reset accumulator if too much time has passed (new session)
                        if (now - SnooperHelper.lastPcPacketTime >
                                        SnooperHelper.PC_PACKET_TIMEOUT_MS
                        ) {
                            SnooperHelper.pcBoxAccumulator.clear()
                        }
                        SnooperHelper.lastPcPacketTime = now

                        // Process current packet's records and add to accumulator
                        for (record in records) {
                            // Skip empty slots (species_id == 0)
                            if (record.identity.speciesId == 0) continue

                            val globalSlot = record.slot
                            val boxIndex0 = globalSlot / PC_BOX_SIZE
                            val slotInBox = globalSlot % PC_BOX_SIZE
                            val boxId = resolveBoxId(boxIndex0)

                            // Get or create box list
                            val boxList =
                                    SnooperHelper.pcBoxAccumulator.getOrPut(boxId) {
                                        mutableListOf()
                                    }

                            // Remove existing pokemon at this slot (update)
                            boxList.removeIf { it.boxSlot == slotInBox }

                            // Add with box metadata
                            boxList.add(
                                    record.copy(
                                            slot = slotInBox,
                                            boxId = boxId,
                                            boxSlot = slotInBox
                                    )
                            )
                        }

                        // Flatten all accumulated boxes into single array
                        val allPokemon = mutableListOf<PokemonDumpSchema.PokemonRecord>()
                        for ((_, mons) in SnooperHelper.pcBoxAccumulator) {
                            allPokemon.addAll(mons)
                        }

                        // Define box sort order for consistent ordering
                        fun boxSortKey(boxId: String): Int =
                                when {
                                    boxId.startsWith("box_") ->
                                            boxId.removePrefix("box_").toIntOrNull() ?: 999
                                    boxId == "account_box" -> STANDARD_BOX_COUNT + 1
                                    boxId.startsWith("extra_box_") ->
                                            STANDARD_BOX_COUNT +
                                                    1 +
                                                    (boxId.removePrefix("extra_box_").toIntOrNull()
                                                            ?: 0)
                                    else -> 9999
                                }

                        // Sort by box order then slot within box
                        val sortedPokemon =
                                allPokemon.sortedWith(
                                        compareBy(
                                                { mon -> boxSortKey(mon.boxId ?: "zzz") },
                                                { it.boxSlot ?: it.slot }
                                        )
                                )

                        // Create unified envelope with flattened pokemon array
                        val env =
                                PokemonDumpSchema.envelope(
                                        packetClass = packet.javaClass.name,
                                        containerId = hbRaw,
                                        containerType = "pc_boxes",
                                        capacity = containerCapacity,
                                        records = sortedPokemon
                                )

                        val outFile = ConfigManager.getOutputFile("dump-pc_boxes.json")
                        PokemonDumpSchema.writeEnvelope(outFile, env)
                        Logger.info(
                                "Wrote PC Boxes (${sortedPokemon.size} pokemon) to ${outFile.path}",
                                "FileIO"
                        )
                        SnooperHelper.postToNextJs(env)
                    }
                }
            }
        } catch (e: Exception) {
            Logger.error("Processing Error: ${e.message}", e, "Packet")
        }
    }

    // Removed mergePcBoxes as it is now inlined
    fun unused_mergePcBoxes(newBoxes: Map<String, PokemonDumpSchema.DumpEnvelope>): Map<String, PokemonDumpSchema.DumpEnvelope> {
        return emptyMap()
    }

    fun extractPokemonData(pokemon: Any): Map<String, Any?>? {
        try {
            val speciesObj = getFieldValue(pokemon, FIELD_SPECIES_ID)
            val speciesId = when (speciesObj) {
                is Int -> speciesObj
                is Short -> speciesObj.toInt()
                else -> return null
            }

            // If speciesId is 0, it's an empty slot. We must return a marker so we can clear it from the cache.
            if (speciesId == 0) {
                val slotIndexReal = (getFieldValue(pokemon, FIELD_SLOT_INDEX_REAL) as? Number)?.toInt() ?: 0
                return mapOf("species_id" to 0, "slot_index_real" to slotIndexReal)
            }

            val level = (getFieldValue(pokemon, FIELD_LEVEL) as? Number)?.toInt() ?: 0
            val otName = getFieldValue(pokemon, FIELD_OT_NAME)?.toString() ?: "Unknown"

            var nature = "Unknown"
            var natureId = 0
            val natureObj = getFieldValue(pokemon, FIELD_NATURE_OBJ)
            if (natureObj != null) {
                val rawId = getFieldValue(natureObj, FIELD_NATURE_ID_INTERNAL)
                if (rawId is Number) {
                    natureId = rawId.toInt()
                    nature = NATURE_MAP[natureId] ?: "Nature $natureId"
                }
            }

            val uuidWrapper = getFieldValue(pokemon, FIELD_UUID_WRAPPER)
            val uuid = if (uuidWrapper != null) {
                anyToLong(getFieldValue(uuidWrapper, FIELD_UUID_VALUE)) ?: 0L
            } else 0L

            var name = getFieldValue(pokemon, FIELD_NICKNAME)?.toString()?.trim() ?: ""
            if (name.isEmpty()) name = "Species $speciesId"

            val evsArr = parseStatsArray(getFieldValue(pokemon, FIELD_EVS))
            val evString = "${evsArr[0]}/${evsArr[1]}/${evsArr[2]}/${evsArr[4]}/${evsArr[5]}/${evsArr[3]}"

            val packedIvs = (getFieldValue(pokemon, FIELD_IVS_PACKED) as? Number)?.toInt() ?: 0
            val ivs = mapOf(
                "hp" to ((packedIvs shr 0) and 31),
                "attack" to ((packedIvs shr 5) and 31),
                "defense" to ((packedIvs shr 10) and 31),
                "speed" to ((packedIvs shr 15) and 31),
                "special_attack" to ((packedIvs shr 20) and 31),
                "special_defense" to ((packedIvs shr 25) and 31)
            )
            val ivString = "${ivs["hp"]}/${ivs["attack"]}/${ivs["defense"]}/${ivs["special_attack"]}/${ivs["special_defense"]}/${ivs["speed"]}"

            val currentHp = (getFieldValue(pokemon, FIELD_CURRENT_HP) as? Number)?.toInt() ?: 0
            val xp = (getFieldValue(pokemon, FIELD_XP) as? Number)?.toInt() ?: 0
            val gender = (getFieldValue(pokemon, FIELD_GENDER) as? Number)?.toInt() ?: 0
            val happiness = (getFieldValue(pokemon, FIELD_HAPPINESS) as? Number)?.toInt() ?: 0

            // --- FIX IS HERE: Read U30 (long) for flags ---
            val flags = (getFieldValue(pokemon, FIELD_FLAGS) as? Number)?.toLong() ?: 0L
            val variant = (getFieldValue(pokemon, FIELD_VARIANT) as? Number)?.toInt() ?: 0

            val abilitySlot = (getFieldValue(pokemon, FIELD_ABILITY_SLOT) as? Number)?.toInt() ?: 0
            val abilitySlotAlt = (getFieldValue(pokemon, FIELD_ABILITY_SLOT_ALT) as? Number)?.toInt() ?: -1
            val personalityValue = (getFieldValue(pokemon, FIELD_PERSONALITY_VALUE) as? Number)?.toInt() ?: 0
            val formId = (getFieldValue(pokemon, FIELD_FORM_ID) as? Number)?.toInt() ?: 0

            val moves = parseStatsArray(getFieldValue(pokemon, FIELD_MOVES))
            val pp = parseStatsArray(getFieldValue(pokemon, FIELD_PP))
            val slotIndexReal = (getFieldValue(pokemon, FIELD_SLOT_INDEX_REAL) as? Number)?.toInt() ?: 0

            val isShiny = variant == 1

            // Gift Flag (Bit 21)
            val isGift = (flags and 2097152L) != 0L

            // Alpha Flag (Variant 6)
            val isAlpha = variant == 6

            return linkedMapOf(
                "slot_index_real" to slotIndexReal,
                "name" to name,
                "species_id" to speciesId,
                "level" to level,
                "nature" to nature,
                "nature_id" to natureId,
                "ivs" to ivString,
                "evs" to evString,
                "original_trainer" to otName,
                "uuid" to uuid,
                "current_hp" to currentHp,
                "xp" to xp,
                "gender" to gender,
                "personality_value" to personalityValue,
                "happiness" to happiness,
                "is_shiny" to isShiny,
                "is_gift" to isGift,
                "is_alpha" to isAlpha,
                "ability_slot" to abilitySlot,
                "ability_slot_alt" to abilitySlotAlt,
                "moves" to moves.toList(),
                "pp" to pp.toList(),
                "form_id" to formId
            )
        } catch (_: Exception) { return null }
    }

    fun parseIntArray(arr: Any?): IntArray {
        if (arr == null) return IntArray(0)
        try {
            if (arr is IntArray) return arr
            if (arr is ShortArray) return arr.map { it.toInt() }.toIntArray()
            if (arr is ByteArray) return arr.map { it.toInt() }.toIntArray()
            if (arr.javaClass.isArray) {
                val len = java.lang.reflect.Array.getLength(arr)
                val stats = IntArray(len)
                for (i in 0 until len) {
                    val num = java.lang.reflect.Array.get(arr, i)
                    if (num is Number) stats[i] = num.toInt()
                }
                return stats
            }
        } catch (_: Exception) {}
        return IntArray(0)
    }

    fun parseStatsArray(arr: Any?): IntArray {
        val stats = IntArray(6)
        if (arr == null) return stats
        try {
            if (arr is IntArray) return arr
            if (arr is ShortArray) return arr.map { it.toInt() }.toIntArray()
            if (arr is ByteArray) return arr.map { it.toInt() }.toIntArray()
            if (arr.javaClass.isArray) {
                val len = java.lang.reflect.Array.getLength(arr)
                for (i in 0 until minOf(len, 6)) {
                    val num = java.lang.reflect.Array.get(arr, i)
                    if (num is Number) stats[i] = num.toInt()
                }
            }
        } catch (_: Exception) {}
        return stats
    }

    fun getFieldValue(obj: Any, fieldName: String): Any? {
        try {
            var clazz: Class<*>? = obj.javaClass
            while (clazz != null) {
                try {
                    val field = clazz.getDeclaredField(fieldName)
                    field.isAccessible = true
                    return field.get(obj)
                } catch (_: NoSuchFieldException) { clazz = clazz.superclass }
            }
        } catch (_: Exception) {}
        return null
    }
}

object RecvInterceptor {
    @JvmStatic
    @Advice.OnMethodEnter
    fun intercept(@Advice.This packet: Any) {
        // Dispatch to PacketRegistry (handles all registered handlers)
        PacketRegistry.dispatch(packet)

        // Legacy direct processing for Pokemon packets (temporary)
        SnooperHelper.debugPacket(packet)
        if (packet.javaClass.name == TARGET_PACKET_CLASS) {
            SnooperHelper.processPacket(packet)
        }
    }
}

fun initHooks() {
    Logger.info("Installing ByteBuddy hooks for ALL packets with $HANDLE_PACKET_METHOD_NAME method...")
    ByteBuddyAgent.install()
    AgentBuilder.Default()
        .with(AgentBuilder.InitializationStrategy.SelfInjection.Eager())
        .type(ElementMatchers.declaresMethod(ElementMatchers.named(HANDLE_PACKET_METHOD_NAME)))
        .transform { builder, _, _, _, _ ->
            builder.method(ElementMatchers.named(HANDLE_PACKET_METHOD_NAME))
                .intercept(Advice.to(RecvInterceptor::class.java))
        }
        .installOnByteBuddyAgent()
    Logger.info("Hooks installed successfully - intercepting ALL classes with $HANDLE_PACKET_METHOD_NAME", "Snooper")
}

fun main() {
    // Initialize Logger and ConfigManager
    val config = ConfigManager.get()
    Logger.init(
        level = ConfigManager.getLogLevel(),
        enableFileLogging = config.debug.logToFile,
        outputFile = ConfigManager.getOutputFile("snooper.log")
    )

    Logger.info("=".repeat(60), "Snooper")
    Logger.info("PokeMMO Link Snooper v1.0", "Snooper")
    Logger.info("=".repeat(60), "Snooper")
    Logger.info("Configuration loaded", "Snooper")
    Logger.info("  Log Level: ${config.debug.logLevel}", "Snooper")
    Logger.info("  Next.js URL: ${config.network.nextJsUrl}", "Snooper")
    Logger.info("  Output Directory: ${ConfigManager.getOutputDir().absolutePath}", "Snooper")
    Logger.info("  Discovery Mode: ${config.debug.discoveryMode}", "Snooper")
    Logger.info("=".repeat(60), "Snooper")

    // Register packet handlers
    if (config.debug.discoveryMode) {
        val discoveryLogger = PacketDiscoveryLogger(ConfigManager.getOutputFile("packet-discovery.log"))
        PacketRegistry.register(discoveryLogger)
        Logger.info("Discovery mode enabled - logging all packets to packet-discovery.log", "Snooper")
    }

    // TODO: Register other handlers (Pokemon, Character, Inventory, etc.)
    Logger.info("Registered ${PacketRegistry.getHandlers().size} packet handlers", "Snooper")
    Logger.info("=".repeat(60), "Snooper")

    initHooks()
    Client.main(emptyArray())
}

