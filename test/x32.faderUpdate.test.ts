/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - X32 Fader Level Data */
/// <reference types="node" />
/// <reference types="jest" />

import { X32FaderUpdate, X32FaderUpdateLevel, X32FaderUpdateMix, X32FaderUpdateMute, X32FaderUpdateName, X32Error } from '../src/x32/types'

describe( 'fader update classes operate as expected', () => {
	describe( 'base class', () => {
		test( 'bad scope', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32FaderUpdate( 'blah', 1, 'level' ) ).toThrow( X32Error )
		} )
		test( 'bad index', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32FaderUpdate( 'dca', null, 'level' ) ).toThrow( X32Error )
		} )
		test( 'bad index (non-numeric)', () => {
			expect( () => new X32FaderUpdate( 'dca', 'c', 'level' ) ).toThrow( X32Error )
		} )
		test( 'bad index (non-preset main)', () => {
			expect( () => new X32FaderUpdate( 'main', 'c', 'level' ) ).toThrow( X32Error )
		} )
		test( 'bad type', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32FaderUpdate( 'dca', 1, 'blah' ) ).toThrow( X32Error )
		} )
		test( 'index as number', () => {
			const x = new X32FaderUpdate( 'dca', 2, 'name' )
			expect( x.index ).toEqual( 2 )
			expect( x.zIndex ).toEqual( '02' )
		} )
		test( 'index as string', () => {
			const x = new X32FaderUpdate( 'dca', '05', 'name' )
			expect( x.index ).toEqual( 5 )
			expect( x.zIndex ).toEqual( '05' )
		} )
		test( 'index as string (main)', () => {
			const x = new X32FaderUpdate( 'main', 'st', 'name' )
			expect( x.index ).toEqual( 1 )
			expect( x.zIndex ).toEqual( '01' )
		} )
		test( 'index as string (main)', () => {
			const x = new X32FaderUpdate( 'main', 'm', 'name' )
			expect( x.index ).toEqual( 2 )
			expect( x.zIndex ).toEqual( '02' )
		} )
	} )
	describe( 'mute class', () => {
		test( 'bad value', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32FaderUpdateMute( 'dca', 1, null ) ).toThrow( X32Error )
		} )
		test( 'mute as number(1)', () => {
			const x = new X32FaderUpdateMute( 'dca', '05', 1 )
			expect( x.hasMute() ).toEqual( true )
			if ( x.hasMute() ) {
				expect( x.onBool ).toEqual( true )
				expect( x.onInt ).toEqual( 1 )
				expect( x.onText ).toEqual( 'ON' )
			}
			expect( x.hasLevel() ).toEqual( false )
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'mute as string(ON)', () => {
			const x = new X32FaderUpdateMute( 'dca', '05', 'ON' )
			expect( x.hasMute() ).toEqual( true )
			if ( x.hasMute() ) {
				expect( x.onBool ).toEqual( true )
				expect( x.onInt ).toEqual( 1 )
				expect( x.onText ).toEqual( 'ON' )
			}
			expect( x.hasLevel() ).toEqual( false )
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'mute as bool(true)', () => {
			const x = new X32FaderUpdateMute( 'dca', '05', true )
			expect( x.hasMute() ).toEqual( true )
			if ( x.hasMute() ) {
				expect( x.onBool ).toEqual( true )
				expect( x.onInt ).toEqual( 1 )
				expect( x.onText ).toEqual( 'ON' )
			}
			expect( x.hasLevel() ).toEqual( false )
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'mute as number(0)', () => {
			const x = new X32FaderUpdateMute( 'dca', '05', 0 )
			expect( x.hasMute() ).toEqual( true )
			if ( x.hasMute() ) {
				expect( x.onBool ).toEqual( false )
				expect( x.onInt ).toEqual( 0 )
				expect( x.onText ).toEqual( 'OFF' )
			}
			expect( x.hasLevel() ).toEqual( false )
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'mute as string(OFF)', () => {
			const x = new X32FaderUpdateMute( 'dca', '05', 'OFF' )
			expect( x.hasMute() ).toEqual( true )
			if ( x.hasMute() ) {
				expect( x.onBool ).toEqual( false )
				expect( x.onInt ).toEqual( 0 )
				expect( x.onText ).toEqual( 'OFF' )
			}
			expect( x.hasLevel() ).toEqual( false )
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'mute as boolean(false)', () => {
			const x = new X32FaderUpdateMute( 'dca', '05', false )
			expect( x.hasMute() ).toEqual( true )
			if ( x.hasMute() ) {
				expect( x.onBool ).toEqual( false )
				expect( x.onInt ).toEqual( 0 )
				expect( x.onText ).toEqual( 'OFF' )
			}
			expect( x.hasLevel() ).toEqual( false )
			expect( x.hasName() ).toEqual( false )
		} )
	} )
	describe( 'level class', () => {
		test( 'bad value', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32FaderUpdateLevel( 'dca', 1, null ) ).toThrow( X32Error )
		} )
		test( 'level as number(1)', () => {
			const x = new X32FaderUpdateLevel( 'dca', '05', 1.000 )
			expect( x.hasMute() ).toEqual( false )
			expect( x.hasLevel() ).toEqual( true )
			if ( x.hasLevel() ) {
				expect( x.level ).toEqual( 1 )
				expect( x.levelDb ).toEqual( '+10.0 dB' )
			}
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'level as number(0)', () => {
			const x = new X32FaderUpdateLevel( 'dca', '05', 0 )
			expect( x.hasMute() ).toEqual( false )
			expect( x.hasLevel() ).toEqual( true )
			if ( x.hasLevel() ) {
				expect( x.level ).toEqual( 0 )
				expect( x.levelDb ).toEqual( '-oo dB' )
			}
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'level as number(0.7498)', () => {
			const x = new X32FaderUpdateLevel( 'dca', '05', 0.7498 )
			expect( x.hasMute() ).toEqual( false )
			expect( x.hasLevel() ).toEqual( true )
			if ( x.hasLevel() ) {
				expect( x.level ).toEqual( 0.7498 )
				expect( x.levelDb ).toEqual( '+0.0 dB' )
			}
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'level as number(0), forceDb', () => {
			const x = new X32FaderUpdateLevel( 'dca', '05', 0, true )
			expect( x.hasMute() ).toEqual( false )
			expect( x.hasLevel() ).toEqual( true )
			if ( x.hasLevel() ) {
				expect( x.level ).toBeCloseTo( 0.7498, 1 )
				expect( x.levelDb ).toEqual( '+0.0 dB' )
			}
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'level as string(+10.0)', () => {
			const x = new X32FaderUpdateLevel( 'dca', '05', '+10.0' )
			expect( x.hasMute() ).toEqual( false )
			expect( x.hasLevel() ).toEqual( true )
			if ( x.hasLevel() ) {
				expect( x.level ).toBeCloseTo( 1, 1 )
				expect( x.levelDb ).toEqual( '+10.0 dB' )
			}
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'level as string(-oo dB)', () => {
			const x = new X32FaderUpdateLevel( 'dca', '05', '-oo dB' )
			expect( x.hasMute() ).toEqual( false )
			expect( x.hasLevel() ).toEqual( true )
			if ( x.hasLevel() ) {
				expect( x.level ).toEqual( 0 )
				expect( x.levelDb ).toEqual( '-oo dB' )
			}
			expect( x.hasName() ).toEqual( false )
		} )
	} )
	describe( 'name class', () => {
		test( 'bad value', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32FaderUpdateName( 'dca', 1, null ) ).toThrow( X32Error )
		} )
		test( 'good name', () => {
			const x = new X32FaderUpdateName( 'dca', '05', 'hi' )
			expect( x.hasMute() ).toEqual( false )
			expect( x.hasLevel() ).toEqual( false )
			expect( x.hasName() ).toEqual( true )
			if ( x.hasName() ) {
				expect( x.name ).toEqual( 'hi' )
			}
		} )
	} )
	describe( 'mix class', () => {
		test( 'bad value 1', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32FaderUpdateMix( 'dca', 1, null, 0 ) ).toThrow( X32Error )
		} )
		test( 'bad value 2', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32FaderUpdateMix( 'dca', 1, 'ON', null ) ).toThrow( X32Error )
		} )
		test( 'good stuff', () => {
			const x = new X32FaderUpdateMix( 'dca', '05', 'ON', 0 )
			expect( x.hasMute() ).toEqual( true )
			if ( x.hasMute() ) {
				expect( x.onBool ).toEqual( true )
				expect( x.onInt ).toEqual( 1 )
				expect( x.onText ).toEqual( 'ON' )
			}
			expect( x.hasLevel() ).toEqual( true )
			if ( x.hasLevel() ) {
				expect( x.level ).toEqual( 0 )
				expect( x.levelDb ).toEqual( '-oo dB' )
			}
			expect( x.hasName() ).toEqual( false )
		} )
		test( 'good stuff 2', () => {
			const x = new X32FaderUpdateMix( 'dca', '05', 'OFF', 0 )
			expect( x.hasMute() ).toEqual( true )
			if ( x.hasMute() ) {
				expect( x.onBool ).toEqual( false )
				expect( x.onInt ).toEqual( 0 )
				expect( x.onText ).toEqual( 'OFF' )
			}
			expect( x.hasLevel() ).toEqual( true )
			if ( x.hasLevel() ) {
				expect( x.level ).toEqual( 0 )
				expect( x.levelDb ).toEqual( '-oo dB' )
			}
			expect( x.hasName() ).toEqual( false )
		} )
	} )
} )
