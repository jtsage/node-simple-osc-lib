const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})

describe('string type', () => {
	describe('encode', () => {
		test('low level encode string : non-string fail', () => {
			expect(() => oscRegular.encodeBufferChunk('s', 69)).toThrow(TypeError)
		})

		test('low level encode string : unicode pass in normal mode', () => {
			expect(() => oscRegular.encodeBufferChunk('s', '❤️')).not.toThrow(osc.OSCSyntaxError)
		})

		test('low level encode string : unicode fail in ascii only mode', () => {
			expect(() => oscStrict.encodeBufferChunk('s', '❤️')).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode string : expected length met', () => {
			const expected = Buffer.from(`hello world${osc.null}`)

			expect(oscRegular.encodeBufferChunk('s', 'hello world')).toEqual(expected)
		})
	})

	describe('decode', () => {
		test('low level decode string : good string', () => {
			const input = Buffer.from(`hello world${osc.null}`)
			const expected = getSimpleExpected('string', 'hello world')

			expect(oscRegular.decodeBufferChunk('s', input)).toEqual(expected)
		})

		test('low level decode string : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => oscRegular.decodeBufferChunk('s', input, true)).toThrow(TypeError)
		})

		test('low level decode string : pass invalid end padding (non strict)', () => {
			const input = Buffer.from(`hello world${osc.null}${osc.null}`)
			const expected = getSimpleExpected('string', 'hello world', false)

			expect(oscRegular.decodeBufferChunk('s', input)).toEqual(expected)
		})

		test('low level decode string : fail on invalid end padding (strict)', () => {
			const input = Buffer.from(`he${osc.null}`)

			expect(() => oscStrict.decodeBufferChunk('s', input)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode string : fail on invalid interior padding (strict)', () => {
			const input = Buffer.from(`he${osc.null}ll${osc.null}${osc.null}${osc.null}`)

			expect(() => oscStrict.decodeBufferChunk('s', input)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode string : pair of strings', () => {
			const input = Buffer.from(`hel${osc.null}bye${osc.null}`)
			const expected = getSimpleExpected('string', 'hel', false)

			expect(oscRegular.decodeBufferChunk('s', input, true)).toEqual(expected)
		})
	})
})
