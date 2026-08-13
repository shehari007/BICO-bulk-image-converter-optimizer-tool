; Installer customisation for the Windows build.
;
; Windows identifies an installed program by a guid that electron-builder
; derives from the application id, and BICO has now used two of them:
;
;   0e5e6f40-7150-56ba-80f2-e37662c739b3   the 2.x releases, and this build
;   90dc1e7b-d9f0-552f-8ad9-5e9d4a2d239b   the first 3.0.0 build, before this fix
;
; Pinning the guid in electron-builder.yml is what lets the ordinary upgrade
; path find a 2.x installation and remove it. That leaves the middle entry: a
; machine that took the first 3.0.0 build has it registered under an id nothing
; refers to any more, so without the work below it would sit in Apps and
; Features forever with no owner and no way to remove it.

!include FileFunc.nsh

!define STRANDED_GUID "90dc1e7b-d9f0-552f-8ad9-5e9d4a2d239b"
!define STRANDED_UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${STRANDED_GUID}"
!define STRANDED_INSTALL_KEY "Software\${STRANDED_GUID}"
!define LEGACY_DIRECTORY_NAME "BICO-Bulk Image Converter Tool"

; Finds where the first 3.0.0 build put itself, if it is still there.
; $R5 carries the answer and is only filled once, so the per user installation
; wins over a per machine one, matching how the rest of the installer resolves
; the same conflict.
!macro findStrandedInstallation ROOT
  ${If} $R5 == ""
    ClearErrors
    ReadRegStr $R2 ${ROOT} "${STRANDED_INSTALL_KEY}" "InstallLocation"

    ${IfNot} ${Errors}
    ${AndIf} $R2 != ""
    ${AndIf} ${FileExists} "$R2\*.*"
      StrCpy $R5 $R2
    ${EndIf}

    ClearErrors
  ${EndIf}
!macroend

!macro customInit
  StrCpy $R5 ""
  !insertmacro findStrandedInstallation HKEY_CURRENT_USER
  !insertmacro findStrandedInstallation HKEY_LOCAL_MACHINE

  ${If} $R5 != ""
    ; Install straight over the first 3.0.0 build, wherever the person running
    ; this put it. Writing over it is the only approach that works for both
    ; ways of arriving here: someone running the installer by hand, and the in
    ; app updater, which downloads this same file and expects it to replace the
    ; running application in place rather than leave a second copy behind. It
    ; also means an install directory chosen back then is respected now.
    StrCpy $INSTDIR $R5
  ${Else}
    ; No first build to replace, so the location came from the registry entry
    ; shared with the 2.x releases and still points at the folder named after
    ; the old product. Left alone, version 3 would install into a directory
    ; called BICO-Bulk Image Converter Tool.
    ;
    ; Only the last part of the path is replaced, so a user who put the old
    ; version on another drive or in Program Files keeps that choice and gets
    ; the current name inside it. A first time install has no registry entry to
    ; read and never reaches either branch.
    ${GetParent} "$INSTDIR" $R0
    ${GetFileName} "$INSTDIR" $R1

    ${If} $R0 != ""
    ${AndIf} $R1 == "${LEGACY_DIRECTORY_NAME}"
      StrCpy $INSTDIR "$R0\${APP_FILENAME}"
    ${EndIf}
  ${EndIf}
!macroend

!macro customInstall
  ; Drop the registration left by the first 3.0.0 build, whose files have just
  ; been written over. By this point this installation has recorded itself under
  ; the pinned guid, so removing the old entry is what turns two BICO rows in
  ; Apps and Features back into one.
  DeleteRegKey HKEY_CURRENT_USER "${STRANDED_UNINSTALL_KEY}"
  DeleteRegKey HKEY_CURRENT_USER "${STRANDED_INSTALL_KEY}"
  DeleteRegKey HKEY_LOCAL_MACHINE "${STRANDED_UNINSTALL_KEY}"
  DeleteRegKey HKEY_LOCAL_MACHINE "${STRANDED_INSTALL_KEY}"
!macroend
