const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const oscRegular = new osc.simpleOscLib()

describe('float type', () => {
	describe('encode', () => {
		test('low level encode float : string fail', () => {
			expect(() => oscRegular.encodeBufferChunk('f', 'hi')).toThrow(TypeError)
		})

		test('low level encode float : good float', () => {
			const expected = Buffer.alloc(4)
			expected.writeFloatBE(69.69)
			expect(oscRegular.encodeBufferChunk('f', 69.69)).toEqual(expected)
		})
	})
	describe('decode', () => {
		test('low level decode float : good float', () => {
			const input = Buffer.alloc(4)
			input.writeFloatBE(69.69)
			const expected = getSimpleExpected('float', expect.closeTo(69.69))

			expect(oscRegular.decodeBufferChunk('f', input)).toEqual(expected)
		})

		test('low level decode float : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => oscRegular.decodeBufferChunk('f', input, true)).toThrow(TypeError)
		})

		test('low level decode float : fail on buffer underrun', () => {
			const input = Buffer.alloc(3)
			
			expect(() => oscRegular.decodeBufferChunk('f', input)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode integer : good float pair', () => {
			const number1 = Buffer.alloc(4)
			number1.writeFloatBE(69.69)
			const number2 = Buffer.alloc(4)
			number2.writeFloatBE(23.23)
			const expected = getSimpleExpected('float', expect.closeTo(69.69), false)

			expect(oscRegular.decodeBufferChunk('f', Buffer.concat([number1, number2]))).toEqual(expected)
		})
	})
})

describe('double type', () => {
	describe('encode', () => {
		test('low level encode double : string fail', () => {
			expect(() => oscRegular.encodeBufferChunk('d', 'hi')).toThrow(TypeError)
		})

		test('low level encode double : good double', () => {
			const expected = Buffer.alloc(8)
			expected.writeDoubleBE(3.40282347e+40)
			expect(oscRegular.encodeBufferChunk('d', 3.40282347e+40)).toEqual(expected)
		})
	})
	describe('decode', () => {
		test('low level decode double : good double', () => {
			const input = Buffer.alloc(8)
			input.writeDoubleBE(3.40282347e+40)
			const expected = getSimpleExpected('double', expect.closeTo(3.40282347e+40))

			expect(oscRegular.decodeBufferChunk('d', input)).toEqual(expected)
		})

		test('low level decode double : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => oscRegular.decodeBufferChunk('d', input, true)).toThrow(TypeError)
		})

		test('low level decode double : fail on buffer underrun', () => {
			const input = Buffer.alloc(7)
			
			expect(() => oscRegular.decodeBufferChunk('d', input)).toThrow(osc.OSCSyntaxError)
		})

	})
})
