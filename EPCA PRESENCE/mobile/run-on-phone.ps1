$ErrorActionPreference = "Stop"
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$env:ANDROID_HOME = "C:\Users\LENOVO\sdk\android"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "C:\Users\LENOVO\sdk\flutter\bin;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

Set-Location $PSScriptRoot

Write-Host "Appareils ADB :"
adb devices
Write-Host ""
Write-Host "Si la liste est vide : branchez le telephone, acceptez le debogage USB, puis relancez ce script."
Write-Host ""

flutter devices
flutter run
