/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Simple OSC Communication Library */

export { OSCType }    from './type'
import { OSCMessage, OSCMessageArg } from './message'
import { OSCBundle, OSCBundleMessage }  from './bundle'
import { OSCDecodeError, OSCTimeTagCastable, OSCTypeError } from './type'

export { OSCBundle, OSCMessage, OSCTypeError, OSCDecodeError }
export type { OSCBundleMessage, OSCMessageArg, OSCTimeTagCastable }

export class OSCPacket {
	constructor() {
		throw new OSCTypeError(
			'using the OSCPacket constructor is forbidden, use OSCMessage or OSCBundle instead'
		)
	}

	static fromBuffer( buffer_in : Buffer<ArrayBufferLike>, strict = false ) {
		if ( ! Buffer.isBuffer( buffer_in ) || buffer_in.length === 0 ) {
			throw new OSCDecodeError( 'buffer expected' )
		}

		if ( strict && buffer_in.length % 4 !== 0 ) {
			throw new OSCDecodeError( 'buffer is not a 4-byte multiple' )
		}
		
		if ( buffer_in.subarray( 0, 7 ).toString( 'utf8' ) === '#bundle' ) {
			return OSCBundle.fromBuffer( buffer_in )
		}
		return OSCMessage.fromBuffer( buffer_in )
	}
}
