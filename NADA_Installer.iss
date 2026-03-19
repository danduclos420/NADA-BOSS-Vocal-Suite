; NADA BOSS Vocal Suite Installer Script
; Created by Antigravity AI

[Setup]
AppName=NADA BOSS Vocal Suite
AppVersion=1.0
DefaultDirName={commoncf}\VST3\NADA BOSS Vocal Suite
DefaultGroupName=NADA BOSS Vocal Suite
OutputDir=.\InstallerBuild
OutputBaseFilename=NADA_BOSS_Vocal_Suite_Installer
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64

[Files]
; Note: This path matches the CMake + MSVC build output on GitHub Actions
Source: "build\NADA_BOSS_VOCAL_SUITE_artefacts\Release\VST3\NADA BOSS Vocal Suite.vst3\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\NADA BOSS Vocal Suite"; Filename: "{app}"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;
