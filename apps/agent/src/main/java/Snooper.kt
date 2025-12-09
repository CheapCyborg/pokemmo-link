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

// --- Configuration ---
val HANDLE_PACKET_METHOD_NAME = "yk0"
val POKEMMO_PACKAGE_PREFIX = "f."
val TARGET_PACKET_CLASS = "f.FQ0"

// --- Field Mappings ---
val PARTY_ARRAY_FIELD = "IB0"
val WRAPPER_FIELD_POKEMON = "jH1"
val FIELD_CONTAINER_ID = "Ch1"

// Pokemon Data Fields (f.LN)
val FIELD_SPECIES_ID = "QW0"
val FIELD_LEVEL = "pt0"
val FIELD_EVS = "iM0"
val FIELD_IVS_PACKED = "Tm1"
val FIELD_OT_NAME = "kr0"
val FIELD_UUID = "Gg0"
val FIELD_NICKNAME = "Uy0"

// Nature (Object)
val FIELD_NATURE_OBJ = "FB1"
val FIELD_NATURE_ID_INTERNAL = "XS1" // Inside FB1

// New Fields
val FIELD_CURRENT_HP = "eA0"
val FIELD_XP = "Sp0"
val FIELD_GENDER = "bG0"
val FIELD_HAPPINESS = "Vt1"
val FIELD_STATUS = "mp0"
val FIELD_MOVES = "y5"
val FIELD_PP = "vr0"
val FIELD_ABILITY_SLOT = "t8"
val FIELD_FORM_ID = "Kv"
val FIELD_PERSONALITY_VALUE = "rC"

// Nature Map (Standard Gen 3 order)
val NATURE_MAP = mapOf(
    0 to "Hardy", 1 to "Lonely", 2 to "Brave", 3 to "Adamant", 4 to "Naughty",
    5 to "Bold", 6 to "Docile", 7 to "Relaxed", 8 to "Impish", 9 to "Lax",
    10 to "Timid", 11 to "Hasty", 12 to "Serious", 13 to "Jolly", 14 to "Naive",
    15 to "Modest", 16 to "Mild", 17 to "Quiet", 18 to "Bashful", 19 to "Rash",
    20 to "Calm", 21 to "Gentle", 22 to "Sassy", 23 to "Careful", 24 to "Quirky"
)

// Container IDs
val PARTY_CONTAINER_IDS = setOf(1, 2)
val DAYCARE_CONTAINER_IDS = setOf(4, 5)

object SnooperHelper {
    val gson = Gson()

    // POST data to Next.js ingest endpoint
    fun postToNextJs(envelope: PokemonDumpSchema.DumpEnvelope) {
        try {
            val url = URL("http://localhost:3000/api/ingest")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true

            val jsonData = gson.toJson(envelope)
            connection.outputStream.use { os ->
                os.write(jsonData.toByteArray(Charsets.UTF_8))
            }

            if (connection.responseCode == 200) {
                println("✓ Synced to Next.js (${envelope.source.containerType})")
            }
        } catch (e: Exception) {
            // Ignore connection errors
        }
    }

    fun dumpDebug(obj: Any, label: String) {
        try {
            val file = File("C:/Users/damia/IdeaProjects/PokeSnooper/dump-debug-fields.txt")
            val sb = StringBuilder()
            sb.append("--- DEBUG: $label ---\n")
            
            fun dumpObj(o: Any, prefix: String) {
                var clazz: Class<*>? = o.javaClass
                while (clazz != null) {
                    for (field in clazz.declaredFields) {
                        if (Modifier.isStatic(field.modifiers)) continue
                        field.isAccessible = true
                        try {
                            val value = field.get(o)
                            sb.append("$prefix${field.name} (${field.type.simpleName}) = $value\n")
                            
                            // Recurse into ALL non-primitive, non-String objects (limit depth)
                            if (value != null && !field.type.isPrimitive && 
                                field.type != String::class.java &&
                                !field.type.name.startsWith("java.") &&
                                prefix.length < 20) { // Prevent infinite recursion
                                sb.append("$prefix  >>> Expanding ${field.name}:\n")
                                dumpObj(value, "$prefix    ")
                            }
                            
                            // Expand ALL Arrays
                            if (value != null && field.type.isArray && prefix.length < 20) {
                                val len = java.lang.reflect.Array.getLength(value)
                                sb.append("$prefix  >>> Expanding Array ${field.name} (len=$len):\n")
                                if (len > 0) {
                                    val componentType = field.type.componentType
                                    for (i in 0 until minOf(len, 10)) { // Limit to first 10 items
                                        val item = java.lang.reflect.Array.get(value, i)
                                        if (componentType.isPrimitive) {
                                            // For primitive arrays, just print the values
                                            sb.append("$prefix    [$i] = $item\n")
                                        } else if (item != null) {
                                            sb.append("$prefix    [$i]:\n")
                                            dumpObj(item, "$prefix      ")
                                        }
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

    @JvmStatic
    fun processPacket(packet: Any) {
        try {
            val pokemonArray = getFieldValue(packet, PARTY_ARRAY_FIELD)

            if (pokemonArray != null && pokemonArray.javaClass.isArray) {
                val length = java.lang.reflect.Array.getLength(pokemonArray)
                val pokemonList = mutableListOf<Map<String, Any?>>()
                var containerId = -1

                // 1. Extract Pokemon & Determine Container ID
                for (i in 0 until length) {
                    val slotWrapper = java.lang.reflect.Array.get(pokemonArray, i)
                    if (slotWrapper != null) {
                        val pokemon = getFieldValue(slotWrapper, WRAPPER_FIELD_POKEMON)
                        if (pokemon != null) {
                            // Try to grab container ID from the first valid pokemon we see
                            if (containerId == -1) {
                                val cId = (getFieldValue(pokemon, FIELD_CONTAINER_ID) as? Number)?.toInt()
                                if (cId != null) containerId = cId
                            }

                            val data = extractPokemonData(pokemon)
                            if (data != null) {
                                // Debugging disabled for production
                                 if (containerId == 1) {
                                     if (i == 0) File("C:/Users/damia/IdeaProjects/PokeSnooper/dump-debug-fields.txt").writeText("")
                                     SnooperHelper.dumpDebug(pokemon, "Party Slot $i (Species ${data["species_id"]})")
                                 }
                                pokemonList.add(data)
                            }
                        }
                    }
                }

                if (pokemonList.isEmpty()) return

                // 2. Determine Container Type
                val containerType = when {
                    PARTY_CONTAINER_IDS.contains(containerId) -> "party"
                    DAYCARE_CONTAINER_IDS.contains(containerId) -> "daycare"
                    else -> "pc_box"
                }

                // 3. Convert to Schema
                val records = pokemonList.mapIndexedNotNull { idx, extracted ->
                    PokemonDumpSchema.fromExtractedMap(extracted, idx)
                }

                val env = PokemonDumpSchema.envelope(
                    packetClass = packet.javaClass.name,
                    containerId = containerId,
                    containerType = containerType,
                    records = records
                )

                // 4. Route to Correct File & Sync
                when (containerType) {
                    "party" -> {
                        println(">>> Updating Party (Container $containerId)...")
                        PokemonDumpSchema.writeEnvelope(File("team_dump.json"), env)
                        postToNextJs(env)
                    }
                    "daycare" -> {
                        println(">>> Updating Daycare (Container $containerId)...")
                        PokemonDumpSchema.writeEnvelope(File("daycare_dump.json"), env)
                        postToNextJs(env)
                    }
                    else -> {
                        println(">>> Updating PC Box (Container $containerId)...")
                        updatePcFile(containerId, env)
                    }
                }
            }
        } catch (e: Exception) {
            println("Error processing packet: ${e.message}")
        }
    }

    // Merge PC boxes into one big JSON file
    fun updatePcFile(boxId: Int, env: PokemonDumpSchema.DumpEnvelope) {
        val file = File("pc_boxes.json")
        val typeToken = object : TypeToken<MutableMap<String, PokemonDumpSchema.DumpEnvelope>>() {}.type
        var pcData: MutableMap<String, PokemonDumpSchema.DumpEnvelope> = mutableMapOf()

        if (file.exists()) {
            try {
                pcData = gson.fromJson(file.readText(), typeToken) ?: mutableMapOf()
            } catch (_: Exception) {}
        }

        pcData["box_$boxId"] = env
        file.writeText(gson.toJson(pcData))
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
            
            // Nature: Object -> ID -> String
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

            // EV Handling
            val evObj = getFieldValue(pokemon, FIELD_EVS)
            val evsArr = parseStatsArray(evObj)
            val evString = "${evsArr[0]}/${evsArr[1]}/${evsArr[2]}/${evsArr[4]}/${evsArr[5]}/${evsArr[3]}"

            // IV Handling
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

            // Extra fields
            val currentHp = (getFieldValue(pokemon, FIELD_CURRENT_HP) as? Number)?.toInt() ?: 0
            val xp = (getFieldValue(pokemon, FIELD_XP) as? Number)?.toInt() ?: 0
            val gender = (getFieldValue(pokemon, FIELD_GENDER) as? Number)?.toInt() ?: 0
            val happiness = (getFieldValue(pokemon, FIELD_HAPPINESS) as? Number)?.toInt() ?: 0
            val status = (getFieldValue(pokemon, FIELD_STATUS) as? Number)?.toInt() ?: 0
            val abilitySlot = (getFieldValue(pokemon, FIELD_ABILITY_SLOT) as? Number)?.toInt() ?: 0
            val personalityValue = (getFieldValue(pokemon, FIELD_PERSONALITY_VALUE) as? Number)?.toInt() ?: 0
            
            val moves = parseStatsArray(getFieldValue(pokemon, FIELD_MOVES))
            val pp = parseStatsArray(getFieldValue(pokemon, FIELD_PP))
            val formId = (getFieldValue(pokemon, FIELD_FORM_ID) as? Number)?.toInt() ?: 0

            return linkedMapOf(
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
                "personality_value" to personalityValue,
                "happiness" to happiness,
                "status" to status,
                "ability_slot" to abilitySlot,
                "moves" to moves.toList(),
                "pp" to pp.toList(),
                "form_id" to formId
            )
        } catch (e: Exception) {
            return null
        }
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
        } catch (e: Exception) {}
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
                } catch (e: NoSuchFieldException) {
                    clazz = clazz.superclass
                }
            }
        } catch (e: Exception) { }
        return null
    }
}

object RecvInterceptor {
    @JvmStatic
    @Advice.OnMethodEnter
    fun intercept(@Advice.This packet: Any) {
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
