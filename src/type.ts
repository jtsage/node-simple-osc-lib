


/** OSC Color - 4 element numeric array (0-255) (4-byte) */
export type OSCColorArray   = [ number, number, number, number ]

/** OSC Midi - 4 Byte */
export type OSCMidiArray    = [ number, number, number, number ]

/** OSC Time Tag - 8 byte. */
export type OSCTimeTagArray = [ number, number ]

/** Supported OSC arguments */
export type OSCArgObject =
	| { type : 'array';    value : OSCTypeInterface[] }
	| { type : 'bang';     value : null }
	| { type : 'bigint';   value : bigint }
	| { type : 'blob';     value : Buffer }
	| { type : 'char';     value : string }
	| { type : 'color';    value : OSCColorArray }
	| { type : 'double';   value : number }
	| { type : 'false';    value : null }
	| { type : 'float';    value : number }
	| { type : 'integer';  value : number }
	| { type : 'midi';     value : OSCMidiArray }
	| { type : 'null';     value : null }
	| { type : 'string';   value : string }
	| { type : 'symbol';   value : string }
	| { type : 'true';     value : null }


interface OSCTypeInterface {
	type     : string
	typeChar : string
	value    : unknown
	buffer   : Buffer<ArrayBufferLike>
	bufLen   : number
}




class OSCArg {
	constructor() {
		if ( new.target === OSCArg ) {
			throw new OSCTypeError( 'Cannot instantiate OSCArg directly. It is for type checking only.' )
		}
	}
}

export class OSCType {
	constructor() { throw new OSCTypeError( 'use fromObject or fromValue method' ) }

	static fromObject( v : OSCArgObject ) {
		if ( typeof v.type === 'undefined' || typeof v.value === 'undefined' ) {
			throw new OSCTypeError( 'incorrect object type' )
		}
		switch ( v.type ) {
			case 'bang'    : return new OSCTypeBang()
			case 'bigint'  : return new OSCTypeBigInt( v.value )
			case 'blob'    : return new OSCTypeBlob( v.value )
			case 'char'    : return new OSCTypeChar( v.value )
			case 'color'   : return new OSCTypeColor( v.value )
			case 'double'  : return new OSCTypeDouble( v.value )
			case 'false'   : return new OSCTypeFalse()
			case 'float'   : return new OSCTypeFloat( v.value )
			case 'integer' : return new OSCTypeInteger( v.value )
			case 'midi'    : return new OSCTypeMidi( v.value )
			case 'null'    : return new OSCTypeNull()
			case 'string'  : return new OSCTypeString( v.value )
			case 'symbol'  : return new OSCTypeSymbol( v.value )
			case 'true'    : return new OSCTypeTrue()
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
			
		if ( typeof v === 'number' && ( v === Number.POSITIVE_INFINITY || v === Number.NEGATIVE_INFINITY || v === Infinity ) ) {
			return new OSCTypeBang()
		}
		
		if ( typeof v === 'number' && Number.isInteger( v ) ) {
			return new OSCTypeInteger( v )
		}
		
		if ( typeof v === 'number' ) {
			return new OSCTypeFloat( v )
		}

		if ( typeof v === 'string' ) {
			return new OSCTypeString( v )
		}
		
		if ( Buffer.isBuffer( v ) ) {
			return new OSCTypeBlob( v )
		}
		
		throw new OSCTypeError( `autoTyping unavailable for "${typeof v}"` )
	}
}


/** Bang - 'bang', 'I', 0-byte null value */
export class OSCTypeBang extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get value()    { return null }
	get type()     { return 'bang' }
	get typeChar() { return 'I' }
	get buffer()   { return Buffer.alloc( 0 ) }
}

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
	get value()    { return this.#value }
	get type()     { return 'bigint' }
	get typeChar() { return 'h' }

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
	get type()     { return 'blob' }
	get typeChar() { return 'b' }

	get buffer() { // Includes required size tag
		const inputSize    = this.#value.length
		const totalSize    = 4 + inputSize + ( 4 - ( inputSize % 4 ) )
		
		const buffer_out = Buffer.alloc( totalSize )
		buffer_out.writeUInt32BE( inputSize )
		this.#value.copy( buffer_out, 4 )

		return buffer_out
	}
}

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
	get type()     { return 'char' }
	get typeChar() { return 'c' }

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
	get value()    { return this.#value }
	get type()     { return 'color' }
	get typeChar() { return 'r' }

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
	get value()    { return this.#value }
	get type()     { return 'double' }
	get typeChar() { return 'd' }

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

/** False - 'false', 'F', 0-byte null value */
export class OSCTypeFalse extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get value()    { return null }
	get type()     { return 'false' }
	get typeChar() { return 'F' }
	get buffer()   { return Buffer.alloc( 0 ) }
}

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
	get value()    { return this.#value }
	get type()     { return 'float' }
	get typeChar() { return 'f' }

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
	get value()    { return this.#value }
	get type()     { return 'integer' }
	get typeChar() { return 'i' }

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
	get value()    { return this.#value }
	get type()     { return 'midi' }
	get typeChar() { return 'm' }

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

/** Null - 'null', 'N', 0-byte null value */
export class OSCTypeNull extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get value()    { return null }
	get type()     { return 'null' }
	get typeChar() { return 'N' }
	get buffer()   { return Buffer.alloc( 0 ) }
}

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

	get bufLen()   { return Buffer.byteLength( this.#value ) }
	get value()    { return this.#value }
	get type()     { return 'string' }
	get typeChar() { return 's' }

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

/** Symbol - 'symbol', 'S', unknown 4-byte padded */
export class OSCTypeSymbol extends OSCTypeString implements OSCTypeInterface {
	get type()     { return 'symbol' }
	get typeChar() { return 'S' }
}

/** True - 'true', 'T', 0-byte null value */
export class OSCTypeTrue extends OSCArg implements OSCTypeInterface {
	get bufLen()   { return 0 }
	get value()    { return null }
	get type()     { return 'true' }
	get typeChar() { return 'T' }
	get buffer()   { return Buffer.alloc( 0 ) }
}

/** Error encountered when trying to encode buffer data */
export class OSCDecodeError extends TypeError {
	constructor( message : string, opts ? : ErrorOptions ) { super( message, opts ) }
}

/** Error encountered when testing data */
export class OSCTypeError extends TypeError {
	constructor( message : string, opts ? : ErrorOptions ) { super( message, opts ) }
}





// /** Array - 'array', '[]', 0-byte */
// export class OSCTypeArray extends OSCArg implements OSCTypeInterface {
// 	#value : OSCTypeInterface[] = []

// 	constructor( v : OSCTypeInterface[] ) { super(); this.value = v }

// 	push( v : OSCTypeInterface | OSCTypeInterface[] ) {
// 		if ( Array.isArray( v ) ) {
// 			for ( const item of v ) { this.push( item ) }
// 		} else if ( v instanceof OSCArg ) {
// 			this.#value.push( v )
// 		} else {
// 			throw new OSCTypeError( 'arrays can only contain OSCType* items' )
// 		}
// 	}

// 	set value( v : OSCTypeInterface[] ) {
// 		this.#value.length = 0
// 		for ( const item of v ) {
// 			if ( item instanceof OSCArg ) {
// 				this.#value.push( item )
// 			} else {
// 				throw new OSCTypeError( 'arrays can only contain OSCType* items' )
// 			}
// 		}
// 	}

// 	get bufLen()   { return 8 }
// 	get value()    { return this.#value }
// 	get type()     { return 'bigint' }
// 	get typeChar() {
// 		const chars = this.#value.map( ( item ) => item.typeChar )
// 		return `[${chars.join( '' )}]`
// 	}

// 	get buffer() {
// 		const buffers = this.#value.map( ( item ) => item.buffer )
// 		return Buffer.concat( buffers )
// 	}
// }