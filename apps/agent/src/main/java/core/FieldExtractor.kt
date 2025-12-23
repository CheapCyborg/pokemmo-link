package core

import java.lang.reflect.Modifier

/**
 * Reusable reflection utilities for extracting fields from any object.
 * Supports nested inspection, type conversion, and array handling.
 */
object FieldExtractor {
    /**
     * Extract a single field value by name (traverses superclasses)
     */
    fun getValue(obj: Any, fieldName: String): Any? {
        try {
            var clazz: Class<*>? = obj.javaClass
            while (clazz != null) {
                try {
                    val field = clazz.getDeclaredField(fieldName)
                    field.isAccessible = true
                    return field.get(obj)
                } catch (_: NoSuchFieldException) {
                    clazz = clazz.superclass
                }
            }
        } catch (_: Exception) {}
        return null
    }

    /**
     * Extract multiple fields at once (batch operation)
     */
    fun getValues(obj: Any, fieldNames: List<String>): Map<String, Any?> {
        return fieldNames.associateWith { getValue(obj, it) }
    }

    /**
     * Get ALL fields for discovery mode (includes superclass fields)
     */
    fun getAllFields(obj: Any, includeNulls: Boolean = false, maxDepth: Int = 1): Map<String, Any?> {
        val fields = mutableMapOf<String, Any?>()
        var clazz: Class<*>? = obj.javaClass

        while (clazz != null && clazz != Any::class.java) {
            for (field in clazz.declaredFields) {
                if (Modifier.isStatic(field.modifiers)) continue

                field.isAccessible = true
                try {
                    val value = field.get(obj)
                    if (value == null && !includeNulls) continue

                    fields[field.name] = value
                } catch (e: Exception) {
                    fields[field.name] = "<error: ${e.message}>"
                }
            }
            clazz = clazz.superclass
        }

        return fields
    }

    /**
     * Deep inspection for nested objects (recursive)
     */
    fun inspectNested(obj: Any, maxDepth: Int = 2, currentDepth: Int = 0): Map<String, Any?> {
        if (currentDepth >= maxDepth) return mapOf("..." to "<max depth reached>")

        val fields = mutableMapOf<String, Any?>()
        var clazz: Class<*>? = obj.javaClass

        while (clazz != null && clazz != Any::class.java) {
            for (field in clazz.declaredFields) {
                if (Modifier.isStatic(field.modifiers)) continue

                field.isAccessible = true
                try {
                    val value = field.get(obj)
                    when {
                        value == null -> fields[field.name] = null
                        field.type.isPrimitive || field.type == String::class.java -> {
                            fields[field.name] = value
                        }
                        field.type.isArray -> {
                            val len = java.lang.reflect.Array.getLength(value)
                            fields[field.name] = "Array[$len]"
                        }
                        field.type.name.startsWith("java.") -> {
                            fields[field.name] = value.toString()
                        }
                        else -> {
                            // Nested object - recurse
                            fields[field.name] = inspectNested(value, maxDepth, currentDepth + 1)
                        }
                    }
                } catch (e: Exception) {
                    fields[field.name] = "<error: ${e.message}>"
                }
            }
            clazz = clazz.superclass
        }

        return fields
    }

    /**
     * Type-safe extraction with fallback default value
     */
    inline fun <reified T> getValueAs(obj: Any, fieldName: String, default: T): T {
        val value = getValue(obj, fieldName)
        return when {
            value is T -> value
            value is Number && T::class == Int::class -> value.toInt() as T
            value is Number && T::class == Long::class -> value.toLong() as T
            value is Number && T::class == Double::class -> value.toDouble() as T
            else -> default
        }
    }

    /**
     * Convert various array types to IntArray
     */
    fun toIntArray(value: Any?, size: Int = 6): IntArray {
        val result = IntArray(size)
        if (value == null) return result

        try {
            when (value) {
                is IntArray -> return value.copyOf(minOf(value.size, size))
                is ShortArray -> return value.map { it.toInt() }.toIntArray().copyOf(minOf(value.size, size))
                is ByteArray -> return value.map { it.toInt() }.toIntArray().copyOf(minOf(value.size, size))
                else -> {
                    if (value.javaClass.isArray) {
                        val len = java.lang.reflect.Array.getLength(value)
                        for (i in 0 until minOf(len, size)) {
                            val item = java.lang.reflect.Array.get(value, i)
                            if (item is Number) {
                                result[i] = item.toInt()
                            }
                        }
                    }
                }
            }
        } catch (_: Exception) {}

        return result
    }

    /**
     * Create a human-readable summary of an object's structure
     */
    fun summarize(obj: Any, includeValues: Boolean = false): String {
        val fields = getAllFields(obj, includeNulls = false)
        val className = obj.javaClass.simpleName

        if (!includeValues) {
            val fieldTypes = fields.entries.joinToString(", ") { (name, value) ->
                val type = when {
                    value == null -> "null"
                    value.javaClass.isArray -> "Array[${java.lang.reflect.Array.getLength(value)}]"
                    else -> value.javaClass.simpleName
                }
                "$name:$type"
            }
            return "$className(${fields.size} fields: $fieldTypes)"
        } else {
            val fieldDetails = fields.entries.take(10).joinToString(", ") { (name, value) ->
                val valueStr = when {
                    value == null -> "null"
                    value.javaClass.isArray -> "Array[${java.lang.reflect.Array.getLength(value)}]"
                    value is String -> "\"$value\""
                    else -> value.toString()
                }
                "$name=$valueStr"
            }
            val more = if (fields.size > 10) " +${fields.size - 10} more" else ""
            return "$className($fieldDetails$more)"
        }
    }
}
