const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		error         : null,
		type          : type,
		value         : value,
	}
}

/* TIMETAG */

describe('timetag type', () => {
	describe('encode', () => {
		test('low level encode timetag : string fail', () => {
			expect(() => osc.encodeToBuffer('t', 'hi')).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode timetag : array to small fail', () => {
			expect(() => osc.encodeToBuffer('t', [1111])).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode timetag : good timetag array', () => {
			const expected = Buffer.alloc(8)
			expected.writeUInt32BE(1111)
			expected.writeUInt32BE(2222, 4)
			expect(osc.encodeToBuffer('t', [1111, 2222])).toEqual(expected)
		})

		test('low level encode timetag : good timetag timestamp', () => {
			const timeTagArray = osc.calcTimeTagFromSeconds(1718212376.57)
			const expected = Buffer.alloc(8)
			expected.writeUInt32BE(timeTagArray[0])
			expected.writeUInt32BE(timeTagArray[1], 4)
			expect(osc.encodeToBuffer('t', 1718212376.57)).toEqual(expected)
		})

		test('low level encode timetag : good timetag from date', () => {
			const testDate = new Date(2000, 3, 25, 13, 30, 0, 250)
			const timeTagArray = osc.calcTimeTagFromSeconds(testDate.getTime() / 1000)
			const expected = Buffer.alloc(8)
			expected.writeUInt32BE(timeTagArray[0])
			expected.writeUInt32BE(timeTagArray[1], 4)
			expect(osc.encodeToBuffer('t', testDate)).toEqual(expected)
		})
	})
	describe('decode', () => {
		test('low level decode timetag : good timetag from date', () => {
			const testDate = new Date(2000, 3, 25, 13, 30, 0, 250)
			const timeTagArray = osc.calcTimeTagFromSeconds(testDate.getTime() / 1000)
			const input = Buffer.alloc(8)
			input.writeUInt32BE(timeTagArray[0])
			input.writeUInt32BE(timeTagArray[1], 4)
			const expected = getSimpleExpected('timetag', [3165672600, 1073741824])

			expect(osc.decodeToArray('t', input)).toEqual(expected)
		})

		test('low level decode double : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => osc.decodeToArray('t', input, true)).toThrow(TypeError)
		})

		test('low level decode double : fail on buffer underrun', () => {
			const input = Buffer.alloc(7)
			
			expect(() => osc.decodeToArray('t', input)).toThrow(osc.OSCSyntaxError)
		})

		test('round robin date timetag : good timetag from date', () => {
			const testDate        = new Date(2000, 3, 25, 13, 30, 0, 250)
			const roundTripEncDec = osc.decodeToArray('t', osc.encodeToBuffer('t', testDate))
			const testDateString  = testDate.toISOString()

			expect(osc.getDateFromTimeTag(roundTripEncDec.value).toISOString()).toEqual(testDateString)
		})

		test('round robin date with delta : good timetag from date', () => {
			const fakeNow         = new Date(2000, 3, 25, 13, 30, 0, 250)
			const fakeInTen       = osc.generateTimeTagFromDelta(600, fakeNow.getTime() )
			const roundTripEncDec = osc.decodeToArray('t', fakeInTen)
			const timeIsNow       = fakeNow.getTime()
			const timeIsTen       = osc.getDateFromTimeTag(roundTripEncDec.value).getTime()
			const diffInSec       = (timeIsTen - timeIsNow) / 1000

			expect(diffInSec).toEqual(600)
		})

	})
})