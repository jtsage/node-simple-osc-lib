/**
 * Simple OSC communication for nodeJS
 * @module simple-osc-lib
 */

/**
 * @constant {String} uNULL Unicode null
 */
const uNULL     = '\u0000'
const UNIX_EPOCH = 2208988800
const TWO_POW_32 = 4294967296


/**
 * @property {object}  options                - simple-osc-lib options.
 * @property {Boolean} options.asciiOnly      - Limit strings to ASCII characters.
 * @property {String}  options.debugCharacter - Character to replace NULLs in debug output.
 * @property {Boolean} options.strictAddress  - Use strict address mode (all string rules, must begin with slash).
 * @property {Boolean} options.strictMode     - Use strict mode.
 */
const options = {
	asciiOnly      : false,    // Prevent non-ASCII characters in strings
	debugCharacter : '\u2022', // Character to replace nulls in debug output
	strictAddress  : false,    // Use strict addresses (strict mode plus require leading slash)
	strictMode     : false,    // Use strict mode elsewhere
}

class OSCSyntaxError extends Error {
	constructor(message, opts) {
		// Need to pass `opts` as the second parameter to install the "cause" property.
		super(message, opts)
	}
}

const _isAddress = ( inputString ) => {
	if ( ! (/^[\w!"$%&'()+-./:;<=>@^`|~]*$/).test(inputString) ) {
		return false
	}
	return true
}

const _isASCII = ( inputString, limit = options.asciiOnly ) => {
	/*eslint-disable no-control-regex*/
	if ( ! limit ) { return true }
	if ( ! (/^[\x00-\x7F]*$/).test(inputString) ) {
		return false
	}
	return true
	/*eslint-enable no-control-regex*/
}

const _fourBytePad = ( inputString ) => {
	const buffLength = Buffer.byteLength(inputString)
	return 4 - ( buffLength % 4 )
}

const _getLastBytePosition = ( inputString ) => {
	const buffLength = Buffer.byteLength(inputString)
	const padLength  = 4 - ( buffLength % 4 )
	return padLength + buffLength
}

const _padStringToFourBytes = ( inputString ) => {
	let padString = inputString
	const padLength = _fourBytePad(inputString)
	for ( let i = 0; i < padLength; i++ ) {
		padString += uNULL
	}
	return padString
}

/**
 * Display a buffer contents in a more readable way - note this only really works with
 * string only data
 * @param {Buffer} buffer_in Buffer to print
 * @param {String} rep_char Character to replace NULL
 * @returns {String} Approximate representation of buffer
 */
const debugOSCBuffer = ( buffer_in, rep_char = options.debugCharacter ) => {
	return buffer_in.toString('utf8').replaceAll(uNULL, rep_char)
}

/**
 * Display a buffer contents in a more readable way (with 4-byte chunk marking) - note this 
 * only really works with string only data
 * @param {Buffer} buffer_in Buffer to print
 * @param {String} rep_char Character to replace NULL
 * @returns {String} Approximate representation of buffer
 */
const debugOSCBufferBlocks = ( buffer_in, rep_char = options.debugCharacter ) => {
	const stringRep = [...buffer_in.toString('utf8').replaceAll(uNULL, rep_char)]
	let outString = ''
	for ( const [i, element] of stringRep.entries() ) {
		outString += element
		if ( i !== 0 && (i + 1) % 4 === 0 ) { outString += '|' }
	}
	return `${Buffer.byteLength(buffer_in)} :: |${outString}`
}

const oscTypeOperations = {
	A : {
		name : 'address',
		toArray : (buffer_in, strictMode = options.strictMode || options.strictAddress ) => {
			const addressArray = oscTypeOperations.s.toArray(buffer_in, strictMode)
			const stringAddress = addressArray.value

			if ( typeof stringAddress !== 'string' || stringAddress.length === 0 ) {
				throw new OSCSyntaxError('address cannot be empty')
			}
			if ( strictMode && !stringAddress.startsWith('/') ) {
				throw new OSCSyntaxError('address must start with a slash')
			}
			addressArray.type = 'address'
			return addressArray
		},
		toBuffer : (address, strictMode = options.strictMode || options.strictAddress ) => {
			if ( typeof address !== 'string' || address.length === 0 ) {
				throw new OSCSyntaxError('address must be a string, and cannot be empty')
			}
			if ( strictMode && !address.startsWith('/') ) {
				throw new OSCSyntaxError('address must start with a slash')
			}
			if ( ! _isAddress(address) ) {
				throw new OSCSyntaxError('invalid characters in address')
			}
			return oscTypeOperations.s.toBuffer(address, strictMode)
		},

	},

	s : {
		name    : 'string',
		toArray : (buffer_in, useStrict = options.strictMode ) => {
			if ( ! Buffer.isBuffer(buffer_in) ) {
				throw new TypeError('buffer expected')
			}
		
			const rawString = buffer_in.toString('utf8')
			const nullIndex = rawString.indexOf('\u0000')
		
			if (nullIndex === -1) {
				if ( useStrict ) {
					throw new OSCSyntaxError('osc string buffers must contain a null character')
				}
				return _decodedBuffer(rawString, Buffer.alloc(0), 'string', 'syntaxError')
			}
		
			const goodString = rawString.slice(0, nullIndex)
			const splitPoint = _getLastBytePosition(goodString)
		
			
			if ( useStrict ) {
				if ( splitPoint > buffer_in.length) {
					throw new OSCSyntaxError('insufficient string padding')
				}
			
				for ( let i = Buffer.byteLength(goodString); i < splitPoint; i++ ) {
					if (buffer_in[i] !== 0) {
						throw new OSCSyntaxError('incorrect string padding')
					}
				}
			}
		
			return _decodedBuffer(goodString, buffer_in.subarray(splitPoint), 'string')
		},
		toBuffer : (value, limit = options.asciiOnly ) => {
			if (typeof value !== 'string') {
				throw new TypeError('expected string')
			}
			if ( ! _isASCII(value, limit) ) { throw new OSCSyntaxError('strings must be ASCII only') }
			return Buffer.from(_padStringToFourBytes(value))
		},
	},

	i : {
		name : 'integer',
		toArray : ( buffer_in ) => {
			if ( ! Buffer.isBuffer(buffer_in) ) {
				throw new TypeError('buffer expected')
			}
			if ( buffer_in.length < 4 ) {
				throw new OSCSyntaxError('buffer too small for integer type')
			}
			const thisNumber = buffer_in.readInt32BE()
			return _decodedBuffer(thisNumber, buffer_in.subarray(4), 'integer')
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

	f : {
		name : 'float',
		toArray : ( buffer_in ) => {
			if ( ! Buffer.isBuffer(buffer_in) ) {
				throw new TypeError('buffer expected')
			}
			if ( buffer_in.length < 4 ) {
				throw new OSCSyntaxError('buffer too small for float type')
			}
			const thisNumber = buffer_in.readFloatBE()
			return _decodedBuffer(thisNumber, buffer_in.subarray(4), 'float')
		},
		toBuffer : (value) => {
			if (typeof value !== 'number' ) {
				throw new TypeError('expected number')
			}
			const buffer_out = Buffer.alloc(4)
			buffer_out.writeFloatBE(value)
			return buffer_out
		},
	},

	d : {
		name : 'double',
		toArray : ( buffer_in ) => {
			if ( ! Buffer.isBuffer(buffer_in) ) {
				throw new TypeError('buffer expected')
			}
			if ( buffer_in.length < 8 ) {
				throw new OSCSyntaxError('buffer too small for float type')
			}
			const thisNumber = buffer_in.readDoubleBE()
			return _decodedBuffer(thisNumber, buffer_in.subarray(8), 'double')
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

	t : {
		name    : 'timetag',
		toArray : ( buffer_in ) => {
			if ( ! Buffer.isBuffer(buffer_in) ) {
				throw new TypeError('buffer expected')
			}
			if ( buffer_in.length < 8 ) {
				throw new OSCSyntaxError('buffer too small for timetag type')
			}
			const number1 = buffer_in.readUInt32BE()
			const number2 = buffer_in.readUInt32BE(4)
			return _decodedBuffer([number1, number2], buffer_in.subarray(8), 'timetag')
		},
		toBuffer : (value) => {
			const timeTagArray = _buildTimeTagArray(value)
			const buffer_out   = Buffer.alloc(8)

			buffer_out.writeUInt32BE(timeTagArray[0])
			buffer_out.writeUInt32BE(timeTagArray[1], 4)

			return buffer_out
		},
	},

	b : {
		name : 'blob',
		toArray : ( buffer_in ) => {
			if ( ! Buffer.isBuffer(buffer_in) ) {
				throw new TypeError('buffer expected')
			}
			if ( buffer_in.length < 8 ) {
				throw new OSCSyntaxError('buffer too small for blob type')
			}
			const dataLength = buffer_in.readUInt32BE()
			const origBuffer = buffer_in.subarray(4, 4 + dataLength)
			const chunkSize  = 4 + dataLength + ( 4 - ( dataLength % 4 ) )
			return _decodedBuffer(origBuffer, buffer_in.subarray(chunkSize), 'blob')
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

	T : {
		name    : 'true',
		toArray : ( buffer_in ) => {
			// does not consume buffer data
			return _decodedBuffer(null, buffer_in, 'true')
		},
		toBuffer : () => {
			// value is discarded, buffer is empty
			return Buffer.alloc(0)
		},
	},

	F : {
		name    : 'false',
		toArray : ( buffer_in ) => {
			// does not consume buffer data
			return _decodedBuffer(null, buffer_in, 'false')
		},
		toBuffer : () => {
			// value is discarded, buffer is empty
			return Buffer.alloc(0)
		},
	},

	N : {
		name    : 'null',
		toArray : ( buffer_in ) => {
			// does not consume buffer data
			return _decodedBuffer(null, buffer_in, 'null')
		},
		toBuffer : () => {
			// value is discarded, buffer is empty
			return Buffer.alloc(0)
		},
	},

	I : {
		name    : 'bang',
		toArray : ( buffer_in ) => {
			// does not consume buffer data
			return _decodedBuffer(null, buffer_in, 'bang')
		},
		toBuffer : () => {
			// value is discarded, buffer is empty
			return Buffer.alloc(0)
		},
	},

	c : {
		name    : 'char',
		toArray : (buffer_in) => {
			if ( ! Buffer.isBuffer(buffer_in) ) {
				throw new TypeError('buffer expected')
			}
			if ( buffer_in.length < 4 ) {
				throw new OSCSyntaxError('buffer too small for char type')
			}
			const thisCharCode = buffer_in.readUInt32BE()
			return _decodedBuffer(String.fromCharCode(thisCharCode), buffer_in.subarray(4), 'char')

		},
		toBuffer : (value) => {
			if (typeof value !== 'string' || value.length > 1 ) {
				throw new TypeError('expected single character')
			}

			if ( ! _isASCII(value, true) ) { throw new OSCSyntaxError('chars must be ASCII only') }

			const buffer_out = Buffer.alloc(4)
			buffer_out.writeUInt32BE(value.charCodeAt(0))
			return buffer_out
		},
	},

	r : {
		name    : 'color',
		toArray : (buffer_in) => {
			if ( ! Buffer.isBuffer(buffer_in) ) {
				throw new TypeError('buffer expected')
			}
			if ( buffer_in.length < 4 ) {
				throw new OSCSyntaxError('buffer too small for color type')
			}
			const colorArray = [
				buffer_in.readUInt8(0),
				buffer_in.readUInt8(1),
				buffer_in.readUInt8(2),
				buffer_in.readUInt8(3)
			]

			return _decodedBuffer(colorArray, buffer_in.subarray(4), 'color')
		},
		toBuffer : (value) => {
			if ( !Array.isArray(value) || value.length !== 4 ) {
				throw new TypeError('expected 4 element array')
			}

			const buffer_out = Buffer.alloc(4)

			buffer_out.writeUInt8(value[0])
			buffer_out.writeUInt8(value[1], 1)
			buffer_out.writeUInt8(value[2], 2)
			buffer_out.writeUInt8(value[3], 3)
			return buffer_out
		},
	},
}

const oscStringTypeToChar = {
	bang    : 'I',
	char    : 'c',
	color   : 'r',
	double  : 'd',
	false   : 'F',
	float   : 'f',
	integer : 'i',
	null    : 'N',
	rgba    : 'r',
	string  : 's',
	timetag : 't',
	true    : 'T',
}

const oscCharTypeToString = (type) => oscTypeOperations[type].name

const normalizeTypeString = (type) => {
	if ( type.length === 1 ) {
		if ( Object.prototype.hasOwnProperty.call(oscTypeOperations, type) ) { return type }
		throw new RangeError('type does not exist')
	}
	if ( Object.prototype.hasOwnProperty.call(oscStringTypeToChar, type) ) { return oscStringTypeToChar[type] }
	throw new RangeError('type does not exist')
}

/**
 * Encode an OSC Data type - low level function
 * @param {String} type OSC Data type string/char
 * @param {*} value Value for data (must be null for null types)
 * @param  {...any} args Additional arguments for the encoder, typically strictMode
 * @returns {Buffer} buffer padded to 32-bit blocks with NULLs
 */
const encodeToBuffer = (type, value, ...args) => {
	const thisType = normalizeTypeString(type)
	return oscTypeOperations[thisType].toBuffer(value, ...args)
}

/**
 * Decode an OSC Data buffer - low level function
 * @param {String} type OSC Data type
 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
 * @param  {...any} args Additional arguments for the decoder, typically strictMode
 * @returns {Object} Contains the type, value, and unused portion of the buffer
 */
const decodeToArray = ( type, buffer_in, ...args) => {
	const thisType = normalizeTypeString(type)
	return oscTypeOperations[thisType].toArray(buffer_in, ...args)
}

const _decodedBuffer = ( value, buffer_remain, type = 'message', error = null ) => {
	return {
		buffer_remain : buffer_remain,
		error         : error,
		type          : type,
		value         : value,
	}
}

const calcTimeTagFromSeconds = (seconds) => {
	const unixSeconds = Math.floor(seconds)
	const fracSeconds = seconds - unixSeconds

	return [
		unixSeconds + UNIX_EPOCH,
		Math.round(TWO_POW_32 * fracSeconds)
	]
}

/**
 * Turn a timetag back into a javascript date object
 * @param {Buffer} timetag timetag data buffer
 * @returns {Date} javascript Date representation
 */
const getDateFromTimeTag = (timetag) => {
	const seconds    = timetag[0] - UNIX_EPOCH
	const fractional = parseFloat(timetag[1]) / TWO_POW_32
	const returnDate = new Date()


	returnDate.setTime((seconds * 1000) + (fractional * 1000))

	return returnDate
}

const _buildTimeTagArray = (value) => {
	if ( Array.isArray(value) && value.length === 2 ) {
		// already prepared
		return value
	} else if ( typeof value === 'number') {
		// is a timestamp
		return calcTimeTagFromSeconds(value)
	} else if ( typeof value === 'object' && typeof value.getTime === 'function' ) {
		// is a date object
		return calcTimeTagFromSeconds(value.getTime() / 1000)
	}
	throw new OSCSyntaxError('invalid timetag format')
}

const _countOccurrences = (haystack, needle) => {
	return haystack.split(needle).length - 1
}

/**
 * Generate a timetag buffer from a timestamp
 * @param {Number} number timestamp (from epoch)
 * @returns {Buffer} 8 byte / 32 bit buffer
 */
const generateTimeTagFromTimestamp = (number) => {
	return encodeToBuffer('t', _buildTimeTagArray(number))
}

/**
 * Generate a timetag buffer from a date instance
 * @param {Date} date javascript date instance
 * @returns {Buffer} 8 byte / 32 bit buffer
 */
const generateTimeTagFromDate = (date) => {
	return encodeToBuffer('t', _buildTimeTagArray(date))
}

/**
 * Generate a timetag buffer for [seconds] in the future
 * @param {Number} seconds seconds in the future
 * @param {Date|null} now point to calculate from
 * @returns {Buffer} 8 byte / 32 bit buffer
 */
const generateTimeTagFromDelta = (seconds, now = null) => {
	const n = (now !== null ? now : new Date()) / 1000
	return encodeToBuffer('t', _buildTimeTagArray(n + seconds))
}

const _processArgArrayToBuffer = ( args, nested = false ) => {
	const thisArgTypeList   = []
	const thisArgBufferList = []

	if ( !Array.isArray(args) ) {
		throw new RangeError('argument list must be an array of argument objects')
	}

	if ( nested ) { thisArgTypeList.push('[') }
	
	for ( const thisArg of args ) {
		if ( Array.isArray(thisArg) ) {
			// do nest
			const nestedSet = _processArgArrayToBuffer(thisArg, true)
			thisArgTypeList.push(...nestedSet.types)
			thisArgBufferList.push(...nestedSet.buffers)
			continue
		}
		if ( typeof thisArg !== 'object' || typeof thisArg.type === 'undefined' || typeof thisArg.value === 'undefined' ) {
			throw new RangeError('invalid argument')
		}

		const thisArgType = normalizeTypeString(thisArg.type)
		thisArgTypeList.push(thisArgType)
		thisArgBufferList.push(encodeToBuffer(thisArgType, thisArg.value))
	}

	if ( nested ) { thisArgTypeList.push(']') }

	return {
		types : thisArgTypeList,
		buffers : thisArgBufferList,
	}
}

const _isBundle = ( buffer_in ) => {
	return buffer_in.subarray(0, 7).toString('utf8') === '#bundle'
}

/**
 * Build a single OSC message buffer
 * @param {Object} oscMessageObject single OSC message object
 * @returns {Buffer} buffer padded to 32-bit blocks with NULLs
 */
const oscBuildMessage = (oscMessageObject) => {
	if ( typeof oscMessageObject !== 'object' || typeof oscMessageObject.address === 'undefined' ) {
		throw new RangeError('improper OSC message object')
	}
	const buffer_address = encodeToBuffer('A', oscMessageObject.address)

	if ( typeof oscMessageObject.args === 'undefined' ) { return buffer_address }
	if ( !Array.isArray(oscMessageObject.args) ) {
		throw new RangeError('argument list must be an array of argument objects')
	}

	const allArgs = _processArgArrayToBuffer(oscMessageObject.args)
	const typesBuffer = encodeToBuffer('s', `,${allArgs.types.join('')}`)
	
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
const oscBuildBundle = (oscBundleObject) => {
	if ( typeof oscBundleObject !== 'object' ) {
		throw new RangeError('improper OSC bundle object')
	}
	if ( ! Buffer.isBuffer(oscBundleObject.timetag) ) {
		throw new TypeError('expected timetag buffer (use generateTimeTagFrom*)')
	}
	if ( ! Array.isArray(oscBundleObject.elements) ) {
		throw new RangeError('unable to send empty bundles')
	}
	const sendBuffer = [
		encodeToBuffer('s', '#bundle'),
		oscBundleObject.timetag,
	]

	for ( const thisElement of oscBundleObject.elements ) {
		if ( Buffer.isBuffer(thisElement) ) {
			sendBuffer.push(encodeToBuffer('i', thisElement.length), thisElement)
		} else {
			const newBuffer = oscBuildMessage(thisElement)
			sendBuffer.push(encodeToBuffer('i', newBuffer.length), newBuffer)
		}
	}

	return Buffer.concat(sendBuffer)
}

/**
 * Decode a single OSC message.
 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
 * @param {Object} options options
 * @param {Object} options.strictMode use strict mode
 * @param {Object} options.messageCallback callback to run on each message
 * @returns {Object} osc-message object
 */
const oscReadMessage = ( buffer_in, { useStrict = options.strictMode, messageCallback = null } = {} ) => {
	if ( ! Buffer.isBuffer(buffer_in) ) {
		throw new TypeError('buffer expected')
	}

	if ( useStrict && buffer_in.length % 4 !== 0 ) {
		throw new OSCSyntaxError('buffer is not a 4-byte multiple')
	}

	const oscMessage = { type : 'osc-message', address : null, args : [] }

	const thisAddress_array = decodeToArray('A', buffer_in, useStrict)

	oscMessage.address = thisAddress_array.value

	if ( thisAddress_array.buffer_remain.length === 0 ) {
		return typeof messageCallback === 'function' ? messageCallback(oscMessage) : oscMessage
	}

	const thisArgList_array = decodeToArray('s', thisAddress_array.buffer_remain, useStrict)

	const arrayOpenMarks  = _countOccurrences(thisArgList_array.value, '[')
	const arrayCloseMarks = _countOccurrences(thisArgList_array.value, ']')

	if ( arrayCloseMarks !== arrayOpenMarks ) {
		throw new OSCSyntaxError('mismatched array nesting')
	}

	let buffer_remain = thisArgList_array.buffer_remain

	const arrayStack = [oscMessage.args]

	for ( let i = 0; i < thisArgList_array.value.length; i++ ) {
		const thisItem = thisArgList_array.value[i]
		if ( i === 0 ) {
			if ( thisItem === ',' ) { continue }
			if ( useStrict ) {
				throw new OSCSyntaxError('argument list requires leading comma')
			}
		}
		
		if ( thisItem === '[' ) {
			arrayStack.push([])
			continue
		}
		if ( thisItem === ']' ) {
			if ( arrayStack.length <= 1 ) {
				throw new OSCSyntaxError('Strict Error: Mismatched "]" character.')
			} else {
				const built = arrayStack.pop()
				arrayStack[arrayStack.length - 1].push({
					type  : 'array',
					value : built,
				})
			}
			continue
		}

		const thisArg_array = decodeToArray(thisItem, buffer_remain, useStrict)

		arrayStack[arrayStack.length - 1].push({
			type  : oscCharTypeToString(thisItem),
			value : thisArg_array.value,
		})

		buffer_remain = thisArg_array.buffer_remain
	}
	return typeof messageCallback === 'function' ? messageCallback(oscMessage) : oscMessage
}

/**
 * Decode an OSC bundle
 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
 * @param {Object} options options
 * @param {Object} options.strictMode use strict mode
 * @param {Object} options.messageCallback callback to run on each message
 * @returns {Object} osc-bundle object
 */
const oscReadBundle = ( buffer_in, { useStrict = options.strictMode, messageCallback = null } = {}  ) => {
	if ( ! Buffer.isBuffer(buffer_in) ) {
		throw new TypeError('buffer expected')
	}

	if ( ! _isBundle(buffer_in) ) {
		throw new TypeError('osc-bundles must begin with #bundle')
	}

	const bundleObject = {
		type : 'osc-bundle',
		timetag : null,
		elements : [],
	}

	const timeTag = decodeToArray('t', buffer_in.subarray(8), useStrict)

	bundleObject.timetag = getDateFromTimeTag(timeTag.value)

	let buffer_remain = timeTag.buffer_remain

	while ( buffer_remain.length !== 0 ) {
		const nextMessageSize = decodeToArray('i', buffer_remain)
		const nextMessage     = nextMessageSize.buffer_remain.subarray(0, nextMessageSize.value)

		bundleObject.elements.push(oscReadPacket(nextMessage, { useStrict : useStrict, messageCallback : messageCallback }))

		buffer_remain = buffer_remain.subarray(nextMessageSize.value+4)
	}

	return bundleObject
}

/**
 * Decode an OSC packet.  Useful for when the client might send bundles or messages
 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
 * @param {Object} options options
 * @param {Object} options.strictMode use strict mode
 * @param {Object} options.messageCallback callback to run on each message
 * @returns {Object} osc-bundle object or osc-message object
 */
const oscReadPacket = ( buffer_in, { useStrict = options.strictMode, messageCallback = null } = {} ) => {
	if ( ! Buffer.isBuffer(buffer_in) ) {
		throw new TypeError('buffer expected')
	}

	if ( buffer_in.size === 0 ) { return null }

	if ( _isBundle(buffer_in) ) {
		return oscReadBundle(buffer_in, { useStrict : useStrict, messageCallback : messageCallback })
	}
	return oscReadMessage(buffer_in, { useStrict : useStrict, messageCallback : messageCallback })
}

module.exports = {
	null    : uNULL,
	options : options,

	debugOSCBuffer       : debugOSCBuffer,
	debugOSCBufferBlocks : debugOSCBufferBlocks,

	generateTimeTagFromDate      : generateTimeTagFromDate,
	generateTimeTagFromDelta     : generateTimeTagFromDelta,
	generateTimeTagFromTimestamp : generateTimeTagFromTimestamp,

	calcTimeTagFromSeconds : calcTimeTagFromSeconds,
	decodeToArray          : decodeToArray,
	encodeToBuffer         : encodeToBuffer,
	getDateFromTimeTag     : getDateFromTimeTag,

	oscBuildBundle  : oscBuildBundle,
	oscBuildMessage : oscBuildMessage,

	oscReadBundle   : oscReadBundle,
	oscReadMessage  : oscReadMessage,
	oscReadPacket   : oscReadPacket,

	OSCSyntaxError : OSCSyntaxError,
}