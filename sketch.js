/**
 * @author kiwi
 * @date 2022.02.23
 *  four modules
 *      main: initializes files, main logic loop
 *          reads files, but only test on small strings at first
 *          unit tests? make sure manually transcribed instructions match
 *      test: junit-style test cases, asserting each instruction equal to binary
 *          example instructions
 *      parser: unpacks each instruction → @n or dest=comp;jump
 *          a-instruction
 *              ins[0] === '@' → rest of string is decimal → convert to int
 *          c-instruction
 *              indexOf(';') indicates existence of jump section
 *              indexOf('=') returns -1 if no dest
 *      encode: translates each field into its corresponding binary value
 *          a-instruction
 *              use decimal to binary conversion
 *          c-instruction
 *              dictionary of dest, comp, jmp *
 *      symbolTable: expandable dictionary during 2nd pass
 *  staged development
 *      basic assembler: no symbols yet
 *      symbols with symbolTable
 *      morph?
 *      test programs; L has no symbols; 'less' symbols
 *          add, max, maxL, rect, rectL, Pong, PongL
 *          add → white space, instructions
 *
 *  coding plan
 *  ☐   decimal to binary conversion, starting from 2^15
 *
 */


let font


function preload() {
    font = loadFont('data/meiryo.ttf')
}


function setup() {
    createCanvas(640, 360)
    colorMode(HSB, 360, 100, 100, 100)

    for (let i = 0; i <= 17; i++) {
        console.log(decToBin(i))
    }
}


function draw() {
    background(234, 34, 24)
}


/**
 * Converts the decimal number n to a binary string using a character array
 * @param n
 */
function decToBinCharArr(n) {

}


/**
 * Converts the decimal number n to a binary string using string concatenation
 * @param n
 */
function decToBinConcat(num) {
    let current = num
    let result = ''
    let n = 14

    /* use concat to append bits to growing binary number */
    while (n >= 0) {
        if (current - 2**n >= 0) {
            result = result.concat('1')
            current -= 2**n
        } else result = result.concat('0')

        n -= 1
    }

    return result
}


/**
 *  old notes →
 *  construct empty symbol table. add predefined symbols
 *      1ˢᵗ pass: scan entire program
 *          for each instruction of form (name)
 *          add tuple(name, address) to table, where address is number of instruction following (name)
 *      2ⁿᵈ pass: scan entire program again
 *          set n to 16
 *          for each instruction:
 *              if instruction is @symbol, look it up in the symbol table
 *              if(symbol, value) is found, use value to complete translation
 *              else:
 *                  add(symbol, n) to symbol table
 *                  use n to complete the instruction's translation
 *                  n++
 *          if instruction is a c-instruction, complete its translation
 *          write translation to output file
 *
 *      create symbol table dictionary
 *      use dec → binary converter
 *      1st pass: read every line; lineCount=1
 *          if whitespace, skip
 *          else
 *              look for open paren, '('
 *                  if found, extract what's inside
 *                  add (name, address) to symbolTable. address is lineCount+1
 *              lineCount++
 *      2nd pass: read every line; lineCount=1 again
 *          n=16
 *          for each instruction
 *              if a-instruction (check if begins with @)
 *              if instruction is @symbol, look up key,value pair in sTable
 *              if value, use line number returned → a-instruction
 *              else
 *                  add (symbol, n) to sTable
 *                  use n to complete translation
 *                  n++
 *              if c-instruction, complete translation: use c-ins dictionary
 *                  simply match text strings; all expressions are covered
 *                      dest=comp;jump
 *                      jump can be null → 000
 *                      dest can be null → 000
 *
 *                  see Fill.asm for examples: D;JGE
 *                      111 ← all c-instructions begin with 111
 *                      0 001100 ← 'D' in c-ins table, 000 ← null dest, 011
 *                  ex: D=D+A
 *                      111
 *                      0 000010 ← D+A, with 'a' bit 0; 'a'=1 → D+M
 *                      010 ← dest is D
 *                      000 ← jmp is null
 *                  ex: M=M-1
 *                      111 ← again, all c-instructions begin with this
 *                      1 110010 ← M-1. if the 'a' bit were 0, we'd have A-1
 *                      001 ← dest is M
 *                      000 ← jmp is null
 *              output translation to file
 */