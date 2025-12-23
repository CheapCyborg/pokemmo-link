plugins {
    kotlin("jvm") version "1.9.22"  // Updated to stable recent version
    application  // Adds application plugin for better JavaExec support
}

group = "com.pokemmo.snooper"
version = "1.0"

repositories {
    mavenCentral()
}

dependencies {
    // Kotlin Standard Library (explicit JDK8 variant for better Java interop)
    implementation(kotlin("stdlib"))
    implementation(kotlin("stdlib-jdk8"))
    implementation("org.jetbrains.kotlin:kotlin-reflect:1.9.22")  // For reflection used in snooper

    // ByteBuddy (For hooking/injection)
    implementation("net.bytebuddy:byte-buddy:1.14.4")
    implementation("net.bytebuddy:byte-buddy-agent:1.14.4")

    // Link to the game file you extracted (Must be in 'libs' folder)
    implementation(files("libs/PokeMMO.jar"))

    // Gson (Required for writing JSON files)
    implementation("com.google.code.gson:gson:2.10.1")

    // HTTP Client for API calls
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    jvmToolchain(17)
}

// Configure Kotlin compilation
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs = listOf(
            "-Xjvm-default=all",  // Enable default methods in interfaces
            "-Xopt-in=kotlin.RequiresOptIn"  // Opt-in to experimental APIs if needed
        )
    }
}

// Task to run the Snooper
val runSnooper = tasks.register<JavaExec>("runSnooper") {
    mainClass.set("SnooperKt")
    classpath = sourceSets["main"].runtimeClasspath

    // Read from gradle.properties or environment variable
    val pokemmoPath = project.findProperty("pokemmo.path") as String?
        ?: System.getenv("POKEMMO_PATH")
        ?: "C:\\Program Files\\PokeMMO"
    workingDir = file(pokemmoPath)

    // Pass project directory as system property so output files go to project
    systemProperty("project.dir", project.projectDir.absolutePath)

    // Add JVM arguments to fix module access issues
    jvmArgs(
        "--add-opens", "java.base/java.lang=ALL-UNNAMED",
        "--add-opens", "java.base/java.util=ALL-UNNAMED",
        "--add-opens", "java.base/java.lang.reflect=ALL-UNNAMED",
        "--add-opens", "java.base/sun.nio.ch=ALL-UNNAMED",
        "--add-opens", "java.base/java.io=ALL-UNNAMED"
    )

    // Enable assertions for debugging
    enableAssertions = true

    // Increase heap size if needed for packet processing
    maxHeapSize = "2G"
}

// Clean task to remove generated files
tasks.register<Delete>("cleanOutputs") {
    delete(fileTree("${project.projectDir.parent}/web/data") {
        include("dump-*.json")
    })
    delete("${project.projectDir}/dump-debug-fields.txt")
}

// Add to default clean
tasks.clean {
    dependsOn("cleanOutputs")
}
