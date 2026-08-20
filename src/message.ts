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

type OSCMessageArg = type.OSCArgument | type.OSCArgObject
export type OSCMessageArgs = OSCMessageArg | OSCMessageArgs[]

export class OSCMessage {
	#address ! : type.OSCAddress
	#args      : type.OSCArguments[] = []

	constructor( address : string, args ? : OSCMessageArgs[]  ) {
		this.address = address
		if ( typeof args !== 'undefined' ) {
			this.args = args
		}
	}

	match( pattern : string | RegExp ) { return this.#address.match( pattern ) }

	toJSON() {
		return {
			address  : this.address,
			elements : this.args,
			type     : 'message',
		}
	}

	get debug() {
		const strings = []

		strings.push( this.#address.debug )

		if ( this.#args.length !== 0 ) {
			const result = this.#argBuffer( this.#args, true )
			const argList = new type.OSCTypeString( `,${result.types.join( '' )}` )
			strings.push( argList.debug, ...result.debugs )
		}

		return strings.join( '\xA6' )
	}

	get args() { return this.#args }
	set args( v : OSCMessageArgs[] ) {
		this.#args.length = 0
		if ( ! Array.isArray( v ) ) {
			throw new type.OSCTypeError( 'argument array expected' )
		}
		this.#args = v.map( ( item ) => this.#addArg( item ) )
	}

	#addArg( v : OSCMessageArgs ) : type.OSCArguments {
		if ( Array.isArray( v ) ) {
			return v.map( ( item ) => this.#addArg( item ) )
		} else if ( v instanceof type.OSCArg ) {
			return v
		} else if ( typeof v === 'object' && typeof v.type === 'string' && typeof v.value !== 'undefined' ) {
			return type.OSCType.fromObject( v )
		}

		throw new type.OSCTypeError( 'unknown argument type' )
	}

	set address( address : string ) { this.#address = new type.OSCAddress( address ) }
	get address() { return this.#address.value }

	#argBuffer( v : type.OSCArguments[], debug = false ) {
		const theseBuffers : Buffer<ArrayBuffer>[] = []
		const theseTypes   : string[] = []
		const theseDebugs  : string[] = []

		for ( const item of v ) {
			if ( Array.isArray( item ) ) {
				const result = this.#argBuffer( item )
				if ( debug ) {
					theseDebugs.push( ...result.debugs )
				}
				theseBuffers.push( ...result.buffers )
				theseTypes.push( '[', ...result.types, ']' )
			} else {
				if ( debug ) {
					theseDebugs.push( item.debug )
				}
				theseBuffers.push( item.buffer )
				theseTypes.push( item.typeChar )
			}
		}

		return {
			buffers : theseBuffers,
			debugs  : theseDebugs,
			types   : theseTypes,
		}
	}

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
			return new OSCMessage( buffer_in.toString( 'utf8' ) )
		}

		const address = type.OSCAddress.fromBuffer( buffer_in.subarray( 0, first_pos ) )

		let remain = buffer_in.subarray( first_pos )

		if ( remain.length === 0 ) {
			return new OSCMessage( address.value )
		}

		const type_pos = this.#getFourByte( remain )

		const types = type.OSCTypeString.fromBuffer( remain.subarray( 0, type_pos ) )

		remain = remain.subarray( type_pos )

		const argStack : ArgStack[] = []
		const parentStack = []
		let pid           = null
		let stackHeight   = 0

		for ( const [idx, typeChar] of [...types.value].entries() ) {
			switch ( typeChar ) {
				case ',' : continue
				case '[' :
					stackHeight++
					argStack.push( { i : idx, p : pid } )
					pid = idx
					parentStack.push( idx )
					break
				case ']' :
					stackHeight--
					if ( stackHeight < 0 ) {
						throw new type.OSCDecodeError( 'array nesting mis-match' )
					}
					parentStack.pop()
					if ( parentStack.length !== 0 ) {
						pid = parentStack[parentStack.length - 1]
					} else {
						pid = null
					}
					break
				case 'b' : { // 'blob',
					const bufLength = type.OSCTypeInteger.fromBuffer( remain.subarray( 0, 4 ) )
					remain = remain.subarray( 4 )
					argStack.push( { i : idx, p : pid, v : new type.OSCTypeBlob( remain.subarray( 0, bufLength.value ) ) } )
					remain = remain.subarray( bufLength.value )
					break
				}
				case 'c' : // 'char',
					argStack.push( { i : idx, p : pid, v : type.OSCTypeChar.fromBuffer( remain.subarray( 0, 4 ) ) } )
					remain = remain.subarray( 4 )
					break
				case 'd' : // 'double',
					argStack.push( { i : idx, p : pid, v : type.OSCTypeDouble.fromBuffer( remain.subarray( 0, 8 ) ) } )
					remain = remain.subarray( 8 )
					break
				case 'F' : // 'false',
					argStack.push( { i : idx, p : pid, v : new type.OSCTypeFalse() } )
					break
				case 'f' : // 'float',
					argStack.push( { i : idx, p : pid, v : type.OSCTypeFloat.fromBuffer( remain.subarray( 0, 4 ) ) } )
					remain = remain.subarray( 4 )
					break
				case 'h' : // 'bigint',
					argStack.push( { i : idx, p : pid, v : type.OSCTypeBigInt.fromBuffer( remain.subarray( 0, 8 ) ) } )
					remain = remain.subarray( 8 )
					break
				case 'I' : // 'bang',
					argStack.push( { i : idx, p : pid, v : new type.OSCTypeBang() } )
					break
				case 'i' : // 'integer',
					argStack.push( { i : idx, p : pid, v : type.OSCTypeInteger.fromBuffer( remain.subarray( 0, 4 ) ) } )
					remain = remain.subarray( 4 )
					break
				case 'm' : // 'midi',
					argStack.push( { i : idx, p : pid, v : type.OSCTypeMidi.fromBuffer( remain.subarray( 0, 4 ) ) } )
					remain = remain.subarray( 4 )
					break
				case 'N' : // 'null',
					argStack.push( { i : idx, p : pid, v : new type.OSCTypeNull() } )
					break
				case 'r' : // 'color',
					argStack.push( { i : idx, p : pid, v : type.OSCTypeColor.fromBuffer( remain.subarray( 0, 4 ) ) } )
					remain = remain.subarray( 4 )
					break
				case 's' : {// 'string',
					const str_pos = this.#getFourByte( remain )
					argStack.push( { i : idx, p : pid, v : type.OSCTypeString.fromBuffer( remain.subarray( 0, str_pos ) ) } )
					remain = remain.subarray( str_pos )
					break
				}
				case 'S' : { // 'symbol',
					const str_pos = this.#getFourByte( remain )
					argStack.push( { i : idx, p : pid, v : type.OSCTypeSymbol.fromBuffer( remain.subarray( 0, str_pos ) ) } )
					remain = remain.subarray( str_pos )
					break
				}
				case 'T' : // 'true',
					argStack.push( { i : idx, p : pid, v : new type.OSCTypeTrue() } )
					break
				default  :
					throw new type.OSCDecodeError( 'unsupported type' )
			}
		}

		if ( stackHeight > 0 ) {
			throw new type.OSCDecodeError( 'array nesting mis-match' )
		}

		return new OSCMessage(
			address.value,
			OSCMessage.#stripStacker( argStack )
		)
	}

	static #stripStacker( data : ArgStack[], topLevel = true ) : type.OSCArguments[] {
		if ( topLevel === true ) {
			for ( const item of data ) {
				item.nodes = data
					.filter( ( g ) => g.p === item.i )
			}
		}

		const thisArr : type.OSCArguments[] = []
		for ( const item of data ) {
			if ( topLevel === true && item.p !== null ) {
				continue
			}
			if ( typeof item.nodes !== 'undefined' && item.nodes.length !== 0 ) {
				thisArr.push( OSCMessage.#stripStacker( item.nodes, false ) )
			} else if ( typeof item.v !== 'undefined' ) {
				thisArr.push( item.v )
			}
		}
		return thisArr
	}
}

type ArgStack = {
	i       : number,
	p       : number | null | undefined,
	v     ? : type.OSCArgument,
	nodes ? : ArgStack[]
}
