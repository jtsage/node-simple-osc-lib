/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   X32 Node Message Converter */

import { OSCMessage, OSCMessageArg } from '../message'
import { X32Error }                  from './types'

export const converter = ( msg : OSCMessage, failHard = false ) : OSCMessage => {
	if ( msg.address !== 'node' ) {
		return msg
	}

	const nodeMessage = msg.args[0]?.value

	if ( typeof nodeMessage !== 'string' || nodeMessage.length === 0 ) {
		if ( failHard ) {
			throw new X32Error( 'unexpected empty node message' )
		}
		return msg
	}

	const result = nodeStringConverter( nodeMessage )

	if ( result === false ) {
		if ( failHard ) {
			throw new X32Error( 'unable to convert message' )
		}
		return msg
	}
	return result
}

const nodeStringConverter = ( message : string ) : false | OSCMessage => {
	const result = message.match( /^(\S+) (.+)$/ )

	if ( result === null || result.length !== 3 || typeof result[1] !== 'string' || typeof result[2] !== 'string' ) {
		return false
	}

	const args : OSCMessageArg[] = result[2].split( /\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/ ).map( ( item ) => {
		if ( item.match( /^[-0-9]+$/ ) ) {
			return { type : 'integer', value : parseInt( item, 10 ) }
		}
		if ( item === '""' ) {
			return { type : 'string', value : ''}
		}
		return {
			type  : 'string',
			value : item.replace( /^"*(.+?)"*$/, '$1' ),
		}
	} )

	return new OSCMessage(
		result[1],
		args
	)
}