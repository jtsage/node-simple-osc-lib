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
 * @module simple-osc-lib
 */

const uNULL       = '\u0000'

class OSCSyntaxError extends Error {
	constructor(message, opts) {
		super(message, opts)
	}
}

class simpleOscLib {
	options         = null
	#defaultOptions = {
		asciiOnly      : false,    // Prevent non-ASCII characters in strings
		blockCharacter : '\xA6',   // Character to delineate 4-byte blocks in debug output (or '')
		coerceStrings  : false,    // For string type, coerce input if non-string found.
		debugCharacter : '\u2022', // Character to replace nulls in debug output
		preprocessor   : (x) => x, // osc-message processor
		strictAddress  : false,    // Use strict addresses (strict mode plus require leading slash)
		strictMode     : false,    // Use strict mode elsewhere
	}

	uNull       = uNULL
	#UNIX_EPOCH = 2208988800
	#TWO_POW_32 = 4294967296

	#stringTypeToCharMap = new Set()
	#typeExistAll        = new Set()
	#typeExistChar       = new Set()
	#typeExistString     = new Set()

	#operations = {
		A : {
			name : 'address',
			toArray : ( buffer_in ) => {
				const addressArray = this.#operations.s.toArray(buffer_in)
				const stringAddress = addressArray.value

				if ( typeof stringAddress !== 'string' || stringAddress.length === 0 ) {
					throw new OSCSyntaxError('address cannot be empty')
				}
				if ( this.options.strictAddress && !stringAddress.startsWith('/') ) {
					throw new OSCSyntaxError('address must start with a slash')
				}
				addressArray.type = 'address'
				return addressArray
			},
			toBuffer : ( address ) => {
				if ( typeof address !== 'string' || address.length === 0 ) {
					throw new OSCSyntaxError('address must be a string, and cannot be empty')
				}
				if ( this.options.strictAddress && !address.startsWith('/') ) {
					throw new OSCSyntaxError('address must start with a slash')
				}
				if ( ! this.#isAddress(address) ) {
					throw new OSCSyntaxError('invalid characters in address')
				}
				return this.#operations.s.toBuffer(address)
			},
		},
		b : {
			name : 'blob',
			toArray : ( buffer_in ) => {
				if ( buffer_in.length < 8 ) {
					throw new RangeError('buffer too small for blob type')
				}
				const dataLength = buffer_in.readUInt32BE()
				if ( buffer_in.length < dataLength + 4 ) {
					throw new RangeError('buffer underrun error')
				}
				const origBuffer = buffer_in.subarray(4, 4 + dataLength)
				const chunkSize  = 4 + dataLength + ( 4 - ( dataLength % 4 ) )
				return this.#decodedBuffer(origBuffer, buffer_in.subarray(chunkSize), 'blob')
			},
			toBuffer : (buffer_in) => {
				if ( ! Buffer.isBuffer(buffer_in) ) {
					throw new TypeError('expected buffer')
				}
				const inputSize    = buffer_in.length
				const totalSize    = 4 + inputSize + ( 4 - ( inputSize % 4 ) )
				
				const buffer_out = Buffer.alloc(totalSize)
				buffer_out.writeUInt32BE(inputSize)
				buffer_in.copy(buffer_out, 4)

				return buffer_out
			},
		},
		c : {
			name    : 'char',
			toArray : (buffer_in) => {
				if ( buffer_in.length < 4 ) {
					throw new RangeError('buffer too small for char type')
				}
				const thisCharCode = buffer_in.readUInt32BE()
				if ( thisCharCode > 127 ) {
					throw new TypeError('expected single ASCII character')
				}
				return this.#decodedBuffer(String.fromCharCode(thisCharCode), buffer_in.subarray(4), 'char')

			},
			toBuffer : (value) => {
				if (typeof value !== 'string' || value.length > 1 || ! this.#isASCII(value, true) ) {
					throw new TypeError('expected single ASCII character')
				}

				const buffer_out = Buffer.alloc(4)
				buffer_out.writeUInt32BE(value.charCodeAt(0))
				return buffer_out
			},
		},
		d : {
			name : 'double',
			toArray : ( buffer_in ) => {
				if ( buffer_in.length < 8 ) {
					throw new RangeError('buffer too small for float type')
				}
				const thisNumber = buffer_in.readDoubleBE()
				return this.#decodedBuffer(thisNumber, buffer_in.subarray(8), 'double')
			},
			toBuffer : (value) => {
				if (typeof value !== 'number' ) {
					throw new TypeError('expected number')
				}
				const buffer_out = Buffer.alloc(8)
				buffer_out.writeDoubleBE(value)
				return buffer_out
			},
		},
		f : {
			name : 'float',
			toArray : ( buffer_in ) => {
				if ( buffer_in.length < 4 ) {
					throw new RangeError('buffer too small for float type')
				}
				const thisNumber = buffer_in.readFloatBE()
				return this.#decodedBuffer(thisNumber, buffer_in.subarray(4), 'float')
			},
			toBuffer : ( value ) => {
				if (typeof value !== 'number' ) {
					throw new TypeError('expected number')
				}
				const buffer_out = Buffer.alloc(4)
				buffer_out.writeFloatBE(value)
				return buffer_out
			},
		},
		F : {
			name     : 'false',
			toArray  : ( buffer_in ) => this.#decodedBuffer(null, buffer_in, 'false'),
			toBuffer : () => Buffer.alloc(0),
		},
		h : {
			name : 'bigint',
			toArray : ( buffer_in ) => {
				if ( buffer_in.length < 8 ) {
					throw new RangeError('buffer too small for bigint type')
				}
				const thisNumber = BigInt(buffer_in.readBigInt64BE())
				return this.#decodedBuffer(thisNumber, buffer_in.subarray(8), 'bigint')
			},
			toBuffer : (value) => {
				if (typeof value !== 'bigint' ) {
					throw new TypeError('expected bigint')
				}
				const buffer_out = Buffer.alloc(8)
				buffer_out.writeBigInt64BE(value)
				return buffer_out
			},
		},
		i : {
			name : 'integer',
			toArray : ( buffer_in ) => {
				if ( buffer_in.length < 4 ) {
					throw new RangeError('buffer too small for integer type')
				}
				const thisNumber = buffer_in.readInt32BE()
				return this.#decodedBuffer(thisNumber, buffer_in.subarray(4), 'integer')
			},
			toBuffer : (value) => {
				if (typeof value !== 'number' || ! Number.isInteger(value) ) {
					throw new TypeError('expected integer')
				}
				const buffer_out = Buffer.alloc(4)
				buffer_out.writeInt32BE(value)
				return buffer_out
			},
		},
		I : {
			name     : 'bang',
			toArray  : ( buffer_in ) => this.#decodedBuffer(null, buffer_in, 'bang'),
			toBuffer : () => Buffer.alloc(0),
		},
		N : {
			name    : 'null',
			toArray : ( buffer_in ) => this.#decodedBuffer(null, buffer_in, 'null'),
			toBuffer : () => Buffer.alloc(0),
		},
		r : {
			name    : 'color',
			toArray : (buffer_in) => {
				if ( buffer_in.length < 4 ) {
					throw new RangeError('buffer too small for color type')
				}
				const colorArray = [
					buffer_in.readUInt8(0),
					buffer_in.readUInt8(1),
					buffer_in.readUInt8(2),
					buffer_in.readUInt8(3)
				]

				return this.#decodedBuffer(colorArray, buffer_in.subarray(4), 'color')
			},
			toBuffer : (value) => {
				if ( !Array.isArray(value) || value.length !== 4 ) {
					throw new TypeError('expected 4 element numeric array')
				}

				const buffer_out = Buffer.alloc(4)

				for ( const [i, element] of value.entries() ) {
					if ( !Number.isInteger(element) || element < 0 || element > 255 ) {
						throw new TypeError('expected 4 element numeric array')
					}
					buffer_out.writeUInt8(element, i)
				}
				return buffer_out
			},
		},
		s : {
			name    : 'string',
			toArray : ( buffer_in ) => {
				const rawString = buffer_in.toString('utf8')
				const nullIndex = rawString.indexOf('\u0000')
			
				if (nullIndex === -1) {
					if ( this.options.strictMode ) {
						throw new OSCSyntaxError('osc string buffers must contain a null character')
					}
					return this.#decodedBuffer(rawString, Buffer.alloc(0), 'string')
				}
			
				const goodString = rawString.slice(0, nullIndex)
				const splitPoint = this.#fourBytePad_lastPosition(goodString)
			
				
				if ( ! this.#isASCII(goodString) ) {
					throw new OSCSyntaxError('strings must be ASCII only')
				}

				if ( this.options.strictMode ) {
				
					for ( let i = Buffer.byteLength(goodString); i < splitPoint; i++ ) {
						if (buffer_in[i] !== 0) {
							throw new OSCSyntaxError('incorrect string padding')
						}
					}
				}
			
				return this.#decodedBuffer(goodString, buffer_in.subarray(splitPoint), 'string')
			},
			toBuffer : ( value_in ) => {
				const value = this.options.coerceStrings === true ?
					value_in.toString() :
					value_in

				if (typeof value !== 'string') {
					throw new TypeError('expected string')
				}
				if ( ! this.#isASCII(value) ) { throw new OSCSyntaxError('strings must be ASCII only') }
				return Buffer.from(this.#fourBytePad_string(value))
			},
		},
		S : {
			name : 'STRING',
			toArray : ( buffer_in ) => this.#operations.s.toArray( buffer_in ),
			toBuffer : ( value ) => this.#operations.s.toBuffer( value ),
		},
		t : {
			name    : 'timetag',
			toArray : ( buffer_in ) => {
				if ( buffer_in.length < 8 ) {
					throw new RangeError('buffer too small for timetag type')
				}
				const number1 = buffer_in.readUInt32BE()
				const number2 = buffer_in.readUInt32BE(4)
				return this.#decodedBuffer([number1, number2], buffer_in.subarray(8), 'timetag')
			},
			toBuffer : (value) => {
				const timeTagArray = this.getTimeTagArrayFromUnknownType(value)
				const buffer_out   = Buffer.alloc(8)

				buffer_out.writeUInt32BE(timeTagArray[0])
				buffer_out.writeUInt32BE(timeTagArray[1], 4)

				return buffer_out
			},
		},
		T : {
			name     : 'true',
			toArray  : ( buffer_in ) => this.#decodedBuffer(null, buffer_in, 'true'),
			toBuffer : () => Buffer.alloc(0),
		},
	}

	/**
	 * @param {object}  options                - simple-osc-lib options.
	 * @param {Boolean} options.asciiOnly      - Limit strings to ASCII characters.
	 * @param {String}  options.blockCharacter - Character to delineate 4-byte blocks in debug output (or '')
	 * @param {String}  options.debugCharacter - Character to replace NULLs in debug output.
	 * @param {String}  options.preprocessor   - osc-message processor
	 * @param {Boolean} options.strictAddress  - Use strict address mode (all string rules, must begin with slash).
	 * @param {Boolean} options.strictMode     - Use strict mode.
	 */
	constructor ( options ) {
		this.options = { ...this.#defaultOptions, ...options }

		if ( typeof this.options.preprocessor !== 'function' ) {
			throw new TypeError('preprocessor function must be a function')
		}

		this.#typeExistChar = new Set(Object.keys(this.#operations))
		for ( const thisChar of this.#typeExistChar ) {
			this.#stringTypeToCharMap[this.#operations[thisChar].name] = thisChar
		}
		this.#typeExistString = new Set(Object.keys(this.#stringTypeToCharMap))
		this.#typeExistAll    = new Set([...this.#typeExistChar, ...this.#typeExistString])
	}

	

	#isAddress( inputString ) {
		if ( ! (/^[\w!"$%&'()+-./:;<=>@^`|~]*$/).test(inputString) ) {
			return false
		}
		return true
	}

	#isASCII( inputString, limit = null ) {
		if ( limit !== true && ! this.options.asciiOnly ) { return true }
		// eslint-disable-next-line no-control-regex
		if ( ! (/^[\x00-\x7F]*$/).test(inputString) ) {
			return false
		}
		return true
	}

	#countOccurrences( haystack, needle ) {
		return haystack.split(needle).length - 1
	}

	#isBundle( buffer_in ) {
		return buffer_in.subarray(0, 7).toString('utf8') === '#bundle'
	}

	#fourBytePad_addLength( inputString ) {
		const buffLength = Buffer.byteLength(inputString)
		return 4 - ( buffLength % 4 )
	}

	#fourBytePad_lastPosition( inputString ) {
		return this.#fourBytePad_addLength(inputString) + Buffer.byteLength(inputString)
	}

	#fourBytePad_string( inputString ) {
		let padString = inputString
		const padLength = this.#fourBytePad_addLength(inputString)
		for ( let i = 0; i < padLength; i++ ) {
			padString += uNULL
		}
		return padString
	}

	#decodedBuffer( value, buffer_remain, type ) {
		return {
			buffer_remain : buffer_remain,
			type          : type,
			value         : value,
		}
	}

	#argArrayToBuffer( args, nested = false ) {
		const thisArgTypeList   = []
		const thisArgBufferList = []

		if ( nested ) { thisArgTypeList.push('[') }
		
		for ( const thisArg of args ) {
			if ( Array.isArray(thisArg) ) {
				// do nest
				const nestedSet = this.#argArrayToBuffer(thisArg, true)
				thisArgTypeList.push(...nestedSet.types)
				thisArgBufferList.push(...nestedSet.buffers)
				continue
			}
			if ( typeof thisArg !== 'object' || typeof thisArg.type === 'undefined' || typeof thisArg.value === 'undefined' ) {
				throw new OSCSyntaxError('invalid argument object')
			}
	
			const thisArgType = this.getTypeCharFromStringOrChar(thisArg.type)
			thisArgTypeList.push(thisArgType)
			thisArgBufferList.push(this.encodeBufferChunk(thisArgType, thisArg.value))
		}
	
		if ( nested ) { thisArgTypeList.push(']') }
	
		return {
			types : thisArgTypeList,
			buffers : thisArgBufferList,
		}
	}



	/**
	 * Encode an OSC Data chunk - low level function
	 * @param {String} type OSC Data type string/char
	 * @param {*} value Value for data (must be null for null types)
	 * @returns {Buffer} buffer padded to 32-bit blocks with NULLs
	 */
	encodeBufferChunk( type, value ) {
		const thisType = this.getTypeCharFromStringOrChar(type)
		return this.#operations[thisType].toBuffer(value)
	}

	/**
	 * Decode an OSC Data chunk - low level function
	 * @param {String} type OSC Data type
	 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
	 * @returns {Object} Contains the type, value, and unused portion of the buffer
	 */
	decodeBufferChunk( type, buffer_in ) {
		if ( ! Buffer.isBuffer(buffer_in) ) {
			throw new TypeError('buffer expected')
		}
		if ( this.options.strictMode && buffer_in.length % 4 !== 0 ) {
			throw new RangeError('buffer is not a 4-byte multiple')
		}
		const thisType = this.getTypeCharFromStringOrChar(type)
		return this.#operations[thisType].toArray(buffer_in)
	}


	getTimeTagArrayFromUnknownType( value ) {
		if ( Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
			// already prepared
			return value
		} else if ( typeof value === 'number') {
			// is a timestamp
			return this.getTimeTagArrayFromSeconds(value)
		} else if ( typeof value === 'object' && typeof value.getTime === 'function' ) {
			// is a date object
			return this.getTimeTagArrayFromSeconds(value.getTime() / 1000)
		}
		throw new TypeError('invalid timetag type')
	}

	getTimeTagArrayFromSeconds( seconds ) {
		const unixSeconds = Math.floor(seconds)
		const fracSeconds = seconds - unixSeconds
	
		return [
			unixSeconds + this.#UNIX_EPOCH,
			Math.round(this.#TWO_POW_32 * fracSeconds)
		]
	}
	/**
	 * Get a date object from a timetag array
	 * @param {Array} timetag 2 element array for a timetag [unix seconds, fractional seconds]
	 * @returns {Date}
	 */
	getDateFromTimeTagArray( timetag ) {
		if ( !Array.isArray(timetag) || timetag.length !== 2 || typeof timetag[0] !== 'number' || typeof timetag[1] !== 'number') {
			throw new RangeError('timetag array format incorrect')
		}
		const seconds    = timetag[0] - this.#UNIX_EPOCH
		const fractional = parseFloat(timetag[1]) / this.#TWO_POW_32
		const returnDate = new Date()
	
		returnDate.setTime((seconds * 1000) + (fractional * 1000))
	
		return returnDate
	}


	/**
	 * Resolve a character type into the human readable name
	 * @param {String} type single character type
	 * @returns {String}
	 */
	getTypeStringFromChar( type ) {
		return this.#typeExistChar.has(type) ? this.#operations[type].name : 'unknown'
	}

	/**
	 * Resolve a type from a character or string with error checking
	 * @param {String} type character type string or single character
	 * @returns {String}
	 */
	getTypeCharFromStringOrChar( type ) {
		if ( typeof type !== 'string' || type === '' ) {
			throw new TypeError('string or char expected')
		}
		if ( !this.#typeExistAll.has(type) ) {
			throw new RangeError('type does not exist')
		}
		if ( type.length === 1 ) {
			return type
		}
		return this.#stringTypeToCharMap[type]
	}

	/**
	 * Generate a timetag buffer from a timestamp
	 * @param {Number} number timestamp (from epoch)
	 * @returns {Buffer} 8 byte / 32 bit buffer
	 */
	getTimeTagBufferFromTimestamp( number ) {
		return this.encodeBufferChunk('t', this.getTimeTagArrayFromSeconds(number))
	}

	/**
	 * Generate a timetag buffer from a date instance
	 * @param {Date} date javascript date instance
	 * @returns {Buffer} 8 byte / 32 bit buffer
	 */
	getTimeTagBufferFromDate( date ) {
		return this.encodeBufferChunk('t', this.getTimeTagArrayFromUnknownType(date))
	}

	/**
	 * Generate a timetag buffer for [seconds] in the future
	 * @param {Number} seconds seconds in the future
	 * @param {Number|null} now point to calculate from (in ms!!)
	 * @returns {Buffer} 8 byte / 32 bit buffer
	 */
	getTimeTagBufferFromDelta(seconds, now = null) {
		const n = (now !== null ? now : new Date()) / 1000
		return this.encodeBufferChunk('t', this.getTimeTagArrayFromSeconds(n + seconds))
	}

	/**
	 * Format a buffer for console.log()
	 * @param {Buffer} buffer_in buffer
	 * @param {String} rep_char Character to replace nulls in buffer
	 * @param {String} blockChar Character to delineate 4-byte blocks in buffer (or '')
	 * @returns {String}
	 */
	printableBuffer( buffer_in, replacementCharacter = null, fourByteMarkerCharacter = null, skipSize = null ) {
		if ( ! Buffer.isBuffer(buffer_in) ) {
			throw new TypeError('buffer expected')
		}
		const doSize    = skipSize !== true
		const rep_char  = replacementCharacter === null ? this.options.debugCharacter : replacementCharacter
		const blockChar = fourByteMarkerCharacter === null ? this.options.blockCharacter : fourByteMarkerCharacter

		let consumeBuffer = buffer_in
		const printBuffer = []

		if ( doSize ) {
			printBuffer.push(`${`[${buffer_in.length}]`.padEnd(6, ' ')}:: ${blockChar}`)
		} else {
			printBuffer.push(blockChar)
		}
	
		while ( consumeBuffer.length !== 0 ) {
			const thisChunk = consumeBuffer.subarray(0, 4)
			const thisChunkUTF = thisChunk.toString('utf8')
			// eslint-disable-next-line no-control-regex
			if ( /[\x01-\x09\x0B-\x1F\x7F-\x9F]/.test(thisChunkUTF) ) {
				printBuffer.push('[..]')
			} else {
				// eslint-disable-next-line no-control-regex
				printBuffer.push(thisChunk.toString('utf8').replaceAll(/[^\u0000\x20-\x7E]/g, '¿').replaceAll('\u0000', rep_char))
			}
			consumeBuffer = consumeBuffer.subarray(4)
			printBuffer.push(blockChar)
		}
		return printBuffer.join('')
	}

	/**
	 * Build an OSC message buffer
	 * 
	 * `address` is a required key, containing the destination address
	 * 
	 * `args` is an array of objects of { type : 'type', value : value }
	 * 
	 * @param {object} oscMessageObject osc message object
	 * @returns {Buffer} 4 byte chunked buffer
	 */
	buildMessage(oscMessageObject) {
		if ( typeof oscMessageObject !== 'object' || typeof oscMessageObject.address === 'undefined' ) {
			throw new OSCSyntaxError('improper OSC message object')
		}
		const buffer_address = this.encodeBufferChunk('A', oscMessageObject.address)
	
		if ( typeof oscMessageObject.args === 'undefined' ) { return buffer_address }
		if ( !Array.isArray(oscMessageObject.args) ) {
			throw new OSCSyntaxError('argument list must be an array of argument objects')
		}
	
		const allArgs = this.#argArrayToBuffer(oscMessageObject.args)
		const typesBuffer = this.encodeBufferChunk('s', `,${allArgs.types.join('')}`)
		
		return Buffer.concat([buffer_address, typesBuffer, Buffer.concat(allArgs.buffers)])
	}

	/**
	 * Build an OSC bundle buffer
	 * 
	 * `timetag` is a required key, containing a timetag buffer
	 * 
	 * `elements` can contain objects to be passed to oscBuildMessage or 
	 * pre-prepared buffers padded to 32-bit blocks with NULLs
	 * 
	 * @param {object} oscBundleObject osc bundle object
	 * @returns {Buffer} 4 byte chunked buffer
	 */
	buildBundle( oscBundleObject ) {
		if ( typeof oscBundleObject !== 'object' ) {
			throw new TypeError('improper OSC bundle object')
		}
		if ( ! Buffer.isBuffer(oscBundleObject.timetag) ) {
			throw new TypeError('expected timetag buffer (use generateTimeTagFrom*)')
		}
		if ( ! Array.isArray(oscBundleObject.elements) || oscBundleObject.elements.length === 0 ) {
			throw new RangeError('unable to send empty bundles')
		}
		const sendBuffer = [
			this.encodeBufferChunk('s', '#bundle'),
			oscBundleObject.timetag,
		]

		for ( const thisElement of oscBundleObject.elements ) {
			if ( Buffer.isBuffer(thisElement) ) {
				sendBuffer.push(this.encodeBufferChunk('i', thisElement.length), thisElement)
			} else {
				const newBuffer = this.buildMessage(thisElement)
				sendBuffer.push(this.encodeBufferChunk('i', newBuffer.length), newBuffer)
			}
		}

		return Buffer.concat(sendBuffer)
	}

	/**
	 * Decode an OSC packet.  Useful for when the client might send bundles or messages
	 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
	 * @returns {Object} osc-bundle object or osc-message object
	 */
	readPacket( buffer_in ) {
		if ( ! Buffer.isBuffer(buffer_in) ) {
			throw new TypeError('buffer expected')
		}

		if ( buffer_in.length === 0 ) { return null }

		if ( this.options.strictMode && buffer_in.length % 4 !== 0 ) {
			throw new OSCSyntaxError('buffer is not a 4-byte multiple')
		}

		if ( this.#isBundle(buffer_in) ) {
			return this.readBundle(buffer_in)
		}
		return this.readMessage(buffer_in)
	}

	/**
	 * Decode an OSC bundle
	 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
	 * @returns {Object} osc-bundle object
	 */
	readBundle( buffer_in ) {
		if ( ! Buffer.isBuffer(buffer_in) ) {
			throw new TypeError('buffer expected')
		}

		if ( ! this.#isBundle(buffer_in) ) {
			throw new TypeError('osc-bundles must begin with #bundle')
		}

		const bundleObject = {
			type : 'osc-bundle',
			timetag : null,
			elements : [],
		}

		const timeTag = this.decodeBufferChunk('t', buffer_in.subarray(8))

		bundleObject.timetag = this.getDateFromTimeTagArray(timeTag.value)

		let buffer_remain = timeTag.buffer_remain

		while ( buffer_remain.length !== 0 ) {
			const nextMessageSize = this.decodeBufferChunk('i', buffer_remain)
			const nextMessage     = nextMessageSize.buffer_remain.subarray(0, nextMessageSize.value)

			bundleObject.elements.push(this.readPacket(nextMessage))

			buffer_remain = buffer_remain.subarray(nextMessageSize.value+4)
		}

		return bundleObject
	}

	/**
	 * Decode a single OSC message.
	 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
	 * @param {Object} options options
	 * @param {Object} options.strictMode use strict mode
	 * @param {Object} options.messageCallback callback to run on each message
	 * @returns {Object} osc-message object
	 */
	readMessage ( buffer_in ) {
		if ( ! Buffer.isBuffer(buffer_in) ) {
			throw new TypeError('buffer expected')
		}

		if ( this.options.strictMode && buffer_in.length % 4 !== 0 ) {
			throw new OSCSyntaxError('buffer is not a 4-byte multiple')
		}

		const oscMessage = { type : 'osc-message', address : null, args : [] }

		const thisAddress_array = this.decodeBufferChunk('A', buffer_in)

		oscMessage.address = thisAddress_array.value

		if ( thisAddress_array.buffer_remain.length === 0 ) {
			return this.options.preprocessor(oscMessage)
		}

		const thisArgList_array = this.decodeBufferChunk('s', thisAddress_array.buffer_remain)

		const arrayOpenMarks  = this.#countOccurrences(thisArgList_array.value, '[')
		const arrayCloseMarks = this.#countOccurrences(thisArgList_array.value, ']')

		if ( arrayCloseMarks !== arrayOpenMarks ) {
			throw new OSCSyntaxError('mismatched array nesting')
		}

		let buffer_remain = thisArgList_array.buffer_remain

		const arrayStack = [oscMessage.args]

		for ( let i = 0; i < thisArgList_array.value.length; i++ ) {
			const thisItem = thisArgList_array.value[i]
			if ( i === 0 ) {
				if ( thisItem === ',' ) { continue }
				if ( this.options.strictMode ) {
					throw new OSCSyntaxError('argument list requires leading comma')
				}
			}
			
			if ( thisItem === '[' ) {
				arrayStack.push([])
				continue
			}
			if ( thisItem === ']' ) {
				const built = arrayStack.pop()
				arrayStack[arrayStack.length - 1].push({
					type  : 'array',
					value : built,
				})
				continue
			}

			const thisArg_array = this.decodeBufferChunk(thisItem, buffer_remain)

			arrayStack[arrayStack.length - 1].push({
				type  : this.getTypeStringFromChar(thisItem),
				value : thisArg_array.value,
			})

			buffer_remain = thisArg_array.buffer_remain
		}
		return this.options.preprocessor(oscMessage)
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
	 * @param {Buffer} buffer_in original message buffer
	 * @param {String} newAddress address for the new message
	 * @param {Function} callBack callback to apply - must return a buffer
	 * @returns Buffer
	 */
	redirectMessage ( buffer_in, newAddress, callBack ) {
		if ( ! Buffer.isBuffer(buffer_in) ) {
			throw new TypeError('buffer expected')
		}

		if ( this.options.strictMode && buffer_in.length % 4 !== 0 ) {
			throw new OSCSyntaxError('buffer is not a 4-byte multiple')
		}

		const newAddressBuffer = this.encodeBufferChunk('A', newAddress)

		const originalOSC = { address : null, argArray : null, argBuffer : null }

		const thisAddress_array = this.decodeBufferChunk('A', buffer_in)

		originalOSC.address = thisAddress_array.value

		if ( thisAddress_array.buffer_remain.length === 0 ) {
			// no arguments, add old address and dump
			return Buffer.concat([
				newAddressBuffer,
				this.encodeBufferChunk('s', ',s'),
				this.encodeBufferChunk('s', originalOSC.address)
			])
		}

		const thisArgList_array = this.decodeBufferChunk('s', thisAddress_array.buffer_remain)

		originalOSC.argArray  = [...thisArgList_array.value]
		originalOSC.argBuffer = thisArgList_array.buffer_remain

		let newArgArray = []
		
		if ( originalOSC.argArray[0] !== ',' ) {
			if ( this.options.strictMode ) {
				throw new OSCSyntaxError('argument list requires leading comma')
			}
			newArgArray = [...originalOSC.argArray]
		} else {
			newArgArray = originalOSC.argArray.slice(1)
		}

		if ( typeof callBack === 'function' ) {
			return callBack(
				newAddressBuffer,
				this.encodeBufferChunk('s', originalOSC.address),
				newArgArray,
				originalOSC.argBuffer
			)
		}

		newArgArray.unshift('s')

		return Buffer.concat([
			newAddressBuffer,
			this.encodeBufferChunk('s', `,${newArgArray.join('')}`),
			this.encodeBufferChunk('s', originalOSC.address),
			originalOSC.argBuffer
		])
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
	 * @param {String} address address to send to
	 * @returns oscBuilder instance
	 * @example
	 * const myBuffer = oscLib.messageBuilder('/hello').integer(10).float(2.0).string('world').toBuffer()
	 */
	messageBuilder(address) {
		return new oscBuilder(this, address)
	}
}

class oscBuilder {
	#oscLib   = null
	#address  = null
	#argStack = []

	constructor(oscLib, address) {
		if ( typeof address !== 'string' || address.length === 0 ) {
			throw new TypeError('address required')
		}

		this.#oscLib  = oscLib
		this.#address = address
	}

	toString() {
		return this.#oscLib.printableBuffer(this.toBuffer())
	}

	toBuffer() {
		return this.#oscLib.buildMessage({
			address : this.#address,
			args : this.#argStack,
		})
	}

	i(value) { return this.integer(value) }
	integer(value) {
		if ( typeof value !== 'number' || ! Number.isInteger(value) ) {
			throw new TypeError('integer required')
		}
		this.#argStack.push({
			type  : 'integer',
			value : value,
		})
		return this
	}

	f(value) { return this.float(value) }
	float(value) {
		if ( typeof value !== 'number' ) {
			throw new TypeError('float required')
		}
		this.#argStack.push({
			type  : 'float',
			value : value,
		})
		return this
	}

	s(value) { return this.string(value) }
	string(value) {
		if ( typeof value !== 'string' ) {
			throw new TypeError('string required')
		}
		this.#argStack.push({
			type  : 'string',
			value : value,
		})
		return this
	}

	b(value) { return this.blob(value) }
	blob(value) {
		if ( ! Buffer.isBuffer(value) ) {
			throw new TypeError('buffer required')
		}
		this.#argStack.push({
			type  : 'blob',
			value : value,
		})
		return this
	}
}


module.exports = {
	null           : uNULL,
	OSCSyntaxError : OSCSyntaxError,
	simpleOscLib   : simpleOscLib,
}