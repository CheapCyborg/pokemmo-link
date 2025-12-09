import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.pokeemu.client.Client
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import net.bytebuddy.agent.ByteBuddyAgent
import net.bytebuddy.agent.builder.AgentBuilder
import net.bytebuddy.asm.Advice
import net.bytebuddy.matcher.ElementMatchers
import java.lang.reflect.Modifier
import java.util.LinkedHashMap

// --- Configuration ---
val HANDLE_PACKET_METHOD_NAME = "yk0"
val POKEMMO_PACKAGE_PREFIX = "f."
val TARGET_PACKET_CLASS = "f.FQ0"

// --- Field Mappings ---
val PARTY_ARRAY_FIELD = "IB0"
val WRAPPER_FIELD_POKEMON = "jH1"

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
val FIELD_UUID = "Gg0"
val FIELD_NICKNAME = "Uy0"

// Nature (Object)
val FIELD_NATURE_OBJ = "FB1"
val FIELD_NATURE_ID_INTERNAL = "XS1"

// Extra Fields
val FIELD_CURRENT_HP = "eA0"
val FIELD_XP = "Sp0"
val FIELD_GENDER = "bG0"
val FIELD_HAPPINESS = "Vt1"

// CRITICAL FIX: U30 is the Long field containing Shiny/Gift flags
val FIELD_FLAGS = "U30"
val FIELD_VARIANT = "sW"

val FIELD_MOVES = "y5"
val FIELD_PP = "vr0"
val FIELD_ABILITY_SLOT = "t8"
val FIELD_FORM_ID = "Kv"
val FIELD_PERSONALITY_VALUE = "rC"

// Nature Map
val NATURE_MAP = mapOf(
    0 to "Hardy", 1 to "Lonely", 2 to "Brave", 3 to "Adamant", 4 to "Naughty",
    5 to "Bold", 6 to "Docile", 7 to "Relaxed", 8 to "Impish", 9 to "Lax",
    10 to "Timid", 11 to "Hasty", 12 to "Serious", 13 to "Jolly", 14 to "Naive",
    15 to "Modest", 16 to "Mild", 17 to "Quiet", 18 to "Bashful", 19 to "Rash",
    20 to "Calm", 21 to "Gentle", 22 to "Sassy", 23 to "Careful", 24 to "Quirky"
)

// Known daycare ids
val DAYCARE_CONTAINER_IDS = setOf(6, 7)
val DAYCARE_REGION_CAPACITY = 26

object SnooperHelper {
    val gson = Gson()


    // --- Debug toggles ---
    private const val DEBUG_ALL_PACKETS = true
    private const val DEBUG_FQ0_SUMMARY = true
    private const val DEBUG_DUMP_ALL_PACKET_FIELDS = false
    private const val DEBUG_FQ0_PEEK_MONS = 8

    fun postToNextJs(payload: Any) {
        try {
            val url = URL("http://localhost:3000/api/ingest")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true

            val jsonData = gson.toJson(payload)
            connection.outputStream.use { os ->
                os.write(jsonData.toByteArray(Charsets.UTF_8))
            }

            if (connection.responseCode == 200) {
                val containerType = when (payload) {
                    is PokemonDumpSchema.DumpEnvelope -> payload.source.containerType
                    is Map<*, *> -> (payload["source"] as? Map<*, *>)?.get("container_type")?.toString()
                    else -> null
                }
                println("✓ Synced to Next.js" + (containerType?.let { " ($it)" } ?: ""))
            }
        } catch (e: Exception) {
            // Silently fail if API is down, we rely on file dumps mainly
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

                            if (value != null && !field.type.isPrimitive &&
                                field.type != String::class.java &&
                                !field.type.name.startsWith("java.") &&
                                prefix.length < 20
                            ) {
                                sb.append("$prefix  >>> Expanding ${field.name} (${field.type.simpleName}):\n")
                                dumpObj(value, "$prefix    ")
                            }

                            if (value != null && field.type.isArray && prefix.length < 20) {
                                val len = java.lang.reflect.Array.getLength(value)
                                sb.append("$prefix  >>> Expanding Array ${field.name} (len=$len):\n")
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

    private fun anyToInt(v: Any?): Int? = when (v) {
        is Int -> v
        is Number -> v.toInt()
        else -> null
    }

    fun debugPacket(packet: Any) {
        val cls = packet.javaClass.name

        if (DEBUG_ALL_PACKETS) println(">>> PACKET: $cls")

        if (cls == TARGET_PACKET_CLASS && DEBUG_DUMP_ALL_PACKET_FIELDS) {
            dumpDebug(packet, "TARGET PACKET (Party/PC Update)")
        }

        if (!DEBUG_FQ0_SUMMARY) return
        if (cls != TARGET_PACKET_CLASS) return

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
                hbRaw = (getFieldValue(containerInfo, FIELD_CONTAINER_ID_REAL) as? Number)?.toInt() ?: hbRaw
                cap = (getFieldValue(containerInfo, FIELD_CONTAINER_CAPACITY) as? Number)?.toInt() ?: cap
                break
            }
        }

        println("    → FQ0 summary: hb=$hbRaw, capacity=$cap, arrayLen=$length")

        if (pokemonArray != null && pokemonArray.javaClass.isArray) {
            var shown = 0
            for (i in 0 until length) {
                if (shown >= DEBUG_FQ0_PEEK_MONS) break
                val slotWrapper = java.lang.reflect.Array.get(pokemonArray, i) ?: continue
                val pokemon = getFieldValue(slotWrapper, WRAPPER_FIELD_POKEMON) ?: continue

                val speciesObj = getFieldValue(pokemon, FIELD_SPECIES_ID)
                val speciesId = when (speciesObj) {
                    is Int -> speciesObj
                    is Short -> speciesObj.toInt()
                    else -> continue
                }

                val ch1 = (getFieldValue(pokemon, FIELD_SLOT_INDEX_REAL) as? Number)?.toInt()
                println("      - mon[$i]: species=$speciesId, Ch1=$ch1")
                shown++
            }
        }
    }

    private fun boxKeyRank(key: String): Pair<Int, Int> = when {
        key.startsWith("box_") -> 0 to (key.removePrefix("box_").toIntOrNull() ?: Int.MAX_VALUE)
        key == "account_box" -> 1 to 0
        key.startsWith("extra_box_") -> 2 to (key.removePrefix("extra_box_").toIntOrNull() ?: Int.MAX_VALUE)
        else -> 3 to Int.MAX_VALUE
    }

    private fun <T> orderedByBoxKey(map: Map<String, T>): LinkedHashMap<String, T> {
        val ordered = LinkedHashMap<String, T>()
        val keys = map.keys.sortedWith(
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
            val pokemonArray = getFieldValue(packet, PARTY_ARRAY_FIELD)
            if (pokemonArray == null || !pokemonArray.javaClass.isArray) return

            val length = java.lang.reflect.Array.getLength(pokemonArray)
            val pokemonList = mutableListOf<Map<String, Any?>>()

            var hbRaw = -1
            var containerCapacity = -1

            for (i in 0 until length) {
                val slotWrapper = java.lang.reflect.Array.get(pokemonArray, i) ?: continue
                val pokemon = getFieldValue(slotWrapper, WRAPPER_FIELD_POKEMON) ?: continue

                if (hbRaw == -1 || containerCapacity == -1) {
                    val containerInfo = getFieldValue(pokemon, FIELD_CONTAINER_INFO)
                    if (containerInfo != null) {
                        val cap = (getFieldValue(containerInfo, FIELD_CONTAINER_CAPACITY) as? Number)?.toInt()
                        val realHb = (getFieldValue(containerInfo, FIELD_CONTAINER_ID_REAL) as? Number)?.toInt()
                        if (cap != null) containerCapacity = cap
                        if (realHb != null) hbRaw = realHb
                    }
                }

                val data = extractPokemonData(pokemon)
                if (data != null) {
                    val m = data.toMutableMap()
                    m["slot_index_array"] = i
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
                        (containerCapacity == 2 || containerCapacity == 3) ||
                        (containerCapacity == DAYCARE_REGION_CAPACITY && pokemonList.size <= 6) ||
                        (!isPcStorage && containerCapacity in 7..40 && pokemonList.size in 1..3)

            val containerType = when {
                isPcStorage -> "pc_boxes"
                containerCapacity == 6 -> "party"
                isDaycare -> "daycare"
                else -> "unknown"
            }

            println(">>> Processing FQ0: hb=$hbRaw, Capacity=$containerCapacity, Type=$containerType, Count=${pokemonList.size}")

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

            var records = pokemonList.mapIndexedNotNull { idx, extracted ->
                val slotIdx = resolveSlotIdx(extracted, idx, containerType)
                PokemonDumpSchema.fromExtractedMap(extracted, slotIdx)
            }.sortedBy { it.slot }

            // Write logic based on container type
            when (containerType) {
                "party" -> {
                    
                val env = PokemonDumpSchema.envelope(
                    packetClass = packet.javaClass.name,
                    containerId = hbRaw,
                    containerType = "party",
                    records = records
                )
                    PokemonDumpSchema.writeEnvelope(File("team_dump.json"), env)

                    postToNextJs(env)
                }

                "daycare" -> {
                    val sorted = records.sortedBy { it.slot }
                    records = sorted.mapIndexed { idx, rec -> rec.copy(slot = idx) }
                    val normalizedCapacity = 2.coerceAtLeast(records.size).coerceAtMost(3)
                    val env = PokemonDumpSchema.envelope(packet.javaClass.name, hbRaw, "daycare", normalizedCapacity, records)
                    PokemonDumpSchema.writeEnvelope(File("daycare_dump.json"), env)
                    postToNextJs(env)
                }

                "pc_boxes" -> {
                    val PC_BOX_SIZE = 60
                    val STANDARD_BOX_COUNT = 11

                    fun resolveBoxKeyAndType(boxIndex0: Int): Triple<String, String, Int> = when {
                        boxIndex0 in 0 until STANDARD_BOX_COUNT -> Triple("box_${boxIndex0 + 1}", "pc_box", boxIndex0 + 1)
                        boxIndex0 == STANDARD_BOX_COUNT -> Triple("account_box", "account_box", boxIndex0 + 1)
                        else -> Triple("extra_box_${boxIndex0 + 1}", "pc_box_extra", boxIndex0 + 1)
                    }

                    val boxGroups = mutableMapOf<String, MutableList<PokemonDumpSchema.PokemonRecord>>()
                    val boxMeta = mutableMapOf<String, Pair<String, Int>>()

                    for (record in records) {
                        val globalSlot = record.slot
                        val boxIndex0 = globalSlot / PC_BOX_SIZE
                        val slotInBox = globalSlot % PC_BOX_SIZE
                        val (boxKey, boxType, boxNumericId) = resolveBoxKeyAndType(boxIndex0)
                        val updated = record.copy(slot = slotInBox)
                        boxGroups.computeIfAbsent(boxKey) { mutableListOf() }.add(updated)
                        boxMeta[boxKey] = Pair(boxType, boxNumericId)
                    }

                    val newBoxes = mutableMapOf<String, PokemonDumpSchema.DumpEnvelope>()
                    for ((boxKey, mons) in boxGroups) {
                        val (boxType, boxNumericId) = boxMeta.getValue(boxKey)
                        newBoxes[boxKey] = PokemonDumpSchema.envelope(packet.javaClass.name, boxNumericId, boxType, PC_BOX_SIZE, mons.sortedBy { it.slot })
                    }

                    println(">>> Merging PC Boxes...")
                    val mergedBoxes = mergePcBoxes(newBoxes)
                    val pcPayload = linkedMapOf(
                        "schema_version" to 2,
                        "captured_at_ms" to System.currentTimeMillis(),
                        "source" to linkedMapOf(
                            "packet_class" to packet.javaClass.name,
                            "container_type" to "pc_boxes",
                            "hb_raw" to hbRaw,
                            "capacity" to containerCapacity,
                            "slot_strategy" to "Ch1_global"
                        ),
                        "boxes" to mergedBoxes
                    )

                    val outFile = File("dump-pc_boxes.json")
                    outFile.writeText(gson.toJson(pcPayload))
                    println(">>> Wrote PC Boxes to ${outFile.path}")
                    postToNextJs(pcPayload)
                }
            }
        } catch (e: Exception) {
            println("!!! Processing Error: ${e.message}")
            e.printStackTrace()
        }
    }

    fun mergePcBoxes(newBoxes: Map<String, PokemonDumpSchema.DumpEnvelope>): Map<String, PokemonDumpSchema.DumpEnvelope> {
        val file = File("dump-pc_boxes.json")
        val typeToken = object : TypeToken<Map<String, Any>>() {}.type

        var pcData: MutableMap<String, PokemonDumpSchema.DumpEnvelope> = mutableMapOf()

        if (file.exists()) {
            try {
                val fullJson = gson.fromJson<Map<String, Any>>(file.readText(), typeToken)
                val boxesJson = gson.toJson(fullJson["boxes"])
                val boxesToken = object : TypeToken<MutableMap<String, PokemonDumpSchema.DumpEnvelope>>() {}.type
                pcData = gson.fromJson(boxesJson, boxesToken) ?: mutableMapOf()
            } catch (_: Exception) {}
        }

        for ((key, incomingEnv) in newBoxes) {
            val existingEnv = pcData[key]
            if (existingEnv == null) {
                pcData[key] = incomingEnv
                continue
            }
            val mergedBySlot = linkedMapOf<Int, PokemonDumpSchema.PokemonRecord>()
            for (p in existingEnv.pokemon) mergedBySlot[p.slot] = p
            for (p in incomingEnv.pokemon) mergedBySlot[p.slot] = p

            pcData[key] = existingEnv.copy(
                capturedAtMs = incomingEnv.capturedAtMs,
                source = incomingEnv.source,
                pokemon = mergedBySlot.values.sortedBy { it.slot }
            )
        }
        return orderedByBoxKey(pcData)
    }

    fun extractPokemonData(pokemon: Any): Map<String, Any?>? {
        try {
            val speciesObj = getFieldValue(pokemon, FIELD_SPECIES_ID)
            val speciesId = when (speciesObj) {
                is Int -> speciesObj
                is Short -> speciesObj.toInt()
                else -> return null
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

            val uuid = (getFieldValue(pokemon, FIELD_UUID) as? Number)?.toLong() ?: 0L
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
            val personalityValue = (getFieldValue(pokemon, FIELD_PERSONALITY_VALUE) as? Number)?.toInt() ?: 0
            val formId = (getFieldValue(pokemon, FIELD_FORM_ID) as? Number)?.toInt() ?: 0

            val moves = parseStatsArray(getFieldValue(pokemon, FIELD_MOVES))
            val pp = parseStatsArray(getFieldValue(pokemon, FIELD_PP))
            val slotIndexReal = (getFieldValue(pokemon, FIELD_SLOT_INDEX_REAL) as? Number)?.toInt() ?: 0

            // 1. Shiny Flag (Bit 26 of U30)
            val isShiny = (flags and 67108864L) != 0L
            // 2. Gift/Untradable Flag (Bit 21 of U30)
            val isGift = (flags and 2097152L) != 0L
            // 3. Alpha Flag (Variant 6)
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
                "moves" to moves.toList(),
                "pp" to pp.toList(),
                "form_id" to formId
            )
        } catch (_: Exception) { return null }
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
        SnooperHelper.debugPacket(packet)
        if (packet.javaClass.name == TARGET_PACKET_CLASS) {
            SnooperHelper.processPacket(packet)
        }
    }
}

fun initHooks() {
    println("[Snooper] Installing Final Hooks for $TARGET_PACKET_CLASS...")
    ByteBuddyAgent.install()
    AgentBuilder.Default()
        .with(AgentBuilder.InitializationStrategy.SelfInjection.Eager())
        .type(ElementMatchers.nameStartsWith(POKEMMO_PACKAGE_PREFIX))
        .transform { builder, _, _, _, _ ->
            builder.method(ElementMatchers.named(HANDLE_PACKET_METHOD_NAME))
                .intercept(Advice.to(RecvInterceptor::class.java))
        }
        .installOnByteBuddyAgent()
}

fun main() {
    initHooks()
    Client.main(emptyArray())
}