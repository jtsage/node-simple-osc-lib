/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - buildBundle */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}
const osc  = require('../index.js')

const oscRegular = new osc.simpleOscLib()

const bundleMsgPair = [
	{
		address : '/hello',
		args : [
			{ type : 'string', value : 'world' },
			{ type : 'integer', value : 20 },
		],
	},
	{
		address : '/goodnight',
		args : [
			{ type : 'string', value : 'moon' },
			{ type : 'integer', value : 69 },
		],
	},
]

describe('bundle testing', () => {
	describe('building', () => {
		test('build with non-object failse', () => {
			expect(() => oscRegular.buildBundle('hello')).toThrow(TypeError)
		})
		test('build with no timetag fails', () => {
			const thisBundle = {
				elements : bundleMsgPair,
			}
			expect(() => oscRegular.buildBundle(thisBundle)).toThrow(TypeError)
		})

		test('build with no messages fails', () => {
			const thisBundle = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : [],
			}
			expect(() => oscRegular.buildBundle(thisBundle)).toThrow(RangeError)
		})

		test('build with single message works', () => {
			const thisBundle = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : [bundleMsgPair[1]],
			}
			expect(oscRegular.buildBundle(thisBundle).length).toEqual(48)
		})

		test('build with multiple messages works', () => {
			const thisBundle = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : bundleMsgPair,
			}
			expect(oscRegular.buildBundle(thisBundle).length).toEqual(76)
		})

		test('build with nested works', () => {
			const thisBundle = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : bundleMsgPair,
			}
			const thisBundle2 = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : [oscRegular.buildBundle(thisBundle), ...bundleMsgPair],
			}
			expect(oscRegular.buildBundle(thisBundle2).length).toEqual(156)
		})
	})
	describe('reading', () => {
		test('read with no messages works', () => {
			const emptyBundle = Buffer.alloc(16)
			emptyBundle.write('#bundle')
			emptyBundle.writeUInt32BE(2222, 8)
			emptyBundle.writeUInt32BE(4444, 12)
			expect(JSON.stringify(oscRegular.readBundle(emptyBundle)).length).toEqual(72)
		})

		test('read with incorrect ID fail', () => {
			const emptyBundle = Buffer.alloc(16)
			emptyBundle.write('#blundl')
			emptyBundle.writeUInt32BE(2222, 8)
			emptyBundle.writeUInt32BE(4444, 12)
			expect(() => oscRegular.readBundle(emptyBundle)).toThrow(TypeError)
		})

		test('read with single message works', () => {
			const thisBundle = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : [bundleMsgPair[1]],
			}
			const thisBuffer = oscRegular.buildBundle(thisBundle)
			expect(JSON.stringify(oscRegular.readBundle(thisBuffer)).length).toEqual(189)
		})

		test('read with multiple messages works', () => {
			const thisBundle = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : bundleMsgPair,
			}
			const thisBuffer = oscRegular.buildBundle(thisBundle)
			expect(JSON.stringify(oscRegular.readBundle(thisBuffer)).length).toEqual(304)
		})

		test('build with nested works', () => {
			const thisBundle = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : bundleMsgPair,
			}
			const thisBundle2 = {
				timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
				elements : [oscRegular.buildBundle(thisBundle), ...bundleMsgPair],
			}
			const thisBuffer = oscRegular.buildBundle(thisBundle2)
			expect(JSON.stringify(oscRegular.readPacket(thisBuffer)).length).toEqual(609)
		})
	})
})
