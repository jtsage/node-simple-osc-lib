/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Simple OSC Communication Library */


/**
 * Simple OSC communication for nodeJS
 */
/* eslint @stylistic/brace-style: "error" */
export type OSCArgTypes = boolean | string | number | bigint | Buffer | Array<number|OSCArg|boolean> | null
export type OSCArg = {type : string, value : OSCArgTypes }

/**
 * OSC Message Interface
 * 
 * @param address - OSC address
 * @param args - Array of OSC arguments
 * @param type - text representation of the type, i.e. 'osc-message' or 'osc-bundle'
 * 
 */
export interface OSCMessageInterface {
	address        : string
	args           : OSCArg[]
	type         ? : string
}

/**
 * OSC Message Interface
 * 
 * @param address - OSC address
 * @param args - Array of OSC arguments
 * @param type - text representation of the type, 'osc-message'
 * 
 */
export class OSCMessage implements OSCMessageInterface {
	address : string
	args    : OSCArg[] = []
	type  ? : string

	constructor( address : string, args : OSCArg[] = [], type : string = 'osc-message' ) {
		this.address = address
		this.type = type
		this.args = args
	}
}

/**
 * OSC Bundle Interface
 * 
 * @param timetag - TimeTag Date
 * @param elements - Array of OSC elements
 * @param type - text representation of the type, 'osc-bundle'
 * 
 */
export class OSCBundle {
	elements : Array<OSCMessage | OSCBundle | Buffer> = []
	timetag  : Buffer | Date                 = Buffer.alloc( 8 )
	type     : string                        = 'osc-bundle'

	constructor( elements ? : Array<OSCMessage | OSCBundle | Buffer>, timeBuffer ? : Buffer ) {
		if ( Array.isArray( elements ) ) {
			this.elements = elements
		}
		if ( typeof timeBuffer !== 'undefined' ) {
			this.timetag = timeBuffer
		}
		return this
	}
}

type BufferArgList = {
	types   : string[];
	buffers : Array<Buffer>;
}

/**
 * OSC Buffer Decode Interface
 * 
 * @param buffer_remain - Remaining chunk of packet data (may be empty)
 * @param value - Value of item
 * @param type - text representation of the type, 'string'
 * 
 */
type BufferDecodePart = {
	buffer_remain : Buffer<ArrayBufferLike>;
	type          : string;
	value         : OSCArgTypes;
}

interface Operation {
	name : string;
	toBuffer( value : OSCArgTypes ) : Buffer;
	toArray( buffer_in : Buffer ) : BufferDecodePart;
}
const uNULL       = '\u0000'

export { uNULL as null }

export class OSCSyntaxError extends Error {
	constructor( message : string, opts ? : ErrorOptions ) {
		super( message, opts )
	}
}

type OSCPreprocessor = ( x : OSCMessage ) => OSCMessage
type redirectCallback = (
	newAddressBuffer : Buffer,
	oldAddressBuffer : Buffer,
	argumentList : Array<string>,
	argumentBuffer : Buffer
) => Buffer


/**
 * Options for oscLIb
 * 
 * @param asciiOnly - Prevent non-ASCII characters in strings
 * @param blockCharacter - Character to delineate 4-byte blocks in debug output (or '')
 * @param coerceStrings - For string type, coerce input if non-string found.
 * @param debugCharacter - Character to replace nulls in debug output
 * @param preprocessor -   osc-message processor
 * @param strictAddress -  Use strict addresses (strict mode plus require leading slash)
 * @param strictMode -     Use strict mode elsewhere
 * 
 * @public
 */
export interface OscLibOptions {
	asciiOnly      : boolean;
	blockCharacter : string;
	coerceStrings  : boolean;
	debugCharacter : string;
	preprocessor   : OSCPreprocessor;
	strictAddress  : boolean;
	strictMode     : boolean;
}


// export interface simpleOscLibInterface {
// 	options : OscLibOptions
// 	uNull : string

// 	encodeBufferChunk( type : string, value : OSCArgTypes ) : Buffer
// 	decodeBufferChunk( type : string, buffer_in : Buffer ) : BufferDecodePart
// 	getTimeTagArrayFromUnknownType( value : OSCArgTypes | Date ) : number[]
// 	getTimeTagArrayFromSeconds( seconds : number ) : number[]
// 	getDateFromTimeTagArray( timetag : OSCArgTypes ) : Date
// 	getTypeStringFromChar( type : string ) : string
// 	getTypeCharFromStringOrChar( type : string ) : string
// 	getTimeTagBufferFromTimestamp( number : number ) : Buffer
// 	getTimeTagBufferFromDate( date : Date ) : Buffer
// 	getTimeTagBufferFromDelta(seconds : number, now ?: number) : Buffer
// 	printableBuffer( buffer_in : Buffer, replacementCharacter ?: string | null, fourByteMarkerCharacter ?: string | null, skipSize ?: boolean ) : string
// 	buildMessage(inputObject : OSCMessage | OSCBundle | null) : Buffer
// 	buildBundle( oscBundleObject : OSCBundle ) : Buffer
// 	readPacket( buffer_in : Buffer ) : OSCMessage | OSCBundle
// 	readBundle( buffer_in : Buffer ) : OSCBundle
// 	readMessage ( buffer_in : Buffer ) : OSCMessage
// 	redirectMessage ( buffer_in : Buffer, newAddress : string, callBack : redirectCallback ) : Buffer
// 	messageBuilder(address : string) : oscBuilder
// }

/**
 * simpleOscLib Processor
 */
export class simpleOscLib {
	#defaultOptions : OscLibOptions = {
		asciiOnly      : false,
		blockCharacter : '\xA6',
		coerceStrings  : false,
		debugCharacter : '\u2022',
		preprocessor   : ( x : OSCMessage ) => x,
		strictAddress  : false,
		strictMode     : false,
	}
	options : OscLibOptions
	#stringTypeToCharMap : Record<string, string> = {}
	#TWO_POW_32                                   = 4294967296
	#typeExistAll                                 = new Set<string>()
	#typeExistChar                                = new Set<string>()
	#typeExistString                              = new Set<string>()
	#UNIX_EPOCH                                   = 2208988800
	uNull                                         = uNULL

	#encInteger( value : number ) {
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeInt32BE( value )
		return buffer_out
	}

	#operations : Record<string, Operation> = {
		A : {
			name : 'address',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				const addressArray = this.#operations.s!.toArray( buffer_in )
				const stringAddress = addressArray.value

				if ( typeof stringAddress !== 'string' || stringAddress.length === 0 ) {
					throw new OSCSyntaxError( 'address cannot be empty' )
				}
				if ( this.options.strictAddress && !stringAddress.startsWith( '/' ) ) {
					throw new OSCSyntaxError( 'address must start with a slash' )
				}
				addressArray.type = 'address'
				return addressArray
			},
			toBuffer : ( value : string ) => {
				if ( typeof value !== 'string' || value.length === 0 ) {
					throw new OSCSyntaxError( 'address must be a string, and cannot be empty' )
				}
				if ( this.options.strictAddress && !value.startsWith( '/' ) ) {
					throw new OSCSyntaxError( 'address must start with a slash' )
				}
				if ( ! this.#isAddress( value ) ) {
					throw new OSCSyntaxError( 'invalid characters in address' )
				}
				return this.#operations.s!.toBuffer( value )
			},
		},
		b : {
			name : 'blob',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				if ( buffer_in.length < 8 ) {
					throw new RangeError( 'buffer too small for blob type' )
				}
				const dataLength = buffer_in.readUInt32BE()
				if ( buffer_in.length < dataLength + 4 ) {
					throw new RangeError( 'buffer underrun error' )
				}
				const origBuffer = buffer_in.subarray( 4, 4 + dataLength )
				const chunkSize  = 4 + dataLength + ( 4 - ( dataLength % 4 ) )
				return this.#decodedBuffer( origBuffer, buffer_in.subarray( chunkSize ), 'blob' )
			},
			toBuffer : ( buffer_in : Buffer ) => {
				if ( ! Buffer.isBuffer( buffer_in ) ) {
					throw new TypeError( 'expected buffer' )
				}
				const inputSize    = buffer_in.length
				const totalSize    = 4 + inputSize + ( 4 - ( inputSize % 4 ) )
				
				const buffer_out = Buffer.alloc( totalSize )
				buffer_out.writeUInt32BE( inputSize )
				buffer_in.copy( buffer_out, 4 )

				return buffer_out
			},
		},
		c : {
			name    : 'char',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				if ( buffer_in.length < 4 ) {
					throw new RangeError( 'buffer too small for char type' )
				}
				const thisCharCode = buffer_in.readUInt32BE()
				if ( thisCharCode > 127 ) {
					throw new TypeError( 'expected single ASCII character' )
				}
				return this.#decodedBuffer( String.fromCharCode( thisCharCode ), buffer_in.subarray( 4 ), 'char' )

			},
			toBuffer : ( value : string ) => {
				if ( typeof value !== 'string' || value.length > 1 || ! this.#isASCII( value, true ) ) {
					throw new TypeError( 'expected single ASCII character' )
				}

				const buffer_out = Buffer.alloc( 4 )
				buffer_out.writeUInt32BE( value.charCodeAt( 0 ) )
				return buffer_out
			},
		},
		d : {
			name : 'double',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				if ( buffer_in.length < 8 ) {
					throw new RangeError( 'buffer too small for float type' )
				}
				const thisNumber = buffer_in.readDoubleBE()
				return this.#decodedBuffer( thisNumber, buffer_in.subarray( 8 ), 'double' )
			},
			toBuffer : ( value : number ) => {
				if ( typeof value !== 'number' ) {
					throw new TypeError( 'expected number' )
				}
				const buffer_out = Buffer.alloc( 8 )
				buffer_out.writeDoubleBE( value )
				return buffer_out
			},
		},
		f : {
			name : 'float',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				if ( buffer_in.length < 4 ) {
					throw new RangeError( 'buffer too small for float type' )
				}
				const thisNumber = buffer_in.readFloatBE()
				return this.#decodedBuffer( thisNumber, buffer_in.subarray( 4 ), 'float' )
			},
			toBuffer : ( value : number ) => {
				if ( typeof value !== 'number' ) {
					throw new TypeError( 'expected number' )
				}
				const buffer_out = Buffer.alloc( 4 )
				buffer_out.writeFloatBE( value )
				return buffer_out
			},
		},
		F : {
			name     : 'false',
			toArray  : ( buffer_in : Buffer ) : BufferDecodePart => this.#decodedBuffer( null, buffer_in, 'false' ),
			toBuffer : () => Buffer.alloc( 0 ),
		},
		h : {
			name : 'bigint',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				if ( buffer_in.length < 8 ) {
					throw new RangeError( 'buffer too small for bigint type' )
				}
				const thisNumber = BigInt( buffer_in.readBigInt64BE() )
				return this.#decodedBuffer( thisNumber, buffer_in.subarray( 8 ), 'bigint' )
			},
			toBuffer : ( value : bigint ) => {
				if ( typeof value !== 'bigint' ) {
					throw new TypeError( 'expected bigint' )
				}
				const buffer_out = Buffer.alloc( 8 )
				buffer_out.writeBigInt64BE( value )
				return buffer_out
			},
		},
		i : {
			name : 'integer',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				if ( buffer_in.length < 4 ) {
					throw new RangeError( 'buffer too small for integer type' )
				}
				const thisNumber = buffer_in.readInt32BE()
				return this.#decodedBuffer( thisNumber, buffer_in.subarray( 4 ), 'integer' )
			},
			toBuffer : ( value : number ) => {
				if ( typeof value !== 'number' || ! Number.isInteger( value ) ) {
					throw new TypeError( `expected integer : ${value}` )
				}
				const buffer_out = Buffer.alloc( 4 )
				buffer_out.writeInt32BE( value )
				return buffer_out
			},
		},
		I : {
			name     : 'bang',
			toArray  : ( buffer_in : Buffer ) : BufferDecodePart => this.#decodedBuffer( null, buffer_in, 'bang' ),
			toBuffer : () => Buffer.alloc( 0 ),
		},
		N : {
			name    : 'null',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => this.#decodedBuffer( null, buffer_in, 'null' ),
			toBuffer : () => Buffer.alloc( 0 ),
		},
		r : {
			name    : 'color',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				if ( buffer_in.length < 4 ) {
					throw new RangeError( 'buffer too small for color type' )
				}
				const colorArray = [
					buffer_in.readUInt8( 0 ),
					buffer_in.readUInt8( 1 ),
					buffer_in.readUInt8( 2 ),
					buffer_in.readUInt8( 3 )
				]

				return this.#decodedBuffer( colorArray, buffer_in.subarray( 4 ), 'color' )
			},
			toBuffer : ( value : [number, number, number, number] ) => {
				if ( !Array.isArray( value ) || value.length !== 4 ) {
					throw new TypeError( 'expected 4 element numeric array' )
				}

				const buffer_out = Buffer.alloc( 4 )

				for ( const [i, element] of value.entries() ) {
					if ( !Number.isInteger( element ) || element < 0 || element > 255 ) {
						throw new TypeError( 'expected 4 element numeric array' )
					}
					buffer_out.writeUInt8( element, i )
				}
				return buffer_out
			},
		},
		s : {
			name    : 'string',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				const rawString = buffer_in.toString( 'utf8' )
				const nullIndex = rawString.indexOf( '\u0000' )
			
				if ( nullIndex === -1 ) {
					if ( this.options.strictMode ) {
						throw new OSCSyntaxError( 'osc string buffers must contain a null character' )
					}
					return this.#decodedBuffer( rawString, Buffer.alloc( 0 ), 'string' )
				}

				const goodString = rawString.slice( 0, nullIndex )
				const splitPoint = this.#fourBytePad_lastPosition( goodString )

				if ( ! this.#isASCII( goodString ) ) {
					throw new OSCSyntaxError( 'strings must be ASCII only' )
				}

				if ( this.options.strictMode ) {
				
					for ( let i = Buffer.byteLength( goodString ); i < splitPoint; i++ ) {
						if ( buffer_in[i] !== 0 ) {
							throw new OSCSyntaxError( 'incorrect string padding' )
						}
					}
				}
			
				return this.#decodedBuffer( goodString, buffer_in.subarray( splitPoint ), 'string' )
			},
			toBuffer : ( value_in : string ) => {
				const value = this.options.coerceStrings === true ?
					value_in.toString() :
					value_in

				if ( typeof value !== 'string' ) {
					throw new TypeError( 'expected string' )
				}
				if ( ! this.#isASCII( value ) ) {
					throw new OSCSyntaxError( 'strings must be ASCII only' )
				}
				return Buffer.from( this.#fourBytePad_string( value ) )
			},
		},
		S : {
			name : 'STRING',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => this.#operations.s!.toArray( buffer_in ),
			toBuffer : ( value : string ) => this.#operations.s!.toBuffer( value ),
		},
		t : {
			name    : 'timetag',
			toArray : ( buffer_in : Buffer ) : BufferDecodePart => {
				if ( buffer_in.length < 8 ) {
					throw new RangeError( 'buffer too small for timetag type' )
				}
				const number1 = buffer_in.readUInt32BE()
				const number2 = buffer_in.readUInt32BE( 4 )
				return this.#decodedBuffer( [number1, number2], buffer_in.subarray( 8 ), 'timetag' )
			},
			toBuffer : ( value : OSCArgTypes ) => {
				const timeTagArray = this.getTimeTagArrayFromUnknownType( value )
				const buffer_out   = Buffer.alloc( 8 )

				buffer_out.writeUInt32BE( timeTagArray[0] ?? 0 )
				buffer_out.writeUInt32BE( timeTagArray[1] ?? 0, 4 )

				return buffer_out
			},
		},
		T : {
			name     : 'true',
			toArray  : ( buffer_in : Buffer ) : BufferDecodePart => this.#decodedBuffer( null, buffer_in, 'true' ),
			toBuffer : () => Buffer.alloc( 0 ),
		},
	}

	/**
	 * Create new simpleOscLib instance
	 * 
	 * @param options - simpleOscLib options.
	 */
	constructor( options ? : Partial<OscLibOptions> ) {
		this.options = { ...this.#defaultOptions, ...options }

		if ( typeof this.options.preprocessor !== 'function' ) {
			throw new TypeError( 'preprocessor function must be a function' )
		}

		this.#typeExistChar = new Set( Object.keys( this.#operations ) )
		for ( const thisChar of this.#typeExistChar ) {
			this.#stringTypeToCharMap[this.#operations[thisChar]!.name] = thisChar
		}
		this.#typeExistString = new Set( Object.keys( this.#stringTypeToCharMap ) )
		this.#typeExistAll    = new Set( [...this.#typeExistChar, ...this.#typeExistString] )
	}

	#isAddress( inputString : string ) {
		if ( ! ( /^[\w!"$%&'()+-./:;<=>@^`|~]*$/ ).test( inputString ) ) {
			return false
		}
		return true
	}

	#isASCII( inputString : string, limit : boolean = false ) {
		if ( limit !== true && ! this.options.asciiOnly ) {
			return true
		}
	
		// eslint-disable-next-line no-control-regex
		if ( ! ( /^[\x00-\x7F]*$/ ).test( inputString ) ) {
			return false
		}
		return true
	}

	#isBundle( buffer_in : Buffer ) {
		return buffer_in.subarray( 0, 7 ).toString( 'utf8' ) === '#bundle'
	}

	#fourBytePad_addLength( inputString : string ) {
		const buffLength = Buffer.byteLength( inputString )
		return 4 - ( buffLength % 4 )
	}

	#fourBytePad_lastPosition( inputString : string ) {
		return this.#fourBytePad_addLength( inputString ) + Buffer.byteLength( inputString )
	}

	#fourBytePad_string( inputString : string ) {
		let padString = inputString
		const padLength = this.#fourBytePad_addLength( inputString )
		for ( let i = 0; i < padLength; i++ ) {
			padString += uNULL
		}
		return padString
	}

	#decodedBuffer( value : OSCArgTypes, buffer_remain : Buffer, type : string ) {
		return {
			buffer_remain : buffer_remain,
			type          : type,
			value         : value,
		}
	}

	#argArrayToBuffer( args : OSCArg[], nested : boolean = false ) : BufferArgList {
		const thisArgTypeList   = []
		const thisArgBufferList : Buffer[] = []

		if ( nested ) {
			thisArgTypeList.push( '[' )
		}
		
		for ( const thisArg of args ) {
			if ( Array.isArray( thisArg ) ) {
				// do nest
				const nestedSet = this.#argArrayToBuffer( thisArg, true )
				thisArgTypeList.push( ...nestedSet.types )
				thisArgBufferList.push( ...nestedSet.buffers )
				continue
			}
			if ( typeof thisArg !== 'object' || typeof thisArg.type === 'undefined' || typeof thisArg.value === 'undefined' ) {
				throw new OSCSyntaxError( 'invalid argument object' )
			}
	
			const thisArgType = this.getTypeCharFromStringOrChar( thisArg.type )
			thisArgTypeList.push( thisArgType )
			const thisBuffer  = this.encodeBufferChunk( thisArgType, thisArg.value )
			if ( typeof thisBuffer !== 'undefined' ) {
				thisArgBufferList.push( thisBuffer )
			}
		}
	
		if ( nested ) {
			thisArgTypeList.push( ']' )
		}
	
		return {
			types   : thisArgTypeList,
			buffers : thisArgBufferList,
		}
	}



	/**
	 * Encode an OSC Data chunk - low level function
	 * @param type - OSC Data type string/char
	 * @param value - Value for data (assumed null for null types)
	 * @returns buffer padded to 32-bit blocks with NULLs
	 */
	encodeBufferChunk( type : string, value : OSCArgTypes = null ) : Buffer {
		const thisType = this.getTypeCharFromStringOrChar( type )
		return this.#operations[thisType]!.toBuffer( value )
	}

	/**
	 * Decode an OSC Data chunk - low level function
	 * @param type - OSC Data type
	 * @param buffer_in - buffer padded to 32-bit blocks with NULLs
	 * @returns Contains the type, value, and unused portion of the buffer
	 */
	decodeBufferChunk( type : string, buffer_in : Buffer ) {
		if ( ! Buffer.isBuffer( buffer_in ) ) {
			throw new TypeError( 'buffer expected' )
		}
		if ( this.options.strictMode && buffer_in.length % 4 !== 0 ) {
			throw new RangeError( 'buffer is not a 4-byte multiple' )
		}
		const thisType = this.getTypeCharFromStringOrChar( type )
		return this.#operations[thisType]!.toArray( buffer_in )
	}


	getTimeTagArrayFromUnknownType( value : OSCArgTypes | Date ) : number[] {
		if ( Array.isArray( value ) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number' ) {
			// already prepared
			return value as number[]
		} else if ( typeof value === 'number' ) {
			// is a timestamp
			return this.getTimeTagArrayFromSeconds( value )
		} else if ( value instanceof Date ) {
			// is a date object
			return this.getTimeTagArrayFromSeconds( value.getTime() / 1000 )
		}
		throw new TypeError( 'invalid timetag type' )
	}

	getTimeTagArrayFromSeconds( seconds : number ) {
		const unixSeconds = Math.floor( seconds )
		const fracSeconds = seconds - unixSeconds
	
		return [
			unixSeconds + this.#UNIX_EPOCH,
			Math.round( this.#TWO_POW_32 * fracSeconds )
		]
	}

	/**
	 * Get a date object from a timetag array
	 * @param timetag - 2 element array for a timetag [unix seconds, fractional seconds]
	 * @returns Date object
	 */
	getDateFromTimeTagArray( timetag : OSCArgTypes ) {
		if ( !Array.isArray( timetag ) || timetag.length !== 2 || typeof timetag[0] !== 'number' || typeof timetag[1] !== 'number' ) {
			throw new RangeError( 'timetag array format incorrect' )
		}
		const seconds    = timetag[0] - this.#UNIX_EPOCH
		const fractional = parseFloat( timetag[1].toString() ) / this.#TWO_POW_32
		const returnDate = new Date()
	
		returnDate.setTime( ( seconds * 1000 ) + ( fractional * 1000 ) )
	
		return returnDate
	}


	/**
	 * Resolve a character type into the human readable name
	 * @param type - type single character type
	 * @returns multi-character name
	 */
	getTypeStringFromChar( type : string ) : string {
		return this.#typeExistChar.has( type ) ? this.#operations[type]!.name : 'unknown'
	}

	/**
	 * Resolve a type from a character or string with error checking
	 * @param type - character type string or single character
	 * @returns single character
	 */
	getTypeCharFromStringOrChar( type : string ) : string {
		if ( typeof type !== 'string' || type === '' ) {
			throw new TypeError( 'string or char expected' )
		}
		if ( !this.#typeExistAll.has( type ) ) {
			throw new RangeError( 'type does not exist' )
		}
		if ( type.length === 1 ) {
			return type
		}
		return this.#stringTypeToCharMap[type] ?? 'error'
	}

	/**
	 * Generate a timetag buffer from a timestamp
	 * @param number - timestamp (from epoch)
	 * @returns 8 byte / 32 bit buffer
	 */
	getTimeTagBufferFromTimestamp( number : number ) {
		return this.encodeBufferChunk( 't', this.getTimeTagArrayFromSeconds( number ) )
	}

	/**
	 * Generate a timetag buffer from a date instance
	 * @param date - javascript date instance
	 * @returns 8 byte / 32 bit buffer
	 */
	getTimeTagBufferFromDate( date : Date ) {
		return this.encodeBufferChunk( 't', this.getTimeTagArrayFromUnknownType( date ) )
	}

	/**
	 * Generate a timetag buffer for [seconds] in the future
	 * @param seconds - seconds in the future
	 * @param now - point to calculate from (in ms!!)
	 * @returns 8 byte / 32 bit buffer
	 */
	getTimeTagBufferFromDelta( seconds : number, now : number | null = null ) {
		const n = ( now !== null ? now : ( new Date() ).getTime() ) / 1000
		return this.encodeBufferChunk( 't', this.getTimeTagArrayFromSeconds( n + seconds ) )
	}

	/**
	 * Format a buffer for console.log()
	 * @param buffer_in - buffer
	 * @param rep_char - Character to replace nulls in buffer
	 * @param blockChar - Character to delineate 4-byte blocks in buffer (or '')
	 * @returns printable string
	 */
	printableBuffer( buffer_in : Buffer, replacementCharacter : string | null = null, fourByteMarkerCharacter : string | null = null, skipSize : boolean = false ) {
		if ( ! Buffer.isBuffer( buffer_in ) ) {
			throw new TypeError( 'buffer expected' )
		}
		const doSize    = skipSize !== true
		const rep_char  = replacementCharacter === null ? this.options.debugCharacter : replacementCharacter
		const blockChar = fourByteMarkerCharacter === null ? this.options.blockCharacter : fourByteMarkerCharacter

		let consumeBuffer = buffer_in
		const printBuffer = []

		if ( doSize ) {
			printBuffer.push( `${`[${buffer_in.length}]`.padEnd( 6, ' ' )}:: ${blockChar}` )
		} else {
			printBuffer.push( blockChar )
		}
	
		while ( consumeBuffer.length !== 0 ) {
			const thisChunk = consumeBuffer.subarray( 0, 4 )
			const thisChunkUTF = thisChunk.toString( 'utf8' )
			// eslint-disable-next-line no-control-regex
			if ( /[\x01-\x09\x0B-\x1F\x7F-\x9F]/.test( thisChunkUTF ) ) {
				printBuffer.push( '[..]' )
			} else {
				
				printBuffer.push( thisChunk
					.toString( 'utf8' )
					// eslint-disable-next-line no-control-regex
					.replaceAll( /[^\u0000\x20-\x7E]/g, '¿' )
					.replaceAll( '\u0000', rep_char )
				)
			}
			consumeBuffer = consumeBuffer.subarray( 4 )
			printBuffer.push( blockChar )
		}
		return printBuffer.join( '' )
	}

	/**
	 * Build an OSC message buffer
	 * 
	 * `address` is a required key, containing the destination address
	 * 
	 * `args` is an array of objects of \{ type : 'type', value : value \}
	 * 
	 * @param inputObject - osc message object
	 * @returns 4 byte chunked buffer
	 */
	buildMessage( inputObject : OSCMessage | OSCBundle | null ) {
		if ( inputObject === null ) {
			throw new OSCSyntaxError( 'improper OSC message object' )
		}
		if ( inputObject instanceof OSCBundle ) {
			return this.buildBundle( inputObject )
		}
		if ( typeof inputObject.address === 'undefined' ) {
			throw new OSCSyntaxError( 'improper OSC message object' )
		}

		const buffer_address = this.encodeBufferChunk( 'A', inputObject.address )

		if ( typeof inputObject.args === 'undefined' ) {
			// No arguments, work finished
			return buffer_address
		}

		if ( !Array.isArray( inputObject.args ) ) {
			throw new OSCSyntaxError( 'argument list must be an array of argument objects' )
		}
	
		const allArgs = this.#argArrayToBuffer( inputObject.args )
		const typesBuffer = this.encodeBufferChunk( 's', `,${allArgs.types.join( '' )}` )

		return Buffer.concat( [buffer_address, typesBuffer, Buffer.concat( allArgs.buffers )] )
	}

	/**
	 * Build an OSC bundle buffer
	 * 
	 * `timetag` is a required key, containing a timetag buffer
	 * 
	 * `elements` can contain objects to be passed to oscBuildMessage or 
	 * pre-prepared buffers padded to 32-bit blocks with NULLs
	 * 
	 * @param oscBundleObject - osc bundle object
	 * @returns 4 byte chunked buffer
	 */
	buildBundle( oscBundleObject : OSCBundle  ) {
		if ( typeof oscBundleObject !== 'object' ) {
			throw new TypeError( 'improper OSC bundle object' )
		}
		if ( ! Buffer.isBuffer( oscBundleObject.timetag ) ) {
			throw new TypeError( 'expected timetag buffer (use generateTimeTagFrom*)' )
		}
		if ( ! Array.isArray( oscBundleObject.elements ) || oscBundleObject.elements.length === 0 ) {
			throw new RangeError( 'unable to send empty bundles' )
		}
		const bundleTag = Buffer.alloc( 8 )
		bundleTag.write( '#bundle' )

		const sendBuffer : Buffer[]= [
			bundleTag,
			oscBundleObject.timetag,
		]

		for ( const thisElement of oscBundleObject.elements ) {
			if ( Buffer.isBuffer( thisElement ) ) {
				sendBuffer.push( this.#encInteger( thisElement.length ), thisElement )
			} else {
				const newBuffer = this.buildMessage( thisElement )
				sendBuffer.push( this.#encInteger( newBuffer.length ), newBuffer )
			}
		}

		return Buffer.concat( sendBuffer )
	}

	/**
	 * Decode an OSC packet.  Useful for when the client might send bundles or messages
	 * @param buffer_in - buffer padded to 32-bit blocks with NULLs
	 * @returns osc-bundle object or osc-message object
	 */
	readPacket( buffer_in : Buffer ) : OSCMessage | OSCBundle {
		if ( ! Buffer.isBuffer( buffer_in ) ) {
			throw new TypeError( 'buffer expected' )
		}

		if ( buffer_in.length === 0 ) {
			throw new TypeError( 'non-empty buffer expected' )
		}

		if ( this.options.strictMode && buffer_in.length % 4 !== 0 ) {
			throw new OSCSyntaxError( 'buffer is not a 4-byte multiple' )
		}

		if ( this.#isBundle( buffer_in ) ) {
			return this.readBundle( buffer_in )
		}
		return this.readMessage( buffer_in )
	}

	/**
	 * Decode an OSC bundle
	 * @param buffer_in - buffer padded to 32-bit blocks with NULLs
	 * @returns osc-bundle object
	 */
	readBundle( buffer_in : Buffer ) {
		if ( ! Buffer.isBuffer( buffer_in ) ) {
			throw new TypeError( 'buffer expected' )
		}

		if ( ! this.#isBundle( buffer_in ) ) {
			throw new TypeError( 'osc-bundles must begin with #bundle' )
		}

		const bundleObject = new OSCBundle()

		const timeTag = this.decodeBufferChunk( 't', buffer_in.subarray( 8 ) )

		bundleObject.timetag = this.getDateFromTimeTagArray( timeTag.value )

		let buffer_remain = timeTag.buffer_remain

		while ( buffer_remain.length !== 0 ) {
			const nextMessageSize : BufferDecodePart = this.decodeBufferChunk( 'i', buffer_remain )
			const nextMessage : Buffer = nextMessageSize.buffer_remain.subarray( 0, nextMessageSize.value as number )

			bundleObject.elements.push( this.readPacket( nextMessage ) )

			buffer_remain = buffer_remain.subarray( nextMessageSize.value as number + 4 )
		}

		return bundleObject
	}

	/**
	 * Decode a single OSC message.
	 * @param buffer_in - buffer padded to 32-bit blocks with NULLs
	 * @returns osc-message object
	 */
	readMessage( buffer_in : Buffer ) : OSCMessage {
		if ( ! Buffer.isBuffer( buffer_in ) ) {
			throw new TypeError( 'buffer expected' )
		}

		if ( this.options.strictMode === true && buffer_in.length % 4 !== 0 ) {
			throw new OSCSyntaxError( 'buffer is not a 4-byte multiple' )
		}

		const oscMessage : OSCMessage = { type : 'osc-message', address : '/error', args : [] }

		const thisAddress_array = this.decodeBufferChunk( 'A', buffer_in )

		oscMessage.address = thisAddress_array.value as string

		if ( thisAddress_array.buffer_remain.length === 0 ) {
			return this.options.preprocessor( oscMessage )
		}

		const thisArgList_array = this.decodeBufferChunk( 's', thisAddress_array.buffer_remain )

		const argListString = thisArgList_array.value as string

		const arrayOpenMarks  = argListString.split( '[' ).length - 1
		const arrayCloseMarks = argListString.split( ']' ).length - 1

		if ( arrayCloseMarks !== arrayOpenMarks ) {
			throw new OSCSyntaxError( 'mismatched array nesting' )
		}

		let buffer_remain = thisArgList_array.buffer_remain

		const arrayStack = [oscMessage.args]

		for ( const [i, thisItem] of [...argListString].entries() ) {
			// const thisItem = argListArray[i]
			if ( i === 0 ) {
				if ( thisItem === ',' ) {
					continue
				}
				if ( this.options.strictMode ) {
					throw new OSCSyntaxError( 'argument list requires leading comma' )
				}
			}
			
			if ( thisItem === '[' ) {
				arrayStack.push( [] )
				continue
			}
			if ( thisItem === ']' ) {
				const built = arrayStack.pop()

				const stackItem = arrayStack[arrayStack.length - 1]

				stackItem!.push( {
					type  : 'array',
					value : built as OSCArgTypes,
				} )
				continue
			}

			const thisArg_array = this.decodeBufferChunk( thisItem as string, buffer_remain )
			const stackItem     = arrayStack[arrayStack.length - 1]

			stackItem!.push( {
				type  : this.getTypeStringFromChar( thisItem as string ),
				value : thisArg_array.value,
			} )

			buffer_remain = thisArg_array.buffer_remain
		}
		return this.options.preprocessor( oscMessage )
	}

	/**
	 * Readdress an existing message, including the old address as the first or last string argument
	 * 
	 * Callback details
	 * 
	 * The callback takes a function that receives the following parameters
	 * + newAddressBuffer <Buffer> new destination
	 * + oldAddressBuffer <Buffer> original address as a string buffer
	 * + argumentList <Array> original argument list
	 * + argumentBuffer <Buffer> existing argument buffer.
	 * 
	 * This should return a valid osc buffer.  To simply redirect the existing to a new address you could do something like
	 * ```javascript
	 * function redirectCallback(newAddressBuffer, _oldAddressBuffer, argumentList, argumentBuffer) {
	 *     return Buffer.concat([
	 *         newAddressBuffer,
	 *         oscLibInstance.encodeToBuffer('s', `,${argumentList.join('')}`),
	 *         argumentBuffer
	 *     ])
	 * }
	 * ```
	 * @param buffer_in - original message buffer
	 * @param newAddress - address for the new message
	 * @param callBack - callback to apply - must return a buffer
	 * @returns Buffer
	 */
	redirectMessage( buffer_in : Buffer, newAddress : string, callBack ? : redirectCallback ) : Buffer {
		if ( ! Buffer.isBuffer( buffer_in ) ) {
			throw new TypeError( 'buffer expected' )
		}

		if ( this.options.strictMode && buffer_in.length % 4 !== 0 ) {
			throw new OSCSyntaxError( 'buffer is not a 4-byte multiple' )
		}

		const newAddressBuffer = this.encodeBufferChunk( 'A', newAddress )

		const originalOSC : Record<string, string | string[] | null | Buffer> = {
			address : null,
			argArray : null,
			argBuffer : null,
		}

		const thisAddress_array = this.decodeBufferChunk( 'A', buffer_in )

		originalOSC.address = thisAddress_array.value as string

		if ( thisAddress_array.buffer_remain.length === 0 ) {
			// no arguments, add old address and dump
			return Buffer.concat( [
				newAddressBuffer,
				this.encodeBufferChunk( 's', ',s' ),
				this.encodeBufferChunk( 's', originalOSC.address )
			] )
		}

		const thisArgList_array = this.decodeBufferChunk( 's', thisAddress_array.buffer_remain )

		originalOSC.argArray  = [...thisArgList_array.value as string]
		originalOSC.argBuffer = thisArgList_array.buffer_remain

		let newArgArray : string[]
		
		if ( originalOSC.argArray[0] !== ',' ) {
			if ( this.options.strictMode ) {
				throw new OSCSyntaxError( 'argument list requires leading comma' )
			}
			newArgArray = [...originalOSC.argArray]
		} else {
			newArgArray = originalOSC.argArray.slice( 1 )
		}

		if ( typeof callBack === 'function' ) {
			return callBack(
				newAddressBuffer,
				this.encodeBufferChunk( 's', originalOSC.address ),
				newArgArray,
				originalOSC.argBuffer
			)
		}

		newArgArray.unshift( 's' )

		return Buffer.concat( [
			newAddressBuffer,
			this.encodeBufferChunk( 's', `,${newArgArray.join( '' )}` ),
			this.encodeBufferChunk( 's', originalOSC.address ),
			originalOSC.argBuffer
		] )
	}

	/**
	 * Build an osc message in a chainable way.
	 * 
	 * Chainable methods available - for more complex messages, use buildMessage
	 * 
	 * ```javascript
	 * myMessage
	 *     .i(20)
	 *     .integer(20)
	 *     .f(1.0)
	 *     .float(1.0)
	 *     .s('hello')
	 *     .string('world')
	 *     .b(buffer)
	 *     .blob(buffer)
	 * ```
	 * 
	 * To get a transmittable buffer, call `myMessage.toBuffer()`
	 * 
	 * To get a human readable version of the buffer, call `myMessage.toString()`
	 * @param address - address to send to
	 * @returns oscBuilder instance
	 * @example
	 * const myBuffer = oscLib.messageBuilder('/hello').integer(10).float(2.0).string('world').toBuffer()
	 */
	messageBuilder( address : string ) {
		return new oscBuilder( this, address )
	}
}

class oscBuilder {
	#oscLib : simpleOscLib
	#address : string
	#argStack : OSCArg[] = []

	constructor( oscLib : simpleOscLib, address : string ) {
		if ( typeof address !== 'string' || address.length === 0 ) {
			throw new TypeError( 'address required' )
		}

		this.#oscLib  = oscLib
		this.#address = address
	}

	toString() {
		return this.#oscLib.printableBuffer( this.toBuffer() )
	}

	toBuffer() {
		const message = new OSCMessage( this.#address, this.#argStack )
		return this.#oscLib.buildMessage( message )
	}

	i( value : number ) {
		return this.integer( value )
	}

	integer( value : number ) {
		if ( typeof value !== 'number' || ! Number.isInteger( value ) ) {
			throw new TypeError( 'integer required' )
		}
		this.#argStack.push( {
			type  : 'integer',
			value : value,
		} )
		return this
	}

	f( value : number ) {
		return this.float( value )
	}

	float( value : number ) {
		if ( typeof value !== 'number' ) {
			throw new TypeError( 'float required' )
		}
		this.#argStack.push( {
			type  : 'float',
			value : value,
		} )
		return this
	}

	s( value : string ) {
		return this.string( value )
	}

	string( value : string ) {
		if ( typeof value !== 'string' ) {
			throw new TypeError( 'string required' )
		}
		this.#argStack.push( {
			type  : 'string',
			value : value,
		} )
		return this
	}

	b( value : Buffer ) {
		return this.blob( value )
	}

	blob( value : Buffer ) {
		if ( ! Buffer.isBuffer( value ) ) {
			throw new TypeError( 'buffer required' )
		}
		this.#argStack.push( {
			type  : 'blob',
			value : value,
		} )
		return this
	}
}
