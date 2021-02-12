#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

f10::
click, 550, 433
sleep, 300
click, 460, 381
sleep, 300
Send {Alt down}{tab}{Alt up}
sleep, 300
send, ^{Tab}
return

f11::
click, 1124, 60
sleep, 500
Click, 125 77 Right
sleep, 500
; MouseMove, 156, 156
; sleep, 500
Click, 156 156
return

^k::
MouseGetPos, xpos, ypos 
MsgBox, The cursor is at X%xpos% Y%ypos%.
return