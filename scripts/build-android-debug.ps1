param(
    [string]$JavaHome,
    [string]$SdkRoot = 'D:\Android\Sdk'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$androidDir = Join-Path $projectRoot 'android'

if (-not (Test-Path $androidDir)) {
    throw "Android project not found at $androidDir. Run 'npm run android:add' first."
}

if (-not $JavaHome) {
    $defaultJavaHome = 'C:\Users\linch\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.6.7-hotspot'
    if (Test-Path $defaultJavaHome) {
        $JavaHome = $defaultJavaHome
    } elseif ($env:JAVA_HOME) {
        $JavaHome = $env:JAVA_HOME
    } else {
        throw 'JAVA_HOME not provided and no default JDK 21 path found.'
    }
}

if (-not (Test-Path $JavaHome)) {
    throw "Java home not found: $JavaHome"
}

if (-not (Test-Path $SdkRoot)) {
    throw "Android SDK not found: $SdkRoot"
}

$env:JAVA_HOME = $JavaHome
$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:Path = "$JavaHome\bin;$env:Path"

Push-Location $projectRoot
try {
    npm run cap:sync

    Push-Location $androidDir
    try {
        .\gradlew.bat assembleDebug
    }
    finally {
        Pop-Location
    }
}
finally {
    Pop-Location
}

$apkPath = Join-Path $androidDir 'app\build\outputs\apk\debug\app-debug.apk'
if (Test-Path $apkPath) {
    Write-Output "APK built: $apkPath"
} else {
    throw "Build finished but APK not found at: $apkPath"
}
