const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const oscRegular = new osc.simpleOscLib()

/* INTEGERS */
describe('integer type', () => {
	describe('encode', () => {
		test('low level encode integer : string fail', () => {
			expect(() => oscRegular.encodeBufferChunk('i', 'hi')).toThrow(TypeError)
		})

		test('low level encode integer : float fail', () => {
			expect(() => oscRegular.encodeBufferChunk('i', 69.69)).toThrow(TypeError)
		})

		test('low level encode integer : good positive integer', () => {
			const expected = Buffer.alloc(4)
			expected.writeInt32BE(69)
			expect(oscRegular.encodeBufferChunk('i', 69)).toEqual(expected)
		})

		test('low level encode integer : good negative integer', () => {
			const expected = Buffer.alloc(4)
			expected.writeInt32BE(-23)
			expect(oscRegular.encodeBufferChunk('i', -23)).toEqual(expected)
		})
	})

	describe('decode', () => {
		test('low level decode integer : good positive integer', () => {
			const input = Buffer.alloc(4)
			input.writeInt32BE(69)
			const expected = getSimpleExpected('integer', 69)

			expect(oscRegular.decodeBufferChunk('i', input)).toEqual(expected)
		})

		test('low level decode integer : good negative integer', () => {
			const input = Buffer.alloc(4)
			input.writeInt32BE(-23)
			const expected = getSimpleExpected('integer', -23)

			expect(oscRegular.decodeBufferChunk('i', input)).toEqual(expected)
		})

		test('low level decode integer : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => oscRegular.decodeBufferChunk('i', input, true)).toThrow(TypeError)
		})

		test('low level decode integer : fail on buffer underrun', () => {
			const input = Buffer.alloc(3)
			
			expect(() => oscRegular.decodeBufferChunk('i', input)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode integer : good integer pair', () => {
			const number1 = Buffer.alloc(4)
			number1.writeInt32BE(-69)
			const number2 = Buffer.alloc(4)
			number2.writeInt32BE(23)
			const expected = getSimpleExpected('integer', -69, false)

			expect(oscRegular.decodeBufferChunk('i', Buffer.concat([number1, number2]))).toEqual(expected)
		})
	})
})
