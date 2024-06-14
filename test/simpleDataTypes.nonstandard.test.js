const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const oscRegular = new osc.simpleOscLib()

describe('char type', () => {
	describe('encode', () => {
		test('low level encode char : multi-char fail', () => {
			expect(() => oscRegular.encodeBufferChunk('c', 'hi')).toThrow(TypeError)
		})

		test('low level encode char : non-ascii fail', () => {
			expect(() => oscRegular.encodeBufferChunk('c', '❤️')).toThrow(TypeError)
		})

		test('low level encode char : good character', () => {
			const expected = Buffer.alloc(4)
			expected.writeUInt32BE('a'.charCodeAt(0))
			expect(oscRegular.encodeBufferChunk('c', 'a')).toEqual(expected)
		})
	})

	describe('decode', () => {
		test('low level decode char : good char', () => {
			const input = Buffer.alloc(4)
			input.writeUInt32BE('a'.charCodeAt(0))
			const expected = getSimpleExpected('char', 'a')

			expect(oscRegular.decodeBufferChunk('c', input)).toEqual(expected)
		})

		test('low level decode char : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => oscRegular.decodeBufferChunk('c', input, true)).toThrow(TypeError)
		})

		test('low level decode char : fail on buffer underrun', () => {
			const input = Buffer.alloc(3)
			
			expect(() => oscRegular.decodeBufferChunk('c', input)).toThrow(osc.OSCSyntaxError)
		})
	})
})

describe('color', () => {
	test('round robin', () => {
		const inputArray   = [204, 170, 136, 255]
		const encodedBlock = oscRegular.encodeBufferChunk('r', inputArray)
		const decodedBlock = oscRegular.decodeBufferChunk('r', encodedBlock)

		const expected = getSimpleExpected('color', inputArray)
		
		expect(decodedBlock).toEqual(expected)
	})
})
