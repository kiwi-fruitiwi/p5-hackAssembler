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

let leftDiv, middleDiv, rightDiv

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

    // displayAsm(select('#left'), file)
    // assembleL(select('#left'), loadStrings('asm/RectL.asm'))
    assemble(select('#left'), file)
}


/**
 * outputs the contents of file to element
 * @param output the element we want to output to
 * @param file
 */
function displayAsm(output, file) {
    let innerHTML = ''

    for (let n in file) {
        innerHTML +=`${n}:\t${file[n]}\n`

    }

    output.html(`<pre>${innerHTML}</pre>`)
}


/**
 *  translates .asm into machine code including symbols
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
function assemble(output, file) {
    /* temporary storage for each line of translated machine code */
    let lineOutput = ''

    /* create array of asm instructions to use in the second pass
     *  this array removes whitespace, comments, and adds labels
     *  TODO: do we need to keep track of line numbers?
     *   I don't think so...
     */
    let firstPassResults = []
    let symbolTable = {
        "R0":       0,
        "R1":       1,
        "R2":       2,
        "R3":       3,
        "R4":       4,
        "R5":       5,
        "R6":       6,
        "R7":       7,
        "R8":       8,
        "R9":       9,
        "R10":      10,
        "R11":      11,
        "R12":      12,
        "R13":      13,
        "R14":      14,
        "R15":      15,
        "SCREEN":   16384,
        "KBD":      24576,
        "SP":       0,
        "LCL":      1,
        "ARG":      2,
        "THIS":     3,
        "THAT":     4,
    }

    // console.log(symbolTable)

    /* machine code indices in the ROM start at 0 */
    let lineNumber = 0

    /** FIRST pass: build symbol table
     *      iterate through every line in the asm file
     *      if comment or whitespace: skip
     *      add label symbols to symbolTable, minding lineNumbers
     *      fill firstPassResults, a string array used in the second pass
     */
    for (let line of file) {
        /* ignore whitespace */
        if (line === "")
            continue

        /* ignore full-line comments that begin with '//' */
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

        /** look for label symbols: add them to symbolTable with a value of
         *  the line number of the next instruction. since these lines are
         *  not actual instructions, they are left out of firstPassResults
         */
        if (line.charAt(0) === '(') {
            /* assume syntax is clean; last char should be ')'
             * remove parens to extract label
             */
            let label = line.substring(1, line.length-1)

            symbolTable[label] = lineNumber
            console.log(`added (${label}) to sT with value ${lineNumber}`)
            lineOutput += `\t${line} \n`
        } else {
            lineOutput += `${lineNumber}:\t${line} \n`
            lineNumber += 1
            firstPassResults.push(line)
        }
    }


    /* put our binary code in a <pre> block and set the html of our div */
    output.html('<pre>' + lineOutput + '</pre>')


    /**
     * second pass: professor Schocken's pseudocode, "the assembly process"
     *  set n to 16
     *  scan entire program again, meaning we scan firstPassResults
     *  if instruction is @symbol, look up symbol in the symbol table
     *      if (symbol, value) is found, use value to complete translation
     *      if not found:
     *          add (symbol, n) to symbolTable
     *          use n to complete the instruction's translation
     *          n++
     *  if instruction is a c-instruction, translate normally
     *      encapsulate c-instruction translation into a function?
     *  output translated instruction
     */

    /* string storing translated machine code that we add to our output file */
    let machineCode

    /* reset lineOutput for the second pass */
    lineOutput = ''

    for (let line of firstPassResults) {
        /* since our predefined symbols go from 0 to 15, 16 is the first
         spot in RAM we can use for variables */
        let n = 16
        /* matches variable names that start with a character, may contain
         underscores and numbers. equivalent of const v = /^[a-z0-9_]+$/i */
        const variable = new RegExp('^[a-z][a-z0-9_]+$', 'i')

        /* matches decimal expressions after '@' */
        const decimal = new RegExp('^[0-9]+$')

        /* a-instruction, which always starts with '@' */
        if (line.charAt(0) === '@') {
            /* what follows the '@', or ampersand? */
            let afterAmp = line.substring(1)

            /* what follows is a number: output an a-instruction translating
             this number to binary */
            if (decimal.test(afterAmp)) {
                // console.log(`${afterAmp} → dTB: ${decToBin(afterAmp)}`)
                machineCode = `0${decToBin(afterAmp)}`
                lineOutput += `${machineCode}\n`

            } else if (variable.test(afterAmp)) {
                /**
                 * what follows is a variable: check our symbolTable for the
                 * value of the symbol. add the symbol to the table if it's
                 * not already there. translate
                 */

                let symbol = afterAmp
                console.log(`identifying ${symbol}`)
                /* if the symbol doesn't already exist in our symbolTable,
                 create it */
                if (!(symbol in symbolTable)) {
                    console.log(`adding ${symbol} to the symbolTable`)
                    symbolTable[afterAmp] = n

                    /* set our translation to machineCode variable */
                    machineCode = `0${decToBin(n)}`
                    lineOutput += `${machineCode}\n`

                    n++
                } else {
                    /* use the value of the symbol for our translation; this
                     value will be a binary number */
                    let symbolValue = symbolTable[symbol]
                    // console.log(`translation: 0${decToBin(symbolValue)}`)
                    // console.log(`translation: ${symbol} → 0${symbolValue}`)
                    machineCode = `0${decToBin(symbolValue)}`
                    lineOutput += `${machineCode}\n`
                }

                // console.log(`${afterAmp} → process me!`)
            }

            // console.log(`${afterAmp} → testing:${variable.test(afterAmp)}`)

            /* what follows is a variable name → look up in table or add
             * note that as long as line.charAt(1) is alphanumeric, it
             * qualifies as a variable name */
        } else {
            /** this is a c-instruction */
            console.log(`${line} → ${translateC(line)}`)
            machineCode = `${translateC(line)}\n`
            lineOutput += machineCode
        }
    }

    /* true as a second argument to html() appends */
    let machineCodeOutput = select('#middle')
    machineCodeOutput.html('<pre>' + lineOutput + '</pre>')
    console.log(symbolTable)
}


/**
 * Populates a div, output, with machine code translation of 'file'. The
 * file must be symbol-less.
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
            machineCode = translateC(line)

            /* add machine code translation to our output 'file' */
            binaryCode += machineCode + '\n'
        }
    }

    /* put our binary code in a <pre> block and set the html of our div */
    output.html('<pre>' + binaryCode + '</pre>')
}


/**
 * translates a c-instruction in the form of dest=comp;jump into binary
 * @param line the line of assembly we want to translate
 *
 * in machine language, c-instructions are in the format 111 acccccc ddd jjj
 * identify if we have all three parts: dest=comp;jump
 */
function translateC(line) {
    let equalsIndex // location of '=' in a c-instruction, if available
    let semicolonIndex // location of ';' in a c-instruction, if available

    let dest // token for the 'dest' part of dest=comp;jump
    let comp, compStartIndex
    let jump

    /* machine code translations for dest, comp, jump. Bin=binary */
    let destBin, compBin, jumpBin
    let machineCode

    /** this is a c-instruction! */
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

    return machineCode
}


function draw() {
    background(234, 34, 24)
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