// push constant 17
@17
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 17
@17
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// eq
@SP
                            A=M-1
                            D=M
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
                            D=D-M
                            @SP
                            A=M
                            M=0
                            @END1
                            D;JNE
                            @SP
                            A=M
                            M=-1
                            (END1)
                            @SP
                            M=M+1
// push constant 17
@17
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 16
@16
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// eq
@SP
                            A=M-1
                            D=M
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
                            D=D-M
                            @SP
                            A=M
                            M=0
                            @END2
                            D;JNE
                            @SP
                            A=M
                            M=-1
                            (END2)
                            @SP
                            M=M+1
// push constant 16
@16
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 17
@17
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// eq
@SP
                            A=M-1
                            D=M
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
                            D=D-M
                            @SP
                            A=M
                            M=0
                            @END3
                            D;JNE
                            @SP
                            A=M
                            M=-1
                            (END3)
                            @SP
                            M=M+1
// push constant 892
@892
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 891
@891
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// lt
@SP
                             A = M-1
                             D=M
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
                             D=D-M
                             @SP
                             A=M
                             M=0
                             @END4
                             D;JGE
                             @SP
                             A=M
                             M=-1
                             (END4)
                             @SP
                             M=M+1
// push constant 891
@891
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 892
@892
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// lt
@SP
                             A = M-1
                             D=M
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
                             D=D-M
                             @SP
                             A=M
                             M=0
                             @END5
                             D;JGE
                             @SP
                             A=M
                             M=-1
                             (END5)
                             @SP
                             M=M+1
// push constant 891
@891
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 891
@891
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// lt
@SP
                             A = M-1
                             D=M
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
                             D=D-M
                             @SP
                             A=M
                             M=0
                             @END6
                             D;JGE
                             @SP
                             A=M
                             M=-1
                             (END6)
                             @SP
                             M=M+1
// push constant 32767
@32767
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 32766
@32766
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// gt
@SP
                             A= M-1
                             D=M
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
                             D=D-M
                             @SP
                             A=M
                             M=0
                             @END7
                             D;JLE
                             @SP
                             A=M
                             M=-1
                             (END7)
                             @SP
                             M=M+1
// push constant 32766
@32766
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 32767
@32767
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// gt
@SP
                             A= M-1
                             D=M
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
                             D=D-M
                             @SP
                             A=M
                             M=0
                             @END8
                             D;JLE
                             @SP
                             A=M
                             M=-1
                             (END8)
                             @SP
                             M=M+1
// push constant 32766
@32766
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 32766
@32766
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// gt
@SP
                             A= M-1
                             D=M
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
                             D=D-M
                             @SP
                             A=M
                             M=0
                             @END9
                             D;JLE
                             @SP
                             A=M
                             M=-1
                             (END9)
                             @SP
                             M=M+1
// push constant 57
@57
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 31
@31
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// push constant 53
@53
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// add
@SP
                            A=M-1
                            D=M
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
// push constant 112
@112
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// sub
@SP
                            A=M-1
                            D=M
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
                            D=D-M
                            @SP
                            A=M
                            M=D
                            @SP
                            M=M+1
// neg
@SP
                            A=M-1
                            M=-M
// and
@SP
                            A=M-1
                            D=M
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
                            D=D&M
                            @SP
                            A=M
                            M=D
                            @SP
                            M=M+1
// push constant 82
@82
                                D=A
                                @SP
                                A=M
                                M=D
                                @SP
                                M=M+1
// or
@SP
                            A=M-1
                            D=M
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
                            D=D|M
                            @SP
                            A=M
                            M=D
                            @SP
                            M=M+1
// not
@SP
                            A=M-1
                            M=!M
(END10)
                                @END10
                                0;JMP
