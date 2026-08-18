/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   X32 Processor */

import { OSCMessage } from '../message'
import { matchers } from './data'
import { converter } from './nodeConvert'
import { X32DataRecord, X32Error } from './types'

export class X32Processor {
	#useTests : string[] = []
	#scope    : string   = 'auxin,bus,mtx,ch,main,dca,fxrtn'
	failHard  : boolean  = false

	constructor( faderScope : string[] | null, useTests : string[] | null = null, failHard = false ) {
		this.failHard = failHard
		if ( Array.isArray( faderScope ) ) {
			this.#scope = faderScope.join( ',' )
		}
		if ( ! Array.isArray( useTests ) ) {
			this.#useTests = Object.keys( matchers )
		}
	}

	process( msg : OSCMessage ) {
		if ( !msg.isSingle() ) {
			throw new Error( 'the X32 does not send bundles' )
		}

		let processMsg = msg

		if ( msg.type.address === 'node' ) {
			processMsg = converter( msg, this.failHard )
		}

		for ( const testKey of this.#useTests ) {
			const testItem = matchers[testKey]

			if ( typeof testItem === 'undefined' ) {
				if ( this.failHard ) {
					throw new X32Error( 'invalid test specified' )
				}
				continue
			}

			const matcherString = testItem.matcher( this.#scope )
			const msgMatches    = processMsg.match( matcherString )

			if ( ! Array.isArray( msgMatches ) || typeof msgMatches[0] === 'undefined' ) {
				continue
			}

			return testItem.processor( processMsg, msgMatches[0] )
		}
	}

	batch( msgBatch : OSCMessage[] ) : X32DataRecord[] {
		const failHardSetting = this.failHard
		this.failHard = false

		const result = msgBatch
			.map( ( msg ) => this.process( msg ) )
			.filter( ( item ) => item !== null && typeof item !== 'undefined' )

		
		
		this.failHard = failHardSetting

		return result
	}
}
