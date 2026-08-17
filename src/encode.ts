/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Simple OSC Communication Library *
 *           Buffer Encoders */
import { OSCArgumentsShort, OSCArguments, OSCOptions, OSCEncodeError, BufferEncodeResult, OSCTimeTag, OSCArgumentStringToChar, OSCError, OSCTimeTagDelta } from './types'

type encodeFunction = (
	v       : OSCArguments['value'],
	options : OSCOptions
) => Buffer

/**
 * Encode an OSCArgument to a buffer
 * @internal
 * @param arg - OSCArgument to encode
 * @param options - OSCOptions (all)
 * @returns data buffer
 */
export const encodeBuffer = (
	arg     : OSCArguments,
	options : OSCOptions
) => {
	if ( typeof arg.type === 'undefined' || typeof arg.value === 'undefined' ) {
		throw new OSCEncodeError( 'unexpected argument type signature' )
	}

	let type = OSCArgumentStringToChar( arg.type )

	if ( type === 's' && options.stringAsSymbol ) {
		type = 'S'
	}

	const encoder = encoders[type]

	return {
		typeList : [type],
		buffer   : encoder( arg.value, options ),
		arg      : arg,
	} as BufferEncodeResult

}

const encoders : Record<OSCArgumentsShort, encodeFunction> = {
	a   : function( v, options ) { // address
		if ( typeof v !== 'string' || v.length === 0 ) {
			throw new OSCEncodeError( 'address must be a string, and cannot be empty' )
		}
		if ( options.strictAddress && !v.startsWith( '/' ) ) {
			throw new OSCEncodeError( 'address must start with a slash' )
		}
		if ( ! ( /^[\w!"$%&'()+-./:;<=>@^`|~]*$/ ).test( v ) ) {
			throw new OSCEncodeError( 'invalid characters in address' )
		}

		return encoders.s( v, options )
	},
	b   : function( v ) { // blob
		if ( ! Buffer.isBuffer( v ) ) {
			throw new OSCEncodeError( 'expected buffer' )
		}
		const inputSize    = v.length
		const totalSize    = 4 + inputSize + ( 4 - ( inputSize % 4 ) )
		
		const buffer_out = Buffer.alloc( totalSize )
		buffer_out.writeUInt32BE( inputSize )
		v.copy( buffer_out, 4 )

		return buffer_out
	},
	c   : function( v ) { //character
		if ( typeof v !== 'string' || v.length > 1 || v.charCodeAt( 0 ) > 127 ) {
			throw new OSCEncodeError( 'expected single ASCII character' )
		}

		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeUInt32BE( v.charCodeAt( 0 ) )
		return buffer_out
	},
	d   : function( v ) { // double
		if ( typeof v !== 'number' ) {
			throw new OSCEncodeError( 'expected number' )
		}
		const buffer_out = Buffer.alloc( 8 )
		buffer_out.writeDoubleBE( v )
		return buffer_out
	},
	f   : function( v )  { // float
		if ( typeof v !== 'number' ) {
			throw new OSCEncodeError( 'expected number' )
		}
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeFloatBE( v )
		return buffer_out
	},
	F   : function() { // false
		return Buffer.alloc( 0 )
	},
	h   : function( v ) { // bigint
		if ( typeof v !== 'bigint' ) {
			throw new OSCEncodeError( 'expected bigint' )
		}
		const buffer_out = Buffer.alloc( 8 )
		buffer_out.writeBigInt64BE( v )
		return buffer_out
	},
	I   : function() { // bang
		return Buffer.alloc( 0 )
	},
	i   : function( v ) { // integer
		if ( typeof v !== 'number' || ! Number.isInteger( v ) ) {
			throw new OSCEncodeError( 'expected integer' )
		}
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeInt32BE( v )
		return buffer_out
	},
	m   : function( v ) : Buffer {
		if ( !Array.isArray( v ) || v.length !== 4 ) {
			throw new OSCEncodeError( 'expected 4 element numeric array' )
		}

		const buffer_out = Buffer.alloc( 4 )

		for ( const [i, element] of v.entries() ) {
			if ( typeof element !== 'number' || !Number.isInteger( element ) ) {
				throw new OSCEncodeError( 'expected 4 element numeric array' )
			}
			switch ( i ) {
				case 0 : {
					if ( element < 0 || element > 255 ) {
						throw new OSCEncodeError( 'midi byte 1 out of range' )
					}
					break
				}
				case 1 : {
					if ( element < 128 || element > 255 ) {
						throw new OSCEncodeError( 'midi byte 2 (status) out of range' )
					}
					break
				}
				default : {
					if ( element < 0 || element > 127 ) {
						throw new OSCEncodeError( `midi byte ${i+1} (data) out of range` )
					}
					break
				}
			}
			buffer_out.writeUInt8( element, i )
		}
		return buffer_out
	},
	N   : function() { // null
		return Buffer.alloc( 0 )
	},
	r   : function( v ) : Buffer {
		if ( !Array.isArray( v ) || v.length !== 4 ) {
			throw new OSCEncodeError( 'expected 4 element numeric array' )
		}

		const buffer_out = Buffer.alloc( 4 )

		for ( const [i, element] of v.entries() ) {
			if ( typeof element !== 'number' || !Number.isInteger( element ) || element < 0 || element > 255 ) {
				throw new OSCEncodeError( 'expected 4 element numeric array' )
			}
			buffer_out.writeUInt8( element, i )
		}
		return buffer_out
	},
	s   : function( v, options ) { // string
		let value = v

		if ( options.coerceStrings ) {
			try {
				value = String( v )
			} catch( err ) {
				const e = err as Error
				throw new OSCEncodeError( e.message )
			}
		}

		if ( typeof value !== 'string' ) {
			throw new OSCEncodeError( 'expected string' )
		}

		if ( options.asciiOnly && ( ! ( /^[ -~]+$/ ).test( value ) ) ) {
			throw new OSCEncodeError( 'strings must be ASCII only' )
		}

		let padString = value

		const buffLength = Buffer.byteLength( value )
		const padLength  = 4 - ( buffLength % 4 )

		for ( let i = 0; i < padLength; i++ ) {
			padString += '\u0000'
		}

		return Buffer.from( padString )
	},
	S   : function( v, options ) {
		let encodeValue : string
		
		if ( typeof v === 'symbol' ) {
			const desc = v.description
			if ( typeof desc === 'string' ) {
				encodeValue = desc
			} else {
				throw new OSCEncodeError( 'unable to encode symbol' )
			}
		} else if ( typeof v === 'string' ) {
			encodeValue = v
		} else {
			throw new OSCEncodeError( 'unable to encode symbol' )
		}

		return encoders.s( encodeValue, options )
	},
	t   : function( v ) { // timetag
		if ( !Array.isArray( v ) || v.length !== 2 || typeof v[0] !== 'number' || typeof v[1] !== 'number' ) {
			throw new OSCEncodeError( 'expected timetag array' )
		}

		const buffer_out   = Buffer.alloc( 8 )

		buffer_out.writeUInt32BE( v[0] )
		buffer_out.writeUInt32BE( v[1], 4 )

		return buffer_out
	},
	T   : function() { // true
		return Buffer.alloc( 0 )
	},
}

/**
 * Create a time tag
 * @internal
 * @param v - value castable to a time tag
 * @returns 2 value numeric array
 */
export const makeTimeTag = ( v ? : OSCTimeTag | number | Date | OSCTimeTagDelta ) : OSCTimeTag => {
	if ( typeof v === 'undefined' ) {
		return timeTagFromSeconds( ( ( new Date() ).getTime() ) / 1000 )
	} else if ( Array.isArray( v ) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number' ) {
		return v
	} else if ( v instanceof Date ) { // specific date supplied
		return timeTagFromSeconds( v.getTime() / 1000 )
	} else if ( typeof v === 'number' ) { // raw seconds supplied
		return timeTagFromSeconds( v )
	} else if ( typeof v === 'string' && v.startsWith( '+' ) ) { // delta
		const num = parseInt( v.slice( 1 ) )
		if ( num.toString() !== v.slice( 1 ) ) {
			throw new OSCError( `unable to compute delta from value ${v} - must be +[ms]` )
		}
		return timeTagFromSeconds( ( ( ( new Date() ).getTime() ) + num ) / 1000 )
	}

	throw new OSCError( `unable to get timetag from supplied value ${v}` )
}

const TWO_POW_32 = 4294967296
const UNIX_EPOCH = 2208988800

const timeTagFromSeconds = ( v : number ) : OSCTimeTag => {
	const unixSeconds = Math.floor( v )
	const fracSeconds = v - unixSeconds
	
	return [
		unixSeconds + UNIX_EPOCH,
		Math.round( TWO_POW_32 * fracSeconds )
	]
}
