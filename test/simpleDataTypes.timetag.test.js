/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - TIMETAG type */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}

const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const oscRegular = new osc.simpleOscLib()

const getTimeTagBuffer = () => {
	const buffer = Buffer.alloc(8)
	buffer.writeUInt32BE(3165615030)
	buffer.writeUInt32BE(536870912, 4)
	return buffer
}

describe('type :: TIMETAG', () => {
	describe('getDateFromTimeTagArray', () => {
		test.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'buffer', value : Buffer.alloc(4)},
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'object', value : {}},
			{ humanName : '!== 2 item array', value : [111]},
			{ humanName : 'non numeric 2 item array', value : [111, 'aaa']},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line no-unused-vars
		])('Test with $value ($humanName)', ({humanName, value}) => {
			expect(() => oscRegular.getDateFromTimeTagArray(value)).toThrow(RangeError)
		})
		test('get date 2000-04-25T01:30:30.125Z from [3165615030, 536870912]', () => {
			expect(oscRegular.getDateFromTimeTagArray([3165615030, 536870912]).toISOString()).toEqual('2000-04-25T01:30:30.125Z')
		})
	})
	describe('getTimeTagFromUnknownType', () => {
		test.each([
			{ input : new Date(Date.UTC(2000, 3, 25, 1, 30, 30, 125)), output : [3165615030, 536870912] },
			{ input : 956626230.125, output : [3165615030, 536870912] },
			{ input : [3165615030, 536870912], output : [3165615030, 536870912] },
		])('get value $output from $input', ({input, output}) => {
			expect(oscRegular.getTimeTagArrayFromUnknownType(input)).toEqual(output)
		})
	})
	describe('direct functions', () => {
		test('getTimeTagBufferFromTimestamp', () => {
			expect(oscRegular.getTimeTagBufferFromTimestamp(956626230.125)).toEqual(getTimeTagBuffer())
		})
		test('getTimeTagBufferFromDate', () => {
			expect(oscRegular.getTimeTagBufferFromDate(new Date(Date.UTC(2000, 3, 25, 1, 30, 30, 125)))).toEqual(getTimeTagBuffer())
		})
		test('getTimeTagBufferFromDelta', () => {
			expect(oscRegular.getTimeTagBufferFromDelta(
				125 / 1000,
				new Date(Date.UTC(2000, 3, 25, 1, 30, 30, 0))
			)).toEqual(getTimeTagBuffer())
		})
		test('getTimeTagBufferFromDelta (random)', () => {
			expect(oscRegular.getTimeTagBufferFromDelta(
				125 / 1000
			)).toEqual(expect.any(Buffer))
		})
	})
	describe('encodeBufferChunk', () => {
		test.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'buffer', value : Buffer.alloc(4)},
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'unicode', value : '❤️'},
			{ humanName : 'non-ascii', value : 'Ä'},
			{ humanName : 'object', value : {}},
			{ humanName : '!== 2 item array', value : [111]},
			{ humanName : 'non numeric 2 item array', value : [111, 'aaa']},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line no-unused-vars
		])('Test with $value ($humanName)', ({humanName, value}) => {
			expect(() => oscRegular.encodeBufferChunk('t', value)).toThrow(TypeError)
		})

		test.each([
			[new Date(2000, 3, 25, 1, 30, 30, 125), 8],
			[956640630.125, 8],
			[[3165615030, 536870912], 8],
		])('Test expected length %s -> %i', (a, b) => {
			expect(oscRegular.encodeBufferChunk('t', a).length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		test('good timetag', () => {
			const expected = getSimpleExpected('timetag', [3165615030, 536870912])
			expect(oscRegular.decodeBufferChunk('t', getTimeTagBuffer())).toEqual(expected)
		})
		test('non-buffer', () => {
			const input    = 'hello'
			expect(() => oscRegular.decodeBufferChunk('t', input)).toThrow(TypeError)
		})
		test('insufficiently padded buffer', () => {
			const input    = Buffer.alloc(7)
			expect(() => oscRegular.decodeBufferChunk('t', input)).toThrow(RangeError)
		})
		test('timetag pair (buffer leftover)', () => {
			const input = Buffer.alloc(12)
			input.writeUInt32BE(3165615030)
			input.writeUInt32BE(536870912, 4)
			input.write('bye', 8)
			const expected = getSimpleExpected('timetag', [3165615030, 536870912], false)
			const result = oscRegular.decodeBufferChunk('t', input)
			expect(result).toEqual(expected)
			expect(result.buffer_remain.length).toEqual(4)
		})
	})
})
