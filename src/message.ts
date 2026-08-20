/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Simple OSC Communication Library
 *           OSC Message Type */

import * as type from './type'

export type OSCMessageArg = type.OSCArgument | type.OSCArgObject

export class OSCMessage {
	#address ! : type.OSCAddress
	#args      : type.OSCArgument[] = new ArgStackArray()

	// MARK: constructor
	/**
	 * Create an OSC Message
	 * @param address - Address string, ascii only
	 * @param args - array of OSCArguments, nesting accepted
	 */
	constructor( address : string, args ? : OSCMessageArg[]  ) {
		this.address = address
		if ( typeof args !== 'undefined' ) {
			this.args = args
		}
	}

	// MARK: match
	/**
	 * Match this message address against an OSC match pattern
	 * @param pattern - Pattern to match, following the 1.0 spec, or a pre-compiled RegExp
	 * @returns OSCMatchResult structure
	 */
	match( pattern : string | RegExp ) {
		const result = this.#address.match( pattern )
		return result === null ? null :
			{
				args : this.#args,
				...result,
			}
	}

	// MARK: toJSON
	/** For JSON.stringify() */
	toJSON() {
		return {
			address  : this.address,
			elements : this.args,
			type     : 'message',
		}
	}

	// MARK: debug
	/** Get a debug string of the buffer representation */
	get debug() {
		const strings = []

		strings.push( this.#address.debug )

		if ( this.#args.length !== 0 ) {
			const result = this.#argBuffer( this.#args, true )
			const argList = new type.OSCTypeString( `,${result.types.join( '' )}` )
			strings.push( argList.debug, ...result.debugs.filter( ( i ) => i !== '' ) )
		}

		return strings.join( '\xA6' )
	}

	// MARK: argList
	/** Get all arguments as a simple list */
	get argList() {
		return this.#args.filter( ( item ) => ! (
			item instanceof type.OSCTypeArrayOpen ||
			item instanceof type.OSCTypeArrayClose
		) )
	}

	// MARK: args
	/** OSC Message arguments */
	get args() { return this.#args }
	set args( v : OSCMessageArg[] ) {
		this.#args.length = 0
		if ( ! Array.isArray( v ) ) {
			throw new type.OSCTypeError( 'argument array expected' )
		}
		
		( this.#args as OSCMessageArg[] ).push( ...v )
	}

	// MARK: address
	/** String address for packet destination, ascii only */
	set address( address : string ) { this.#address = new type.OSCAddress( address ) }
	get address() { return this.#address.value }

	// MARK: #argBuffer
	#argBuffer( v : type.OSCArgument[], debug = false ) {
		const theseBuffers : Buffer<ArrayBuffer>[] = []
		const theseTypes   : string[] = []
		const theseDebugs  : string[] = []

		const arrayOpenTags  = v.filter( ( item ) => item instanceof type.OSCTypeArrayOpen ).length
		const arrayCloseTags = v.filter( ( item ) => item instanceof type.OSCTypeArrayClose ).length

		if ( arrayCloseTags !== arrayOpenTags ) {
			throw new type.OSCTypeError( 'incorrect array nesting' )
		}

		for ( const item of v ) {
			if ( debug ) {
				theseDebugs.push( item.debug )
			}
			theseBuffers.push( item.buffer )
			theseTypes.push( item.typeChar )
		}

		return {
			buffers : theseBuffers,
			debugs  : theseDebugs,
			types   : theseTypes,
		}
	}

	// MARK: buffer
	/** Buffer representation */
	get buffer() {
		const buffers = []

		buffers.push( this.#address.buffer )

		if ( this.#args.length !== 0 ) {
			const result = this.#argBuffer( this.#args )
			const argList = new type.OSCTypeString( `,${result.types.join( '' )}` )
			buffers.push( argList.buffer, ...result.buffers )
		}

		return Buffer.concat( buffers )
	}

	static #getFourByte( b : Buffer<ArrayBufferLike> ) {
		const first_null = b.indexOf( 0 )
		return first_null + ( 4 - ( first_null % 4 ) )
	}

	// MARK: fromBuffer
	/** Create a new message from a buffer representation */
	static fromBuffer( buffer_in : Buffer<ArrayBufferLike>, strict = false ) {
		if ( ! Buffer.isBuffer( buffer_in ) || buffer_in.length === 0 ) {
			throw new type.OSCDecodeError( 'buffer expected' )
		}

		if ( strict && buffer_in.length % 4 !== 0 ) {
			throw new type.OSCDecodeError( 'buffer is not a 4-byte multiple' )
		}
		
		if ( buffer_in.subarray( 0, 7 ).toString( 'utf8' ) === '#bundle' ) {
			throw new type.OSCDecodeError( 'buffer is a bundle' )
		}

		const first_pos = this.#getFourByte( buffer_in )

		if ( buffer_in.length < first_pos ) {
			return new OSCMessage( buffer_in.toString( 'utf8' ).replace( /\0+$/, '' ) )
		}

		const address = type.OSCAddress.fromBuffer( buffer_in.subarray( 0, first_pos ) )

		let remain = buffer_in.subarray( first_pos )

		if ( remain.length === 0 ) {
			return new OSCMessage( address.value )
		}

		const type_pos = this.#getFourByte( remain )

		const types = type.OSCTypeString.fromBuffer( remain.subarray( 0, type_pos ) )

		remain = remain.subarray( type_pos )

		const argStack : type.OSCArgument[] = []

		for ( const typeChar of types.value ) {
			switch ( typeChar ) {
				case ',' : continue
				case '[' :
					argStack.push( new type.OSCTypeArrayOpen )
					break
				case ']' :
					argStack.push( new type.OSCTypeArrayClose )
					break
				case 'b' : { // 'blob',
					const bufLength = type.OSCTypeInteger.fromBuffer( remain.subarray( 0, 4 ) )
					remain = remain.subarray( 4 )
					argStack.push( new type.OSCTypeBlob( remain.subarray( 0, bufLength.value ) ) )
					remain = remain.subarray( bufLength.value )
					break
				}
				case 'c' : // 'char',
					argStack.push( type.OSCTypeChar.fromBuffer( remain.subarray( 0, 4 ) ) )
					remain = remain.subarray( 4 )
					break
				case 'd' : // 'double',
					argStack.push( type.OSCTypeDouble.fromBuffer( remain.subarray( 0, 8 ) ) )
					remain = remain.subarray( 8 )
					break
				case 'F' : // 'false',
					argStack.push( new type.OSCTypeFalse() )
					break
				case 'f' : // 'float',
					argStack.push( type.OSCTypeFloat.fromBuffer( remain.subarray( 0, 4 ) ) )
					remain = remain.subarray( 4 )
					break
				case 'h' : // 'bigint',
					argStack.push( type.OSCTypeBigInt.fromBuffer( remain.subarray( 0, 8 ) ) )
					remain = remain.subarray( 8 )
					break
				case 'I' : // 'bang',
					argStack.push( new type.OSCTypeBang() )
					break
				case 'i' : // 'integer',
					argStack.push( type.OSCTypeInteger.fromBuffer( remain.subarray( 0, 4 ) ) )
					remain = remain.subarray( 4 )
					break
				case 'm' : // 'midi',
					argStack.push( type.OSCTypeMidi.fromBuffer( remain.subarray( 0, 4 ) ) )
					remain = remain.subarray( 4 )
					break
				case 'N' : // 'null',
					argStack.push( new type.OSCTypeNull() )
					break
				case 'r' : // 'color',
					argStack.push( type.OSCTypeColor.fromBuffer( remain.subarray( 0, 4 ) ) )
					remain = remain.subarray( 4 )
					break
				case 's' : {// 'string',
					const str_pos = this.#getFourByte( remain )
					argStack.push( type.OSCTypeString.fromBuffer( remain.subarray( 0, str_pos ) ) )
					remain = remain.subarray( str_pos )
					break
				}
				case 'S' : { // 'symbol',
					const str_pos = this.#getFourByte( remain )
					argStack.push( type.OSCTypeSymbol.fromBuffer( remain.subarray( 0, str_pos ) ) )
					remain = remain.subarray( str_pos )
					break
				}
				case 'T' : // 'true',
					argStack.push( new type.OSCTypeTrue() )
					break
				default  :
					throw new type.OSCDecodeError( 'unsupported type' )
			}
		}

		const arrayOpenTags  = argStack.filter( ( item ) => item instanceof type.OSCTypeArrayOpen ).length
		const arrayCloseTags = argStack.filter( ( item ) => item instanceof type.OSCTypeArrayClose ).length

		if ( arrayCloseTags !== arrayOpenTags ) {
			throw new type.OSCDecodeError( 'incorrect array nesting' )
		}

		return new OSCMessage(
			address.value,
			argStack
		)
	}

	// MARK: builder Functions
	/**
	 * Add an integer argument
	 * @param v - any integer
	 * @returns class instance, suitable for chaining
	 */
	i( v : number ) { this.#args.push( new type.OSCTypeInteger( v ) ); return this }
	integer = this.i
	
	/**
	 * Add a float argument
	 * @param v - any float
	 * @returns class instance, suitable for chaining
	 */
	f( v : number ) { this.#args.push( new type.OSCTypeFloat( v ) ); return this }
	float = this.f

	/**
	 * Add a string argument
	 * @param v - any string
	 * @returns class instance, suitable for chaining
	 */
	s( v : string ) { this.#args.push( new type.OSCTypeString( v ) ); return this }
	string = this.s
	
	/**
	 * Add a blob (binary) argument
	 * @param v - any buffer
	 * @returns class instance, suitable for chaining
	 */
	b( v : Buffer ) { this.#args.push( new type.OSCTypeBlob( v ) ); return this }
	blob = this.b

	/**
	 * Add an auto-typed value as an argument
	 * 
	 * Types supported:
	 * - any string is set to type "string" except the single characters '['  and ']'
	 * - integers are correctly identified.  12.0 is an integer
	 * - floats with decimal values are correctly identified. 12.0 is an integer, 12.2 is a float
	 * - true, false, null, and Infinity map to T,F,N, and I (bang)
	 * - Symbols with a name are encoded as strings, type 'symbol'
	 * - BigInts are correctly identified
	 * - Buffers are encoded as blobs
	 * @param v Any valid OSC type (almost)
	 * @returns class instance, suitable for chaining
	 */
	any( v : type.OSCArgument['value'] ) { this.#args.push( type.OSCType.fromValue( v ) ); return this}

}

// MARK: ArgStackArray
class ArgStackArray extends Array {
	push( ...args : OSCMessageArg[] ) {
		for ( const v of args ) {
			if ( v instanceof type.OSCArg ) {
				super.push( v )
			} else if ( typeof v === 'object' && typeof v.type === 'string' && typeof v.value !== 'undefined' ) {
				super.push( type.OSCType.fromObject( v ) )
			} else {
				throw new type.OSCTypeError( 'unknown argument type' )
			}
		}
		return this.length
	}

	unshift( ...args : OSCMessageArg[] ) {
		for ( const v of args ) {
			if ( v instanceof type.OSCArg ) {
				super.unshift( v )
			} else if ( typeof v === 'object' && typeof v.type === 'string' && typeof v.value !== 'undefined' ) {
				super.unshift( type.OSCType.fromObject( v ) )
			} else {
				throw new type.OSCTypeError( 'unknown argument type' )
			}
		}
		return this.length
	}
}
