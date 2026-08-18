/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   X32 Processor */

import { OSCMessage }              from '../message'
import { matchers, X32ValidMatchers }                from './data'
import { converter }               from './nodeConvert'
import { X32DataRecord, X32Error } from './types'

/**
 * X32 Processing Class
 */
export class X32Processor {
	#useTests : X32ValidMatchers[] = []
	#scope    : string   = 'auxin,bus,mtx,ch,main,dca,fxrtn'
	failHard  : boolean  = false

	/**
	 * Create a reusable class to process X32 messages
	 * 
	 * scope is one or more of 'auxin', 'bus', 'mtx', 'ch', 'main', 'dca', 'fxrtn'
	 * useTest is one or more of 'faderReg', 'muteReg', 
	 * @param faderScope - scope of faders to match for, array of strings, null for all
	 * @param useTests - name of tests to use, null for all
	 * @param failHard - fail with an thrown error, otherwise return null
	 */
	constructor( faderScope : string[] | null = null, useTests : string[] | null = null, failHard = false ) {
		this.failHard = failHard
		if ( Array.isArray( faderScope ) ) {
			this.#scope = faderScope.join( ',' )
		}
		if ( ! Array.isArray( useTests ) ) {
			this.#useTests = Object.keys( matchers ) as X32ValidMatchers[]
		} else {
			this.#useTests = useTests as X32ValidMatchers[]
		}
	}

	process( msg : OSCMessage ) {
		if ( !msg.isSingle() ) {
			if ( this.failHard ) {
				throw new X32Error( 'the X32 does not send bundles' )
			}
			return null
		}

		let processMsg = msg

		if ( msg.type.address === 'node' ) {
			processMsg = converter( msg, this.failHard )
		}

		for ( const testKey of this.#useTests ) {
			const testItem = matchers[testKey]

			if ( typeof testItem === 'undefined' ) {
				throw new X32Error( 'invalid test specified' )
			}

			const matcherString = testItem.matcher( this.#scope )
			const msgMatches    = processMsg.match( matcherString )

			if ( ! Array.isArray( msgMatches ) || typeof msgMatches[0] === 'undefined' ) {
				continue
			}

			return testItem.processor( processMsg, msgMatches[0] )
		}
		return null
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
