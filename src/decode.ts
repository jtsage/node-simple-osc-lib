import { BufferDecodeResult, OSCArguments, OSCArgumentsShort, OSCColor, OSCDecodeError, OSCMidi, OSCOptions } from './types'

type decodeFunction = (
	b       : Buffer,
	options : OSCOptions
) => BufferDecodeResult

export const decodeBuffer = (
	type    : OSCArgumentsShort,
	buffer  : Buffer,
	options : OSCOptions
) => {
	let encodeType = type
	if ( type === 's' && options.stringAsSymbol === true ) {
		encodeType = 'S'
	}
	const decoder = decoders[encodeType]
	if ( !Buffer.isBuffer( buffer ) ) {
		throw new OSCDecodeError( 'buffer expected' )
	}
	if ( typeof decoder === 'undefined' ) {
		throw new OSCDecodeError( `Decoding function does not exist for type "${encodeType}"` )
	}
	return decoder( buffer, options )
}

const decodeResult = (
	arg : OSCArguments,
	buffer : Buffer<ArrayBufferLike>
) : BufferDecodeResult => {
	return {
		arg    : arg,
		remain : buffer,
	}
}

const decoders : Record<OSCArgumentsShort, decodeFunction> = {
	a  : function( b, options ) {
		const addressArray = decoders.s( b, options )
		const stringAddress = addressArray.arg.value

		if ( typeof stringAddress !== 'string' || stringAddress.length === 0 ) {
			throw new OSCDecodeError( 'address cannot be empty' )
		}
		if ( options.strictAddress && !stringAddress.startsWith( '/' ) ) {
			throw new OSCDecodeError( 'address must start with a slash' )
		}
		addressArray.arg.type = 'address'
		return addressArray
	},
	b  : function( b, options ) {
		if ( b.length < 8 ) {
			throw new OSCDecodeError( 'buffer too small for blob type' )
		}
		const dataLength = b.readUInt32BE()
		if ( b.length < dataLength + 4 ) {
			throw new OSCDecodeError( 'buffer underrun error' )
		}
		if ( b.length % 4 !== 0 && options.strictMode === true ) {
			throw new OSCDecodeError( 'buffer incorrect padding (not 4-byte)' )
		}

		const origBuffer = b.subarray( 4, 4 + dataLength )
		const chunkSize  = 4 + dataLength + ( 4 - ( dataLength % 4 ) )

		return decodeResult(
			{ type : 'blob', value : origBuffer },
			b.subarray( chunkSize )
		)
	},
	c  : function( b ) {
		if ( b.length < 4 ) {
			throw new OSCDecodeError( 'buffer too small for char type' )
		}
		const thisCharCode = b.readUInt32BE()
		if ( thisCharCode > 127 ) {
			throw new OSCDecodeError( 'expected single ASCII character' )
		}
		return decodeResult(
			{ type : 'char', value : String.fromCharCode( thisCharCode ) },
			b.subarray( 4 )
		)
	},
	d  : function( b ) {
		if ( b.length < 8 ) {
			throw new OSCDecodeError( 'buffer too small for float type' )
		}
		const thisNumber = b.readDoubleBE()
		return decodeResult(
			{ type  : 'double', value : thisNumber },
			b.subarray( 8 )
		)
	},
	f  : function( b ) {
		if ( b.length < 4 ) {
			throw new OSCDecodeError( 'buffer too small for float type' )
		}
		const thisNumber = b.readFloatBE()
		return decodeResult(
			{ type  : 'float', value : thisNumber },
			b.subarray( 4 )
		)
	},
	F  : function( b ) {
		return decodeResult(
			{ type : 'false', value : null },
			b
		)
	},
	h  : function( b ) {
		if ( b.length < 8 ) {
			throw new OSCDecodeError( 'buffer too small for bigint type' )
		}
		const thisNumber = BigInt( b.readBigInt64BE() )
		return decodeResult(
			{ type  : 'bigint', value : thisNumber },
			b.subarray( 8 )
		)
	},
	i  : function( b ) {
		if ( b.length < 4 ) {
			throw new OSCDecodeError( 'buffer too small for integer type' )
		}
		const thisNumber = b.readInt32BE()
		return decodeResult(
			{ type  : 'integer', value : thisNumber },
			b.subarray( 4 )
		)
	},
	I  : function( b ) {
		return decodeResult(
			{ type : 'bang', value : null },
			b
		)
	},
	m  : function( b ) {
		if ( b.length < 4 ) {
			throw new OSCDecodeError( 'buffer too small for midi type' )
		}
		const midiArray : OSCMidi = [
			b.readUInt8( 0 ),
			b.readUInt8( 1 ),
			b.readUInt8( 2 ),
			b.readUInt8( 3 )
		]

		return decodeResult(
			{ type  : 'midi', value : midiArray },
			b.subarray( 4 )
		)
	},
	N  : function( b ) {
		return decodeResult(
			{ type : 'null', value : null },
			b
		)
	},
	r  : function( b ) {
		if ( b.length < 4 ) {
			throw new OSCDecodeError( 'buffer too small for color type' )
		}
		const colorArray : OSCColor = [
			b.readUInt8( 0 ),
			b.readUInt8( 1 ),
			b.readUInt8( 2 ),
			b.readUInt8( 3 )
		]

		return decodeResult(
			{ type  : 'color', value : colorArray },
			b.subarray( 4 )
		)
	},
	s  : function( b, options ) : BufferDecodeResult {
		const rawString = b.toString( 'utf8' )
		const nullIndex = rawString.indexOf( '\u0000' )
		
		if ( nullIndex === -1 ) {
			if ( options.strictMode ) {
				throw new OSCDecodeError( 'osc string buffers must contain a null character' )
			}
			return {
				arg : {
					type  : 'string',
					value : rawString,
				},
				remain : Buffer.alloc( 0 ),
			}
		}

		const goodString = rawString.slice( 0, nullIndex )

		const buffLength = Buffer.byteLength( goodString )
		const splitPoint = ( 4 - ( buffLength % 4 ) ) + buffLength

		if ( options.asciiOnly && goodString !== '' && ( ! ( /^[ -~]+$/ ).test( goodString ) ) ) {
			throw new OSCDecodeError( 'strings must be ASCII only' )
		}

		if ( options.strictMode ) {
			for ( let i = Buffer.byteLength( goodString ); i < splitPoint; i++ ) {
				if ( b[i] !== 0 ) {
					throw new OSCDecodeError( 'incorrect string padding' )
				}
			}
		}
		
		return {
			arg : {
				type  : 'string',
				value : goodString,
			},
			remain : b.subarray( splitPoint ),
		}
	},
	S   : function( v, options ) {
		const returnValue = decoders.s( v, options )
		returnValue.arg.type = 'symbol'
		return returnValue
	},
	t  : function( b ) {
		if ( b.length < 8 ) {
			throw new OSCDecodeError( 'buffer too small for timetag type' )
		}
		const number1 = b.readUInt32BE()
		const number2 = b.readUInt32BE( 4 )
		return decodeResult(
			{ type  : 'timetag', value : [number1, number2] },
			b.subarray( 8 )
		)
	},
	T  : function( b ) : BufferDecodeResult {
		return decodeResult(
			{ type : 'true', value : null },
			b
		)
	},
}
