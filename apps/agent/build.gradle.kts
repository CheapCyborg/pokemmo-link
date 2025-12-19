plugins {
    kotlin("jvm") version "1.8.0"
}

group = "com.pokemmo.snooper"
version = "1.0"

repositories {
    mavenCentral()
}

dependencies {
    // Kotlin Standard Library
    implementation(kotlin("stdlib"))

    // ByteBuddy (For hooking/injection)
    implementation("net.bytebuddy:byte-buddy:1.14.4")
    implementation("net.bytebuddy:byte-buddy-agent:1.14.4")

    // Link to the game file you extracted (Must be in 'libs' folder)
    implementation(files("libs/PokeMMO.jar"))

    // Gson (Required for writing JSON files)
    implementation("com.google.code.gson:gson:2.10.1")

    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    // CHANGE: Updated from 8 to 17 because the game client is now Java 17 (Class v61)
    jvmToolchain(17)
}

// Task to run the Snooper
// Update gradle.properties to set your PokeMMO installation path
val runSnooper = tasks.register<JavaExec>("runSnooper") {
    mainClass.set("SnooperKt")
    classpath = sourceSets["main"].runtimeClasspath
    // Read from gradle.properties or environment variable
    val pokemmoPath = project.findProperty("pokemmo.path") as String?
        ?: System.getenv("POKEMMO_PATH")
        ?: "C:\\Program Files\\PokeMMO"
    workingDir = file(pokemmoPath)
}
