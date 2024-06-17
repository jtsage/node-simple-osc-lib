/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - X32 Fader Level Conversion */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}

const osc_x32 = require('../x32.js')

const knownLevels = [
	[0.0000, '-oo dB'],
	[0.0010, '-89.5 dB'],
	[0.0196, '-80.6 dB'],
	[0.0303, '-75.5 dB'],
	[0.0411, '-70.3 dB'],
	[0.0518, '-65.1 dB'],
	[0.0616, '-60.4 dB'],
	[0.0899, '-55.6 dB'],
	[0.1232, '-50.3 dB'],
	[0.1515, '-45.8 dB'],
	[0.1877, '-40.0 dB'],
	[0.2141, '-35.7 dB'],
	[0.2454, '-30.7 dB'],
	[0.3060, '-25.5 dB'],
	[0.3734, '-20.1 dB'],
	[0.4301, '-15.6 dB'],
	[0.4946, '-10.4 dB'],
	[0.6188, '-5.2 dB'],
	[0.7478, '-0.1 dB'],
	[0.7488, '+0.0 dB'],
	[0.7498, '+0.0 dB'],
	[0.7507, '+0.0 dB'],
	[0.7517, '+0.1 dB'],
	[0.7761, '+1.0 dB'],
	[0.8006, '+2.0 dB'],
	[0.8250, '+3.0 dB'],
	[0.8495, '+4.0 dB'],
	[0.8749, '+5.0 dB'],
	[0.8993, '+6.0 dB'],
	[0.9756, '+9.0 dB'],
	[0.9990, '+10.0 dB'],
	[1.0000, '+10.0 dB'],
]

describe('level conversion operates as expected', () => {
	describe.each([
		['hi', false, true],
		[null, false, false],
		[[1], false, false],
		[{}, false, false],
		[0.2, true, true]
	])('Test input type', (a, b, c) => {
		if ( ! b ) {
			test(`float2db with ${typeof a} (${JSON.stringify(a)}) throws`, () => {
				expect(() => osc_x32.float2dB(a)).toThrow(TypeError)
			})
		} else {
			test(`float2db with ${typeof a} does not throw`, () => {
				expect(() => osc_x32.float2dB(a)).not.toThrow()
			})
		}

		if ( ! c ) {
			test(`dB2Float with ${typeof a} (${JSON.stringify(a)}) throws`, () => {
				expect(() => osc_x32.dB2Float(a)).toThrow(TypeError)
			})
		} else {
			test(`dB2Float with ${typeof a} does not throw`, () => {
				expect(() => osc_x32.dB2Float(a)).not.toThrow()
			})
		}
	})
	
	describe.each(knownLevels)('%f <--> %s', (a, b) => {
		test(`${a} <float> -> ${b}`, () => {
			expect(osc_x32.float2dB(a)).toEqual(b)
		})
		test(`${b} <string> -> ${a}`, () => {
			expect(osc_x32.dB2Float(b)).toBeCloseTo(a)
		})
		const dbFloat = b === '-oo dB' ? -90.0 : parseFloat(b.replace(' dB', ''))
		test(`${b} <float> -> ${a}`, () => {
			expect(osc_x32.dB2Float(dbFloat)).toBeCloseTo(a)
		})
	})
})
