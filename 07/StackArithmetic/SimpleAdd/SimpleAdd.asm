// push constant 7
@7
D=A
@SP
A=M
M=D
@SP
M=M+1
// push constant 8
@8
D=A
@SP
A=M
M=D
@SP
M=M+1
// add
@SP
A=M-1
D-M
@SP
M=M-1
@5
M=D
@SP
A=M-1
D=M
@SP
M=M-1
@5
D=D+M
@SP
A=M
M=D
@SP
M=M+1
(END)
@END
0;JMP