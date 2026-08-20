/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - X32 Information Data */
/// <reference types="node" />
/// <reference types="jest" />

import { X32Cue, X32Scene, X32Snippet, X32Error } from '../src/x32/types'

describe( 'data update classes operate as expected', () => {
	describe( 'snippet class', () => {
		test( 'bad index', () => {
			expect( () => new X32Snippet( 'blah' ) )
				.toThrow( X32Error )
		} )
		test( 'no title', () => {
			const x = new X32Snippet( '000' )
			expect( x.index ).toEqual( 0 )
			expect( x.zIndex ).toEqual( '000' )
			expect( x.title ).toEqual( '' )
		} )
		test( 'title', () => {
			const x = new X32Snippet( '000', 'hello' )
			expect( x.index ).toEqual( 0 )
			expect( x.zIndex ).toEqual( '000' )
			expect( x.title ).toEqual( 'hello' )
		} )
	} )
	describe( 'scene class', () => {
		test( 'bad index', () => {
			expect( () => new X32Scene( 'blah' ) )
				.toThrow( X32Error )
		} )
		test( 'no title', () => {
			const x = new X32Scene( '001' )
			expect( x.index ).toEqual( 1 )
			expect( x.zIndex ).toEqual( '001' )
			expect( x.title ).toEqual( '' )
			expect( x.note ).toEqual( '' )
		} )
		test( 'title, no note', () => {
			const x = new X32Scene( '001', 'hello' )
			expect( x.index ).toEqual( 1 )
			expect( x.zIndex ).toEqual( '001' )
			expect( x.title ).toEqual( 'hello' )
			expect( x.note ).toEqual( '' )
		} )
		test( 'title, note', () => {
			const x = new X32Scene( '010', 'hello', 'there' )
			expect( x.index ).toEqual( 10 )
			expect( x.zIndex ).toEqual( '010' )
			expect( x.title ).toEqual( 'hello' )
			expect( x.note ).toEqual( 'there' )
		} )
	} )
	describe( 'cue class', () => {
		test( 'bad index', () => {
			expect( () => new X32Cue( 'blah', '100' ) )
				.toThrow( X32Error )
		} )
		test( 'bad index', () => {
			expect( () => new X32Cue( '001', 'blah' ) )
				.toThrow( X32Error )
		} )
		test( 'bad skip', () => {
			// @ts-expect-error testing fun.
			expect( () => new X32Cue( '001', '100', 'hello', null ) ).toThrow( X32Error )
		} )
		test( 'empty', () => {
			const x = new X32Cue( '001', '100' )
			expect( x.index ).toEqual( 1 )
			expect( x.zIndex ).toEqual( '001' )
			expect( x.title ).toEqual( '' )
			expect( x.skip ).toEqual( false )
			expect( x.scene ).toEqual( -1 )
			expect( x.snippet ).toEqual( -1 )
			expect( x.number ).toEqual( '1.0.0' )
		} )
		test( 'full', () => {
			// @ts-expect-error checking errors
			const x = new X32Cue( '021', '1234', 'hello', '1', '02', 12 )
			expect( x.index ).toEqual( 21 )
			expect( x.zIndex ).toEqual( '021' )
			expect( x.title ).toEqual( 'hello' )
			expect( x.skip ).toEqual( true )
			expect( x.scene ).toEqual( 2 )
			expect( x.snippet ).toEqual( 12 )
			expect( x.number ).toEqual( '12.3.4' )
		} )
		test( 'full 2', () => {
			// @ts-expect-error checking errors
			const x = new X32Cue( '021', '1234', 'hello', 1, '02', 12 )
			expect( x.index ).toEqual( 21 )
			expect( x.zIndex ).toEqual( '021' )
			expect( x.title ).toEqual( 'hello' )
			expect( x.skip ).toEqual( true )
			expect( x.scene ).toEqual( 2 )
			expect( x.snippet ).toEqual( 12 )
			expect( x.number ).toEqual( '12.3.4' )
		} )
	} )
} )
