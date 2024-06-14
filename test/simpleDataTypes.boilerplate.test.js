const osc = require('../index.js')

const oscRegular = new osc.simpleOscLib()

describe('boilerplate', () => {
	test('invalid encode type (char)', () => {
		expect(() => oscRegular.encodeBufferChunk('x', '')).toThrow(RangeError)
	})
	test('invalid encode type (string)', () => {
		expect(() => oscRegular.encodeBufferChunk('badType', '')).toThrow(RangeError)
	})
	test('invalid decode type (char)', () => {
		expect(() => oscRegular.decodeBufferChunk('x', Buffer.alloc(0))).toThrow(RangeError)
	})
	test('invalid decode type (string)', () => {
		expect(() => oscRegular.decodeBufferChunk('badType', Buffer.alloc(0))).toThrow(RangeError)
	})
})
