

const TWO_POW_32 = 4294967296
const UNIX_EPOCH = 2208988800

/** Result of OSC Address match */
export type OSCAddressMatchResult = {
	address : string,
	matches : string[]
} | null

export type OSCMatchResult = {
	address : string,
	matches : string[],
	args    : OSCArgument[]
} | null


export type OSCMessageObject = {
	address  : string,
	elements : OSCArgObject[],
	type     : 'message',
}

export type OSCBundleObject = {
	messages : Array<OSCMessageObject | OSCBundleObject>,
	timeTag  : OSCTimeTagArray,
	type     : 'bundle',
}

/** OSC Color - 4 element numeric array (0-255) (4-byte) */
export type OSCColorArray   = [ number, number, number, number ]
/** OSC Midi - 4 Byte */
export type OSCMidiArray    = [ number, number, number, number ]
/** OSC Time Tag - 8 byte. */
export type OSCTimeTagArray = [ number, number ]
/** Time Tag Delta type - e.g. '+50' for 50ms in the future */
export type OSCTimeTagDelta = `+${number}`
/** List of types castable to OSCTimeTag by OSCTimeTag.fromValue */
export type OSCTimeTagCastable = OSCTimeTag | OSCTimeTagArray | OSCTimeTagDelta | number | Date | boolean | null | undefined

export type OSCArgument =
	| OSCTypeArrayClose
	| OSCTypeArrayOpen
	| OSCTypeBang
	| OSCTypeBigInt
	| OSCTypeBlob
	| OSCTypeChar
	| OSCTypeColor
	| OSCTypeDouble
	| OSCTypeFalse
	| OSCTypeFloat
	| OSCTypeInteger
	| OSCTypeMidi
	| OSCTypeNull
	| OSCTypeString
	| OSCTypeSymbol
	| OSCTypeTrue

/** Supported OSC arguments */
export type OSCArgObject =
	// | { type : 'array';    value : OSCTypeInterface[] }
	| { type : 'arrayOpen';  value : null }
	| { type : 'arrayClose'; value : null }
	| { type : 'bang';       value : null }
	| { type : 'bigint';     value : bigint }
	| { type : 'blob';       value : Buffer }
	| { type : 'char';       value : string }
	| { type : 'color';      value : OSCColorArray }
	| { type : 'double';     value : number }
	| { type : 'false';      value : null }
	| { type : 'float';      value : number }
	| { type : 'integer';    value : number }
	| { type : 'midi';       value : OSCMidiArray }
	| { type : 'null';       value : null }
	| { type : 'string';     value : string }
	| { type : 'symbol';     value : string }
	| { type : 'true';       value : null }

/** OSCType[Type] Interface */
export interface OSCTypeInterface {
	buffer   : Buffer<ArrayBufferLike>
	bufLen   : number
	debug    : string
	type     : string
	typeChar : string
	value    : unknown
	toJSON   : unknown
}

// MARK: OSCArg (parent class)
export class OSCArg implements OSCTypeInterface {
	/* istanbul ignore next */
	get type() { return 'unknown' }
	/* istanbul ignore next */
	get value() : unknown { return null }
	/* istanbul ignore next */
	get debug() { return ''}
	/* istanbul ignore next */
	get typeChar() { return 'x' }
	/* istanbul ignore next */
	get buffer() { return Buffer.alloc( 0 ) }
	/* istanbul ignore next */
	get bufLen() { return 0 }

	
	constructor() {
		if ( new.target === OSCArg ) {
			throw new OSCTypeError( 'Cannot instantiate OSCArg directly. It is for type checking only.' )
		}
	}

	/* istanbul ignore next */
	toJSON() : OSCArgObject { return { type  : 'null', value : null } }
}

// MARK: OSCType
export class OSCType {
	constructor() { throw new OSCTypeError( 'use fromObject or fromValue method' ) }

	static fromObject( v : OSCArgObject ) {
		if ( typeof v.type === 'undefined' || typeof v.value === 'undefined' ) {
			throw new OSCTypeError( 'incorrect object type' )
		}
		switch ( v.type ) {
			case 'arrayOpen'  : return new OSCTypeArrayOpen()
			case 'arrayClose' : return new OSCTypeArrayClose()
			case 'bang'       : return new OSCTypeBang()
			case 'bigint'     : return new OSCTypeBigInt( v.value )
			case 'blob'       : return new OSCTypeBlob( v.value )
			case 'char'       : return new OSCTypeChar( v.value )
			case 'color'      : return new OSCTypeColor( v.value )
			case 'double'     : return new OSCTypeDouble( v.value )
			case 'false'      : return new OSCTypeFalse()
			case 'float'      : return new OSCTypeFloat( v.value )
			case 'integer'    : return new OSCTypeInteger( v.value )
			case 'midi'       : return new OSCTypeMidi( v.value )
			case 'null'       : return new OSCTypeNull()
			case 'string'     : return new OSCTypeString( v.value )
			case 'symbol'     : return new OSCTypeSymbol( v.value )
			case 'true'       : return new OSCTypeTrue()
			default :
				throw new OSCTypeError( 'incorrect object type' )
		}
	}

	static fromValue( v : OSCArgObject['value'] | boolean | null | symbol ) {
		if ( typeof v === 'boolean' ) {
			return v ? new OSCTypeTrue() : new OSCTypeFalse()
		}
		
		if ( v === null ) {
			return new OSCTypeNull()
		}
		
		if ( typeof v === 'symbol' ) {
			const desc = v.description
			if ( typeof desc === 'string' ) {
				return new OSCTypeSymbol( desc )
			}
			throw new OSCTypeError( 'unable to use this symbol' )
		}
		
		if ( typeof v === 'bigint' ) {
			return new OSCTypeBigInt( v )
		}
			
		if ( typeof v === 'number' ) {
			if ( v === Number.POSITIVE_INFINITY || v === Number.NEGATIVE_INFINITY || v === Infinity ) {
				return new OSCTypeBang()
			}
			if ( Number.isInteger( v ) ) {
				return new OSCTypeInteger( v )
			}
			return new OSCTypeFloat( v )
		}

		if ( typeof v === 'string' ) {
			if ( v === '[' ) {
				return new OSCTypeArrayOpen()
			}
			if ( v === ']' ) {
				return new OSCTypeArrayClose()
			}
			return new OSCTypeString( v )
		}
		
		if ( Buffer.isBuffer( v ) ) {
			return new OSCTypeBlob( v )
		}
		
		throw new OSCTypeError( `autoTyping unavailable for "${typeof v}"` )
	}
}


// MARK: OSCTypeArrayOpen
/** Array Open - 'arrayOpen', '[', 0-byte null value */
export class OSCTypeArrayOpen extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get debug()    { return ''}
	get value()    { return null }
	get type()     { return 'arrayOpen' }
	get typeChar() { return '[' }
	get buffer()   { return Buffer.alloc( 0 ) }
	toJSON() : OSCArgObject { return { type  : 'arrayOpen', value : null } }
}

// MARK: OSCTypeArrayClose
/** Array Close - 'arrayClose', '[', 0-byte null value */
export class OSCTypeArrayClose extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get debug()    { return ''}
	get value()    { return null }
	get type()     { return 'arrayClose' }
	get typeChar() { return ']' }
	get buffer()   { return Buffer.alloc( 0 ) }
	toJSON() : OSCArgObject { return { type  : 'arrayClose', value : null } }
}

// MARK: OSCTypeBang
/** Bang - 'bang', 'I', 0-byte null value */
export class OSCTypeBang extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get value()    { return null }
	get type()     { return 'bang' }
	get typeChar() { return 'I' }
	get buffer()   { return Buffer.alloc( 0 ) }
	get debug()    { return '' }
	toJSON() : OSCArgObject { return { type  : 'bang', value : null } }
}

// MARK: OSCTypeBigInt
/** Big Integer - 'bigint', 'h', 8-byte */
export class OSCTypeBigInt extends OSCArg implements OSCTypeInterface {
	#value ! : bigint

	constructor( v : bigint ) { super(); this.value = v }

	set value( v : bigint ) {
		if ( typeof v !== 'bigint' ) {
			throw new OSCTypeError( 'expected bigint' )
		}
		this.#value = v
	}

	get bufLen()   { return 8 }
	get debug()    { return '..h..8..'}
	get value()    { return this.#value }
	get type()     { return 'bigint' }
	get typeChar() { return 'h' }
	toJSON() : OSCArgObject { return { type  : 'bigint', value : this.#value } }

	get buffer() {
		const buffer_out = Buffer.alloc( 8 )
		buffer_out.writeBigInt64BE( this.#value )
		return buffer_out
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) || b.length !== 8 ) {
			throw new OSCDecodeError( 'buffer wrong size for bigint type' )
		}
		const v = BigInt( b.readBigInt64BE() )
		return new OSCTypeBigInt( v )
	}
}

// MARK: OSCTypeBlob
/** Blob (Buffer) - 'blob', 'b', variable-size (4-byte block) */
export class OSCTypeBlob extends OSCArg implements OSCTypeInterface {
	#value ! : Buffer<ArrayBufferLike>

	constructor( v : Buffer<ArrayBufferLike> ) { super(); this.value = v }

	set value( v : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( v ) ) {
			throw new OSCTypeError( 'expected buffer' )
		}
		this.#value = v
	}

	get bufLen()   { return this.#value.length }
	get value()    { return this.#value }
	get debug()    { return `-b-${this.bufLen}-`}
	get type()     { return 'blob' }
	get typeChar() { return 'b' }
	toJSON() : OSCArgObject { return { type  : 'blob', value : this.#value } }

	get buffer() { // Includes required size tag
		const inputSize    = this.#value.length
		const totalSize    = 4 + inputSize + ( 4 - ( inputSize % 4 ) )
		
		const buffer_out = Buffer.alloc( totalSize )
		buffer_out.writeUInt32BE( inputSize )
		this.#value.copy( buffer_out, 4 )

		return buffer_out
	}
}

// MARK: OSCTypeChar
/** Character - 'char', 'c', 4-byte */
export class OSCTypeChar extends OSCArg implements OSCTypeInterface {
	#value ! : string

	constructor( v : string ) { super(); this.value = v }

	set value( v : string ) {
		if ( typeof v !== 'string' || v.length !== 1 || v.charCodeAt( 0 ) > 127 ) {
			throw new OSCTypeError( 'expected ascii character 0-127' )
		}
		this.#value = v
	}

	get bufLen()   { return 4 }
	get value()    { return this.#value }
	get debug()    { return `c::${this.#value}`}
	get type()     { return 'char' }
	get typeChar() { return 'c' }
	toJSON() : OSCArgObject { return { type  : 'char', value : this.#value } }

	get buffer() {
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeUInt32BE( this.#value.charCodeAt( 0 ) )
		return buffer_out
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) || b.length !== 4 ) {
			throw new OSCDecodeError( 'buffer wrong size for character type' )
		}
		const v = b.readUInt32BE()
		return new OSCTypeChar( String.fromCharCode( v ) )
	}
}

// MARK: OSCTypeColor
/** Color - 'color', 'r', 4-byte, 4 element array [R,G,B,A] */
export class OSCTypeColor extends OSCArg implements OSCTypeInterface {
	#value ! : OSCColorArray

	constructor( v : OSCColorArray ) { super(); this.value = v }

	set value( v : OSCColorArray ) {
		if ( !Array.isArray( v ) || v.length !== 4 ) {
			throw new OSCTypeError( 'expected color type' )
		}

		for ( const element of v ) {
			if ( typeof element !== 'number' || !Number.isInteger( element ) || element < 0 || element > 255 ) {
				throw new OSCTypeError( 'expected color type' )
			}
		}

		this.#value = v
	}

	get bufLen()   { return 4 }
	get debug()    { return '.r4.'}
	get value()    { return this.#value }
	get type()     { return 'color' }
	get typeChar() { return 'r' }
	toJSON() : OSCArgObject { return { type  : 'color', value : this.#value } }

	get buffer() {
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeUInt8( this.#value[0], 0 )
		buffer_out.writeUInt8( this.#value[1], 1 )
		buffer_out.writeUInt8( this.#value[2], 2 )
		buffer_out.writeUInt8( this.#value[3], 3 )
		return buffer_out
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) || b.length !== 4 ) {
			throw new OSCDecodeError( 'buffer wrong size for integer type' )
		}
		const colorArray : OSCColorArray = [
			b.readUInt8( 0 ),
			b.readUInt8( 1 ),
			b.readUInt8( 2 ),
			b.readUInt8( 3 )
		]
		return new OSCTypeColor( colorArray )
	}
}

// MARK: OSCTypeDouble
/** Double - 'double', 'd', 8-byte, double-precision floating point */
export class OSCTypeDouble extends OSCArg implements OSCTypeInterface {
	#value ! : number

	constructor( v : number ) { super(); this.value = v }

	set value( v : number ) {
		if ( typeof v !== 'number' ) {
			throw new OSCTypeError( 'expected number' )
		}
		this.#value = v
	}

	get bufLen()   { return 8 }
	get debug()    { return '..d..8..'}
	get value()    { return this.#value }
	get type()     { return 'double' }
	get typeChar() { return 'd' }
	toJSON() : OSCArgObject { return { type  : 'double', value : this.#value } }

	get buffer() {
		const buffer_out = Buffer.alloc( 8 )
		buffer_out.writeDoubleBE( this.#value )
		return buffer_out
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) || b.length !== 8 ) {
			throw new OSCDecodeError( 'buffer wrong size for integer type' )
		}
		const v = b.readDoubleBE()
		return new OSCTypeDouble( v )
	}
}

// MARK: OSCTypeFalse
/** False - 'false', 'F', 0-byte null value */
export class OSCTypeFalse extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get debug()    { return ''}
	get value()    { return null }
	get type()     { return 'false' }
	get typeChar() { return 'F' }
	get buffer()   { return Buffer.alloc( 0 ) }
	toJSON() : OSCArgObject { return { type  : 'false', value : null } }
}

// MARK: OSCTypeFloat
/** Float - 'float', 'f', 4-byte */
export class OSCTypeFloat extends OSCArg implements OSCTypeInterface {
	#value ! : number

	constructor( v : number ) { super(); this.value = v }

	set value( v : number ) {
		if ( typeof v !== 'number' ) {
			throw new OSCTypeError( 'expected number' )
		}
		this.#value = v
	}

	get bufLen()   { return 4 }
	get debug()    { return '.f4.'}
	get value()    { return this.#value }
	get type()     { return 'float' }
	get typeChar() { return 'f' }
	toJSON() : OSCArgObject { return { type  : 'float', value : this.#value } }

	get buffer() {
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeFloatBE( this.#value )
		return buffer_out
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) || b.length !== 4 ) {
			throw new OSCDecodeError( 'buffer wrong size for float type' )
		}
		const v = b.readFloatBE()
		return new OSCTypeFloat( v )
	}
}

// MARK: OSCTypeInteger
/** Integer - 'integer', 'i', 4-byte */
export class OSCTypeInteger extends OSCArg implements OSCTypeInterface {
	#value ! : number

	constructor( v : number ) { super(); this.value = v }

	set value( v : number ) {
		if ( typeof v !== 'number' || !Number.isInteger( v ) ) {
			throw new OSCTypeError( 'expected integer' )
		}
		this.#value = v
	}

	get bufLen()   { return 4 }
	get debug()    { return '.i4.'}
	get value()    { return this.#value }
	get type()     { return 'integer' }
	get typeChar() { return 'i' }
	toJSON() : OSCArgObject { return { type  : 'integer', value : this.#value } }

	get buffer() {
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeInt32BE( this.#value )
		return buffer_out
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) || b.length !== 4 ) {
			throw new OSCDecodeError( 'buffer wrong size for integer type' )
		}
		const v = b.readInt32BE()
		return new OSCTypeInteger( v )
	}
}

// MARK: OSCTypeMidi
/** MIDI - 'midi', 'm', 4-byte, 4 element array */
export class OSCTypeMidi extends OSCArg implements OSCTypeInterface {
	#value ! : OSCMidiArray

	constructor( v : OSCMidiArray ) { super(); this.value = v }

	set value( v : OSCMidiArray ) {
		if ( !Array.isArray( v ) || v.length !== 4 ) {
			throw new OSCTypeError( 'expected midi type' )
		}

		for ( const element of v ) {
			if ( typeof element !== 'number' || !Number.isInteger( element ) ) {
				throw new OSCTypeError( 'expected midi type' )
			}
		}

		if ( v[0] < 0 || v[0] > 255 ) {
			throw new OSCTypeError( 'midi byte 1 out of range' )
		}
		if ( v[1] < 128 || v[1] > 255 ) {
			throw new OSCTypeError( 'midi byte 2 (status) out of range' )
		}
		if ( v[2] < 0 || v[2] > 127 ) {
			throw new OSCTypeError( 'midi byte 3 (data) out of range' )
		}
		if ( v[3] < 0 || v[3] > 127 ) {
			throw new OSCTypeError( 'midi byte 4 (data) out of range' )
		}

		this.#value = v
	}

	get bufLen()   { return 4 }
	get debug()    { return '.m4.'}
	get value()    { return this.#value }
	get type()     { return 'midi' }
	get typeChar() { return 'm' }
	toJSON() : OSCArgObject { return { type  : 'midi', value : this.#value } }

	get buffer() {
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeUInt8( this.#value[0], 0 )
		buffer_out.writeUInt8( this.#value[1], 1 )
		buffer_out.writeUInt8( this.#value[2], 2 )
		buffer_out.writeUInt8( this.#value[3], 3 )
		return buffer_out
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) || b.length !== 4 ) {
			throw new OSCDecodeError( 'buffer wrong size for integer type' )
		}
		const midiArray : OSCMidiArray = [
			b.readUInt8( 0 ),
			b.readUInt8( 1 ),
			b.readUInt8( 2 ),
			b.readUInt8( 3 )
		]
		return new OSCTypeMidi( midiArray )
	}
}

// MARK: OSCTypeNull
/** Null - 'null', 'N', 0-byte null value */
export class OSCTypeNull extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get debug()    { return ''}
	get value()    { return null }
	get type()     { return 'null' }
	get typeChar() { return 'N' }
	get buffer()   { return Buffer.alloc( 0 ) }
	toJSON() : OSCArgObject { return { type  : 'null', value : null } }
}

// MARK: OSCTypeString
/** String - 'string', 's', unknown, 4-byte block */
export class OSCTypeString extends OSCArg implements OSCTypeInterface {
	#value ! : string
	#ascii   : boolean

	constructor( v : string, ascii : boolean = false ) {
		super()
		this.#ascii = ascii
		this.value  = v
	}

	set value( v : string ) {
		if ( typeof v !== 'string' ) {
			throw new OSCTypeError( 'expected string' )
		}
		if ( this.#ascii && ( ! ( /^[ -~]+$/ ).test( v ) ) ) {
			throw new OSCTypeError( 'strings must be ASCII only' )
		}
		this.#value = v
	}

	get debug() {
		// eslint-disable-next-line no-control-regex
		const x = this.#value.replaceAll( /[^\x00-\x7F]/gu, ( match ) => {
			const thisLen = Buffer.byteLength( match )
			return ''.padEnd( thisLen, '¿' )
		} )
		const parts = []
		for ( let i = 0; i < Math.ceil( x.length / 4 ); i++ ) {
			parts.push( x.slice( 4 * i, ( 4 * i ) + 4 ) )
		}

		const lastIdx = parts.length - 1
		if ( parts.length === 0 ) {
			parts.push( '\u2022\u2022\u2022\u2022' )
		} else {
			parts[lastIdx] = parts[lastIdx]!.padEnd( 4, '\u2022' )
			if ( parts[parts.length - 1]?.[3] !== '\u2022' ) {
				parts.push( '\u2022\u2022\u2022\u2022' )
			}
		}

		return parts.join( '\xA6' )
	}

	get bufLen()   { return Buffer.byteLength( this.#value ) }
	get value()    { return this.#value }
	get type()     { return 'string' }
	get typeChar() { return 's' }
	toJSON() : OSCArgObject { return { type  : 'string', value : this.#value } }

	get buffer() {
		const strByteLength = this.bufLen
		const bufferLength  = ( 4 - ( strByteLength % 4 ) ) + strByteLength
		const buffer        = Buffer.alloc( bufferLength )
		buffer.write( this.#value )
		return buffer
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) ) {
			throw new OSCDecodeError( 'buffer expected' )
		}
		const v = b.toString( 'utf8' )
		return new OSCTypeString( v.replace( /\0+$/, '' ) )
	}
}

// MARK: OSCTypeSymbol
/** Symbol - 'symbol', 'S', unknown 4-byte padded */
export class OSCTypeSymbol extends OSCTypeString implements OSCTypeInterface {
	get type()     { return 'symbol' }
	get typeChar() { return 'S' }
	toJSON() : OSCArgObject { return { type  : 'symbol', value : this.value } }

	constructor( v : string | symbol, ascii : boolean = false ) {
		if ( typeof v === 'symbol' ) {
			const desc = v.description
			if ( typeof desc === 'string' ) {
				super( desc, ascii )
			} else {
				throw new OSCTypeError( 'unable to use this symbol' )
			}
		} else {
			super( v, ascii )
		}
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) ) {
			throw new OSCDecodeError( 'buffer expected' )
		}
		const v = b.toString( 'utf8' )
		return new OSCTypeSymbol( v.replace( /\0+$/, '' ) )
	}
}

// MARK: OSCTypeTrue
/** True - 'true', 'T', 0-byte null value */
export class OSCTypeTrue extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get debug()    { return ''}
	get value()    { return null }
	get type()     { return 'true' }
	get typeChar() { return 'T' }
	get buffer()   { return Buffer.alloc( 0 ) }
	toJSON() : OSCArgObject { return { type  : 'true', value : null } }
}

// MARK: OSCTimeTag
/** TimeTag - 'timetag', 't', 8-byte time tag.  Not a member of OSCArg, this is a special value type */
export class OSCTimeTag implements OSCTypeInterface {
	#value ! : OSCTimeTagArray

	constructor( v : OSCTimeTagArray ) { this.value  = v }

	set value( v : OSCTimeTagArray ) {
		if ( !Array.isArray( v ) || typeof v[0] !== 'number' || typeof v[1] !== 'number' ) {
			throw new OSCTypeError( 'expected time tag array' )
		}
		this.#value = v
	}

	get bufLen()   { return 8 }
	get debug()    { return '[t4][t4]'}
	get value()    { return this.#value }
	get type()     { return 'timetag' }
	get typeChar() { return 't' }

	toJSON() { return this.value }

	get buffer() {
		const buffer_out   = Buffer.alloc( 8 )

		buffer_out.writeUInt32BE( this.#value[0] )
		buffer_out.writeUInt32BE( this.#value[1], 4 )

		return buffer_out
	}

	toISOString() { return this.asDate.toISOString() }

	get asDate() {
		const seconds    = this.#value[0] - UNIX_EPOCH
		const fractional = parseFloat( this.#value[1].toString() ) / TWO_POW_32
		const returnDate = new Date()
	
		returnDate.setTime( ( seconds * 1000 ) + ( fractional * 1000 ) )
	
		return returnDate
	}

	sinceNow( now ? : Date ) {
		if ( this.#value[0] === 0 && this.#value[1] === 1 ) {
			return 0
		}
		const nowTime = ( typeof now === 'undefined' || ! ( now instanceof Date ) ) ?
			( new Date() ).getTime() :
			now.getTime()

		return nowTime - this.asDate.getTime()
	}

	static #timeTagFromSeconds( v : number ) : OSCTimeTagArray {
		const unixSeconds = Math.floor( v )
		const fracSeconds = v - unixSeconds
		
		return [
			unixSeconds + UNIX_EPOCH,
			Math.round( TWO_POW_32 * fracSeconds )
		]
	}

	static fromValue( v ? : OSCTimeTagCastable ) {
		if ( typeof v === 'undefined' || v === false || v === null ) {
			return new OSCTimeTag( OSCTimeTag.#timeTagFromSeconds( ( ( new Date() ).getTime() ) / 1000 ) )
		} else if ( v === true ) {
			return new OSCTimeTag( [0, 1] )// do it right now!
		} else if ( Array.isArray( v ) ) {
			return new OSCTimeTag( v )
		} else if ( v instanceof OSCTimeTag ) {
			return v
		} else if ( v instanceof Date ) { // specific date supplied
			return new OSCTimeTag( OSCTimeTag.#timeTagFromSeconds( v.getTime() / 1000 ) )
		} else if ( typeof v === 'number' ) { // raw seconds supplied
			return new OSCTimeTag( OSCTimeTag.#timeTagFromSeconds( v ) )
		} else if ( typeof v === 'string' && v.startsWith( '+' ) ) { // delta
			const num = parseInt( v.slice( 1 ) )
			if ( num.toString() !== v.slice( 1 ) ) {
				throw new OSCTypeError( `unable to compute delta from value ${v} - must be +[ms]` )
			}
			return new OSCTimeTag( OSCTimeTag.#timeTagFromSeconds( ( ( ( new Date() ).getTime() ) + num ) / 1000 ) )
		}
		throw new OSCTypeError( `unable to get timetag from supplied value ${v}` )
	}
	
	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) || b.length !== 8 ) {
			throw new OSCDecodeError( '8-byte buffer expected' )
		}
		const number1 = b.readUInt32BE()
		const number2 = b.readUInt32BE( 4 )
		
		return new OSCTimeTag( [number1, number2] )
	}
}

// MARK: OSCTypeAddress
/** Address - 'address', 'a', unknown, 4-byte block */
export class OSCAddress implements OSCTypeInterface {
	#value ! : string

	constructor( v : string ) { this.value  = v }

	set value( v : string ) {
		if ( typeof v !== 'string' || v === '' ) {
			throw new OSCTypeError( 'expected string' )
		}
		if ( ! ( /^[\w!"$%&'()+-./:;<=>@^`|~]*$/ ).test( v ) ) {
			throw new OSCTypeError( `Address has invalid characters "${v}"` )
		}
		this.#value = v
	}

	get debug() {
		const parts = []
		for ( let i = 0; i < Math.ceil( this.#value.length / 4 ); i++ ) {
			parts.push( this.#value.slice( 4 * i, ( 4 * i ) + 4 ) )
		}

		const lastIdx = parts.length - 1
		parts[lastIdx] = parts[lastIdx]!.padEnd( 4, '\u2022' )
		if ( parts[parts.length - 1]?.[3] !== '\u2022' ) {
			parts.push( '\u2022\u2022\u2022\u2022' )
		}

		return parts.join( '\xA6' )
	}

	get bufLen()   { return Buffer.byteLength( this.#value ) }
	get value()    { return this.#value }
	get type()     { return 'address' }
	get typeChar() { return 'a' }

	toJSON() { return this.#value }

	get buffer() {
		const strByteLength = this.bufLen
		const bufferLength  = ( 4 - ( strByteLength % 4 ) ) + strByteLength
		const buffer        = Buffer.alloc( bufferLength )
		buffer.write( this.#value )
		return buffer
	}

	static fromBuffer( b : Buffer<ArrayBufferLike> ) {
		if ( !Buffer.isBuffer( b ) ) {
			throw new OSCDecodeError( 'buffer expected' )
		}
		const v = b.toString( 'utf8' )

		return new OSCAddress( v.replace( /\0+$/, '' ) )
	}

	match( pattern : string | RegExp ) : OSCAddressMatchResult {
		let regExpCompiled : RegExp
		
		if ( pattern instanceof RegExp ) {
			regExpCompiled = pattern
		} else if ( typeof pattern === 'string' && pattern.length !== 0 ) {
			const regExpPattern = pattern
				.replaceAll( '.', '\\.' )
				.replaceAll( /{(.+?)}/g, ( _, grp ) => `(${grp.replaceAll( ',', '|' )})` )
				.replaceAll( /\[(.+?)]/g, '([$1])' )
				.replaceAll( '?', '([^/])' )
				.replaceAll( '*', '([^/]*)' )
				.replaceAll( '\\', '\\\\' )

			regExpCompiled = new RegExp( `^${regExpPattern}$` )
		} else {
			throw new OSCTypeError( 'must supply a pattern' )
		}

		const matches = regExpCompiled.exec( this.#value )

		return ( matches === null ) ?
			null :
			{
				address : matches[0],
				matches : matches.slice( 1 ),
			}
	}
}

// MARK: Error Classes
/** Error encountered when trying to encode buffer data */
export class OSCDecodeError extends TypeError {
	constructor( message : string, opts ? : ErrorOptions ) { super( message, opts ) }
}

/** Error encountered when testing data */
export class OSCTypeError extends TypeError {
	constructor( message : string, opts ? : ErrorOptions ) { super( message, opts ) }
}
