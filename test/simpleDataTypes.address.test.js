const osc  = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})

describe('address type', () => {
	describe('encode', () => {
		test('low level encode address : non-string fail', () => {
			expect(() => oscRegular.encodeBufferChunk('A', 69)).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode address : unicode fail in normal mode', () => {
			expect(() => oscRegular.encodeBufferChunk('A', '/hi❤️')).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode address : unicode fail in strict mode', () => {
			expect(() => oscStrict.encodeBufferChunk('A', '/hi❤️')).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode address : no leading slash pass in standard mode', () => {
			const expected = Buffer.from(`hello${osc.null}${osc.null}${osc.null}`)

			expect(oscRegular.encodeBufferChunk('A', 'hello')).toEqual(expected)
		})

		test('low level encode address : no leading slash fail in strict mode', () => {
			expect(() => oscStrict.encodeBufferChunk('A', 'hello')).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode address : expected length met', () => {
			const expected = Buffer.from(`/hello${osc.null}${osc.null}`)

			expect(oscRegular.encodeBufferChunk('A', '/hello')).toEqual(expected)
		})

		test('fail to build message with no address', () => {
			const badPack = {
				args : [
					{ type : 'string', value : 'hi'}
				],
			}
			expect(() => oscRegular.buildMessage(badPack)).toThrow(RangeError)
		})

		test('fail to build message with empty address', () => {
			const badPack = {
				address : '',
				args : [
					{ type : 'string', value : 'hi'}
				],
			}
			expect(() => oscRegular.buildMessage(badPack)).toThrow(osc.OSCSyntaxError)
		})
	})

	describe('decode', () => {
		test('low level decode address : good address', () => {
			const input = Buffer.from(`/hello${osc.null}${osc.null}`)
			const expected = getSimpleExpected('address', '/hello')

			expect(oscRegular.decodeBufferChunk('A', input)).toEqual(expected)
		})

		test('low level decode address : no leading slash non strict pass', () => {
			const input = Buffer.from(`hello${osc.null}${osc.null}${osc.null}`)
			const expected = getSimpleExpected('address', 'hello')

			expect(oscRegular.decodeBufferChunk('A', input)).toEqual(expected)
		})

		test('low level decode address : no leading slash strict fail', () => {
			const input = Buffer.from(`hello${osc.null}${osc.null}${osc.null}`)

			expect(() => oscStrict.decodeBufferChunk('A', input)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode address : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => oscRegular.decodeBufferChunk('A', input)).toThrow(TypeError)
		})

	})
})
