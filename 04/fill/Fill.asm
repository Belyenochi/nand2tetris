// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

// Put your code here.

(LISTEN)
  @SCREEN
  D=A
  @addr        // Get the first address of the screen
  M=D

  @8192        // Get Total length of the screen
  D = A
  @n
  M=D

  @i          // 16 pixels at a time
  M=0

  @signal     // Rendering keyboard event switches
  M=0

  @24576      // Get keyboard input
  D=M

  @LOOP       // keyboard input exist condition
  D;JEQ

  @signal     // if keyboard input exist, Set the switch to true, -1 to render 16 pixels
  M=-1

(LOOP)
  @i
  D=M

  @n
  D=D-M

  @END
  D;JGE       // if i >= n goto END

  @signal
  D=M

  @addr
  A=M
  M=D        // RAM[addr] = 1111111111111111

  @i
  M=M+1      // i = i + 1

  @1
  D=A

  @addr
  M=D+M      // addr = addr + 1

  @LOOP
  0;JMP      // goto LOOP
(END)

@LISTEN    // program's end
0;JMP      // infinite loop
