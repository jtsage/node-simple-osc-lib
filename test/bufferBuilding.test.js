const osc  = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		error         : null,
		type          : type,
		value         : value,
	}
}

/* ADDRESS */

describe('address type', () => {
	describe('encode', () => {
		test('low level encode address : non-string fail', () => {
			expect(() => osc.encodeToBuffer('A', 69)).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode address : unicode fail in normal mode', () => {
			expect(() => osc.encodeToBuffer('A', '/hi❤️')).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode address : unicode fail in strict mode', () => {
			expect(() => osc.encodeToBuffer('A', '/hi❤️', true)).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode address : no leading slash pass in standard mode', () => {
			const expected = Buffer.from(`hello${osc.null}${osc.null}${osc.null}`)

			expect(osc.encodeToBuffer('A', 'hello')).toEqual(expected)
		})

		test('low level encode address : no leading slash fail in strict mode', () => {
			expect(() => osc.encodeToBuffer('A', 'hello', true)).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode address : expected length met', () => {
			const expected = Buffer.from(`/hello${osc.null}${osc.null}`)

			expect(osc.encodeToBuffer('A', '/hello')).toEqual(expected)
		})
	})

	describe('decode', () => {
		test('low level decode address : good address', () => {
			const input = Buffer.from(`/hello${osc.null}${osc.null}`)
			const expected = getSimpleExpected('address', '/hello')

			expect(osc.decodeToArray('A', input)).toEqual(expected)
		})

		test('low level decode address : no leading slash non strict pass', () => {
			const input = Buffer.from(`hello${osc.null}${osc.null}${osc.null}`)
			const expected = getSimpleExpected('address', 'hello')

			expect(osc.decodeToArray('A', input)).toEqual(expected)
		})

		test('low level decode address : no leading slash strict fail', () => {
			const input = Buffer.from(`hello${osc.null}${osc.null}${osc.null}`)

			expect(() => osc.decodeToArray('A', input, true)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode address : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => osc.decodeToArray('A', input, true)).toThrow(TypeError)
		})

	})
})

describe('expected output from builder', () => {
	test('two strings with nested array (bang)', () => {
		const oscMessage = {
			address : '/hello',
			args    : [
				[[
					{type : 'bang', value : null },
		
				]],
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			],
		}
		const expected = Buffer.from(`/hello${osc.null}${osc.null},[[I]]ss${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}`)
		expect(osc.oscBuildMessage(oscMessage)).toEqual(expected)
	})

	test('fail on mismatched array read', () => {
		const input = Buffer.from(`/hello${osc.null}${osc.null},[[I]ss${osc.null}${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}`)
		expect(() => osc.oscReadMessage(input)).toThrow(osc.OSCSyntaxError)
	})

	test('fail on incorrect buffer length (strict)', () => {
		const input = Buffer.from(`/hello${osc.null}${osc.null},[[I]]ss${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}`)
		expect(() => osc.oscReadMessage(input, true)).toThrow(osc.OSCSyntaxError)
	})
	
})