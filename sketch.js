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
let file
let parser
let output // a div containing our output


function preload() {
    font = loadFont('data/meiryo.ttf')
    file = loadStrings('asm/Max.asm')
    parser = new Parser()
}


function setup() {
    createCanvas(640*2, 360*2)
    noCanvas()
    colorMode(HSB, 360, 100, 100, 100)

    output = createDiv()

    generateSymbolTable(output, file)
    // assembleL(output, file)
}


/**
 *  helper function for assemble, which translates .asm into machine code
 *  including symbols
 *
 *  create symbol table dictionary
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
 *              if (value), use line number returned → a-instruction
 */
function generateSymbolTable(output, file) {
    /* temporary storage for each line of translated machine code */
    let lineOutput = ''
    let symbolTable = {
        "R0":       decToBin(0),
        "R1":       decToBin(1),
        "R2":       decToBin(2),
        "R3":       decToBin(3),
        "R4":       decToBin(4),
        "R5":       decToBin(5),
        "R6":       decToBin(6),
        "R7":       decToBin(7),
        "R8":       decToBin(8),
        "R9":       decToBin(9),
        "R10":      decToBin(10),
        "R11":      decToBin(11),
        "R12":      decToBin(12),
        "R13":      decToBin(13),
        "R14":      decToBin(14),
        "R15":      decToBin(15),
        "SCREEN":   decToBin(16384),
        "KBD":      decToBin(24576),
        "SP":       decToBin(0),
        "LCL":      decToBin(1),
        "ARG":      decToBin(2),
        "THIS":     decToBin(3),
        "THAT":     decToBin(4),
    }

    // console.log(symbolTable)

    /** iterate through every line in the asm file
     *      if comment or whitespace: skip
     *      otherwise determine if a-instruction or c-instruction
     */
    for (let line of file) {
        if (line === "")
            continue

        if (line.charAt(0) === '/' && line.charAt(1) === '/')
            continue

        /* remove mid-line comments after cleaning start-line comments
         *  search for indexOf '/', then check if next one is also '/'
         */
        let firstSlash = line.indexOf('/')
        if (line.charAt(firstSlash+1) === '/')
            /* throw out the rest of the line */
            line = line.substring(0, firstSlash)

        /* strip out leading and trailing whitespace */
        line = line.trim()




        lineOutput += line + '\n'
    }

    /* put our binary code in a <pre> block and set the html of our div */
    output.html('<pre>' + lineOutput + '</pre>')
}


/**
 * Populates a div, output, with machine code translation of 'file'
 * @returns {*}
 */
function assembleL(output, file) {
    /* debug output for decimal to binary conversion */
    for (let i = 0; i <= 17; i++) {
        // console.log(decToBinConcat(i))
    }

    let binaryCode = ''
    let decimal // the number part of an a-instruction
    let machineCode // machine code translation of an assembly instruction
    let equalsIndex // location of '=' in a c-instruction, if available
    let semicolonIndex // location of ';' in a c-instruction, if available

    let dest // token for the 'dest' part of dest=comp;jump
    let comp, compStartIndex, compEndIndex
    let jump

    /* machine code translations for dest, comp, jump. Bin=binary */
    let destBin, compBin, jumpBin


    /** iterate through every line in the asm file
     *      if comment or whitespace: skip
     *      otherwise determine if a-instruction or c-instruction
     */
    for (let line of file) {
        if (line === "")
            continue

        if (line.charAt(0) === '/' && line.charAt(1) === '/')
            continue

        /* a-instructions always start with the '@' symbol followed by an int */
        compEndIndex = line.length
        if (line.charAt(0) === '@') {
            /** this is an a-instruction */
            /* substring(1) gives remainder of the a-instruction, an int */
            decimal = line.substring(1)
            // console.log(`${line} → a,${decimal} → ${decToBin(decimal)}`)

            machineCode = '0'
            machineCode += decToBin(decimal)
            console.log(`${line} → a,${decimal} → ${machineCode}`)

            /* add machine code translation to our output 'file' */
            binaryCode += machineCode + '\n'
        } else {
            /** this is a c-instruction! */
            /* c-instructions are in the format 111 acccccc ddd jjj */
            /* identify if we have all three parts: dest=comp;jump */
            /* recall that substring's end in [start, end) is exclusive */
            equalsIndex = line.indexOf('=')
            semicolonIndex = line.indexOf(';')

            /* if a '=' is not present, there is no destination */
            if (equalsIndex === -1) {
                dest = 'null'
                compStartIndex = 0
            } else {
                compStartIndex = equalsIndex + 1
                dest = line.substring(0, equalsIndex)
            }

            /* if a semicolon is not present, there is no jump */
            if (semicolonIndex === -1) {
                jump = 'null'
                /* no jump means comp is the rest of the line */
                comp = line.substring(compStartIndex)
            } else {
                jump = line.substring(semicolonIndex+1)
                comp = line.substring(compStartIndex, semicolonIndex)
            }

            compBin = parser.compDict[comp]
            destBin = parser.destDict[dest]
            jumpBin = parser.jumpDict[jump]
            machineCode = `111${compBin}${destBin}${jumpBin}`

            console.log(`${line} → c: \n`+
                `  comp=${comp}, ${compBin}\n` +
                `  dest=${dest}, ${destBin}\n` +
                `  jump=${jump}, ${jumpBin}\n` +
                `${machineCode}`)

            /* add machine code translation to our output 'file' */
            binaryCode += machineCode + '\n'
        }
    }

    /* put our binary code in a <pre> block and set the html of our div */
    output.html('<pre>' + binaryCode + '</pre>')
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
function decToBin(num) {
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