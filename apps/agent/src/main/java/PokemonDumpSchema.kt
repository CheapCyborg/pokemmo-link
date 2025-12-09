// PokemonDumpSchema.kt
@file:Suppress("MemberVisibilityCanBePrivate", "unused")

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.annotations.SerializedName
import java.io.File

/**
 * Stable output schema + adapter for your current extractor output Map<String, Any?>
 *
 * This does NOT contain any hooking/injection/packet interception code. It just normalizes the data
 * you already extracted into a consistent template.
 */
object PokemonDumpSchema {

    // ─────────────────────────────────────────────────────────────────────────────
    // 1) Stable JSON model v2 - Cleaner structure
    // ─────────────────────────────────────────────────────────────────────────────

    data class DumpEnvelope(
        @SerializedName("schema_version") val schemaVersion: Int = 2,
        @SerializedName("captured_at_ms") val capturedAtMs: Long = System.currentTimeMillis(),
        @SerializedName("source") val source: DumpSource,
        @SerializedName("pokemon") val pokemon: List<PokemonRecord>
    )

    data class PcBoxesEnvelope(
        @SerializedName("schema_version") val schemaVersion: Int = 2,
        @SerializedName("captured_at_ms") val capturedAtMs: Long = System.currentTimeMillis(),
        @SerializedName("source") val source: PcBoxesSource,
        @SerializedName("boxes") val boxes: Map<String, DumpEnvelope>
    )

    data class DumpSource(
            @SerializedName("packet_class") val packetClass: String,
            @SerializedName("container_id") val containerId: Int,
            @SerializedName("container_type") val containerType: String,
            @SerializedName("capacity") val capacity: Int = 0
    )

    data class PcBoxesSource(
            @SerializedName("packet_class") val packetClass: String,
            @SerializedName("container_type") val containerType: String,
            @SerializedName("hb_raw") val hbRaw: Int,
            @SerializedName("capacity") val capacity: Int,
            @SerializedName("slot_strategy") val slotStrategy: String = "Ch1_global"
    )

    data class PokemonRecord(
            @SerializedName("slot") val slot: Int,
            @SerializedName("identity") val identity: Identity,
            @SerializedName("state") val state: State,
            @SerializedName("stats") val stats: Stats,
            @SerializedName("moves") val moves: List<Move> = emptyList(),
            @SerializedName("ability") val ability: Ability = Ability(),
            @SerializedName("pokeapi_override") val pokeapiOverride: String? = null
    )

    data class Identity(
            @SerializedName("uuid") val uuid: Long,
            @SerializedName("species_id") val speciesId: Int,
            @SerializedName("form_id") val formId: Int? = null,
            @SerializedName("nickname") val nickname: String,
            @SerializedName("ot_name") val otName: String,
            @SerializedName("personality_value") val personalityValue: Int,
            @SerializedName("is_shiny") val isShiny: Boolean? = null,
            @SerializedName("is_gift") val isGift: Boolean? = null,
            @SerializedName("is_alpha") val isAlpha: Boolean? = null
    )

    data class State(
            @SerializedName("level") val level: Int,
            @SerializedName("nature") val nature: String,
            @SerializedName("current_hp") val currentHp: Int? = null,
            @SerializedName("xp") val xp: Int? = null,
            @SerializedName("happiness") val happiness: Int? = null,
    )

    data class Stats(
            @SerializedName("evs") val evs: StatBlock,
            @SerializedName("ivs") val ivs: StatBlock
    )

    data class StatBlock(
            @SerializedName("hp") val hp: Int = 0,
            @SerializedName("atk") val atk: Int = 0,
            @SerializedName("def") val def: Int = 0,
            @SerializedName("spa") val spa: Int = 0,
            @SerializedName("spd") val spd: Int = 0,
            @SerializedName("spe") val spe: Int = 0
    )

    data class Move(
            @SerializedName("move_id") val moveId: Int,
            @SerializedName("pp") val pp: Int? = null
    )

    data class Ability(
            @SerializedName("id") val id: Int? = null,
            @SerializedName("slot") val slot: Int? = null
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // 2) Field-map manifest (for you to track obfuscated mappings per build)
    //    This is a TEMPLATE file: it’s your “what-is-what” contract.
    // ─────────────────────────────────────────────────────────────────────────────

    data class FieldMapManifest(
            @SerializedName("map_version") val mapVersion: Int = 1,
            @SerializedName("notes") val notes: String = "Update me per PokeMMO build",
            @SerializedName("pokemon_fields") val pokemonFields: PokemonFields = PokemonFields(),
            @SerializedName("stat_order") val statOrder: StatOrder = StatOrder()
    )

    data class PokemonFields(
            @SerializedName("species_id") val speciesId: String? = null,
            @SerializedName("level") val level: String? = null,
            @SerializedName("evs") val evs: String? = null,
            @SerializedName("ivs_packed") val ivsPacked: String? = null,
            @SerializedName("nature") val nature: String? = null,
            @SerializedName("ot_name") val otName: String? = null,
            @SerializedName("uuid") val uuid: String? = null,
            @SerializedName("nickname") val nickname: String? = null,
            @SerializedName("moves") val moves: String? = null,
            @SerializedName("ability") val ability: String? = null,
            @SerializedName("form_id") val formId: String? = null
    )

    /**
     * IMPORTANT: Your current EV raw array seems to be in internal order: [hp, atk, def, spe, spa,
     * spd]
     *
     * This manifest makes that explicit by mapping indices -> stat names.
     */
    data class StatOrder(
            @SerializedName("indices")
            val indices: Map<String, Int> =
                    mapOf("hp" to 0, "atk" to 1, "def" to 2, "spe" to 3, "spa" to 4, "spd" to 5)
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // 3) Gson + manifest load/save
    // ─────────────────────────────────────────────────────────────────────────────

    val gson: Gson = GsonBuilder().serializeNulls().setPrettyPrinting().create()

    fun loadOrCreateManifest(file: File = File("field_map.json")): FieldMapManifest {
        if (file.exists()) {
            return runCatching { gson.fromJson(file.readText(), FieldMapManifest::class.java) }
                    .getOrElse { FieldMapManifest() }
        }

        val template =
                FieldMapManifest(
                        pokemonFields =
                                PokemonFields(
                                        // leave null here, OR fill with your current obfuscated
                                        // names if you want:
                                        // speciesId = "QW0", level = "pt0", evs = "iM0", ivsPacked
                                        // = "Tm1", nature = "FB1", ...
                                        )
                )
        file.writeText(gson.toJson(template))
        return template
    }

        private fun asBooleanFlag(value: Any?): Boolean? =
                        when (value) {
                                null -> null
                                is Boolean -> value
                                is Number -> value.toInt() != 0
                                is String ->
                                                value.toBooleanStrictOrNull()
                                                                ?: value.toIntOrNull()?.let { it != 0 }
                                else -> null
                        }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4) Adapter: Convert YOUR current extractPokemonData() map -> stable schema
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Expected keys from your current extractor:
     * - name, species_id, level, nature, ivs (string), evs (string), original_trainer, uuid
     * Optional:
     * - moves: int list/array, form, pokeapiName, form_source
     * - flags: is_shiny, is_gift, is_alpha
     */
    fun fromExtractedMap(
            extracted: Map<String, Any?>,
            slotIndex: Int,
            statOrder: StatOrder = loadOrCreateManifest().statOrder
    ): PokemonRecord? {
        val speciesId = (extracted["species_id"] as? Number)?.toInt() ?: return null
        val level = (extracted["level"] as? Number)?.toInt() ?: 0
        val nature = extracted["nature"]?.toString() ?: "Unknown"
        val uuid = (extracted["uuid"] as? Number)?.toLong() ?: 0L
        val nickname =
                extracted["name"]?.toString()?.trim().orEmpty().ifBlank { "Species $speciesId" }
        val otName = extracted["original_trainer"]?.toString() ?: "Unknown"
        val personalityValue = (extracted["personality_value"] as? Number)?.toInt() ?: 0

        val legacyIvs = extracted["ivs"]?.toString()
        val legacyEvs = extracted["evs"]?.toString()

        val ivsBlock = legacyIvs?.let(::parseLegacyIvsString) ?: StatBlock()
        val (_, evsBlock) =
                legacyEvs?.let { parseLegacyEvsString(it, statOrder) }
                        ?: (List(6) { 0 } to StatBlock())

        val moves = normalizeMoves(extracted["moves"], extracted["pp"])

        val formId = (extracted["form_id"] as? Number)?.toInt()
        val pokeapiOverride = extracted["pokeapiName"]?.toString()

        val abilityId = (extracted["ability_id"] as? Number)?.toInt()
        val abilitySlot = (extracted["ability_slot"] as? Number)?.toInt()

        val isShiny = asBooleanFlag(extracted["is_shiny"])
        val isGift = asBooleanFlag(extracted["is_gift"])
        val isAlpha = asBooleanFlag(extracted["is_alpha"])

        return PokemonRecord(
                slot = slotIndex,
                identity =
                        Identity(
                                uuid = uuid,
                                speciesId = speciesId,
                                formId = formId,
                                nickname = nickname,
                                otName = otName,
                                personalityValue = personalityValue,
                                isShiny = isShiny,
                                isGift = isGift,
                                isAlpha = isAlpha,
                        ),
                state = State(
                        level = level,
                        nature = nature,
                        currentHp = (extracted["current_hp"] as? Number)?.toInt(),
                        xp = (extracted["xp"] as? Number)?.toInt(),
                        happiness = (extracted["happiness"] as? Number)?.toInt(),
                ),
                stats =
                        Stats(
                                evs = evsBlock,
                                ivs = ivsBlock
                        ),
                moves = moves,
                ability = Ability(id = abilityId, slot = abilitySlot),
                pokeapiOverride = pokeapiOverride
        )
    }

    fun envelope(
            packetClass: String,
            containerId: Int,
            containerType: String,
            capacity: Int = 0,
            records: List<PokemonRecord>
    ): DumpEnvelope =
            DumpEnvelope(
                    source =
                            DumpSource(
                                    packetClass = packetClass,
                                    containerId = containerId,
                                    containerType = containerType,
                                    capacity = capacity
                            ),
                    pokemon = records
            )

    fun writeEnvelope(file: File, envelope: DumpEnvelope) {
        file.writeText(gson.toJson(envelope))
    }

    fun pcBoxesEnvelope(
            packetClass: String,
            hbRaw: Int,
            capacity: Int,
            boxes: Map<String, DumpEnvelope>
    ): PcBoxesEnvelope =
            PcBoxesEnvelope(
                    source =
                            PcBoxesSource(
                                    packetClass = packetClass,
                                    containerType = "pc_boxes",
                                    hbRaw = hbRaw,
                                    capacity = capacity
                            ),
                    boxes = boxes
            )

    fun writePcBoxesEnvelope(file: File, envelope: PcBoxesEnvelope) {
        file.writeText(gson.toJson(envelope))
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 5) Parsers / normalizers (opinionated + predictable)
    // ─────────────────────────────────────────────────────────────────────────────

    // legacy iv string format: "hp/atk/def/spa/spd/spe"
    fun parseLegacyIvsString(s: String): StatBlock {
        val parts = s.split("/").mapNotNull { it.trim().toIntOrNull() }
        return StatBlock(
                hp = parts.getOrElse(0) { 0 },
                atk = parts.getOrElse(1) { 0 },
                def = parts.getOrElse(2) { 0 },
                spa = parts.getOrElse(3) { 0 },
                spd = parts.getOrElse(4) { 0 },
                spe = parts.getOrElse(5) { 0 }
        )
    }

    // legacy ev string format from your code: "hp/atk/def/spa/spd/spe"
    // (even if the underlying raw order was different)
    fun parseLegacyEvsString(s: String, statOrder: StatOrder): Pair<List<Int>, StatBlock> {
        val parts = s.split("/").mapNotNull { it.trim().toIntOrNull() }
        val hp = parts.getOrElse(0) { 0 }
        val atk = parts.getOrElse(1) { 0 }
        val def = parts.getOrElse(2) { 0 }
        val spa = parts.getOrElse(3) { 0 }
        val spd = parts.getOrElse(4) { 0 }
        val spe = parts.getOrElse(5) { 0 }

        // Also reconstruct a best-effort "raw" list in *your internal* order if you want it.
        // Using manifest indices -> place values.
        val raw = MutableList(6) { 0 }
        fun put(stat: String, value: Int) {
            val idx = statOrder.indices[stat] ?: return
            if (idx in 0..5) raw[idx] = value
        }
        put("hp", hp)
        put("atk", atk)
        put("def", def)
        put("spa", spa)
        put("spd", spd)
        put("spe", spe)

        return raw to StatBlock(hp = hp, atk = atk, def = def, spa = spa, spd = spd, spe = spe)
    }

    fun normalizeMoves(v: Any?, pp: Any? = null): List<Move> {
        if (v == null) return emptyList()

        val ints: List<Int> =
                when (v) {
                    is IntArray -> v.toList()
                    is ShortArray -> v.map { it.toInt() }
                    is ByteArray -> v.map { it.toInt() }
                    is List<*> -> v.mapNotNull { (it as? Number)?.toInt() }
                    else -> emptyList()
                }

        val pps: List<Int> =
                when (pp) {
                    is IntArray -> pp.toList()
                    is ShortArray -> pp.map { it.toInt() }
                    is ByteArray -> pp.map { it.toInt() }
                    is List<*> -> pp.mapNotNull { (it as? Number)?.toInt() }
                    else -> emptyList()
                }

        // cap to 4 like a normal moveset, keep zeros if you want; I prefer filtering zeros:
        return ints.take(4).mapIndexedNotNull { index, moveId ->
            if (moveId == 0) null
            else Move(moveId, pps.getOrNull(index))
        }
    }
}

/*
───────────────────────────────────────────────────────────────────────────────
HOW TO USE (paste these calls into YOUR existing code)

Assume you currently build pokemonList as List<Map<String, Any?>>

val records = pokemonList.mapIndexedNotNull { idx, extracted ->
    PokemonDumpSchema.fromExtractedMap(extracted, slotIndex = idx)
}

val env = PokemonDumpSchema.envelope(
    packetClass = packet.javaClass.name,
    containerId = containerId,
    containerType = containerType, // "party" / "daycare" / "pc_box"
    records = records
)

PokemonDumpSchema.writeEnvelope(File("team_dump.json"), env)

Also: the first run will create field_map.json next to your jar/exe.
Edit it to document each new build’s mapping + the EV index order.
───────────────────────────────────────────────────────────────────────────────
*/
