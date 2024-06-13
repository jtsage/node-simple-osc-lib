const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		error         : null,
		type          : type,
		value         : value,
	}
}

describe('boilerplate', () => {
	test('invalid encode type (char)', () => {
		expect(() => osc.encodeToBuffer('x', '')).toThrow(RangeError)
	})
	test('invalid encode type (string)', () => {
		expect(() => osc.encodeToBuffer('badType', '')).toThrow(RangeError)
	})
	test('invalid decode type (char)', () => {
		expect(() => osc.decodeToArray('x', Buffer.alloc(0))).toThrow(RangeError)
	})
	test('invalid decode type (string)', () => {
		expect(() => osc.decodeToArray('badType', Buffer.alloc(0))).toThrow(RangeError)
	})
})

/* STRINGS */
describe('string type', () => {
	describe('encode', () => {
		test('low level encode string : non-string fail', () => {
			expect(() => osc.encodeToBuffer('s', 69)).toThrow(TypeError)
		})

		test('low level encode string : unicode pass in normal mode', () => {
			expect(() => osc.encodeToBuffer('s', '❤️')).not.toThrow(osc.OSCSyntaxError)
		})

		test('low level encode string : unicode fail in ascii only mode', () => {
			expect(() => osc.encodeToBuffer('s', '❤️', true)).toThrow(osc.OSCSyntaxError)
		})

		test('low level encode string : expected length met', () => {
			const expected = Buffer.from(`hello world${osc.null}`)

			expect(osc.encodeToBuffer('s', 'hello world')).toEqual(expected)
		})
	})

	describe('decode', () => {
		test('low level decode string : good string', () => {
			const input = Buffer.from(`hello world${osc.null}`)
			const expected = getSimpleExpected('string', 'hello world')

			expect(osc.decodeToArray('s', input)).toEqual(expected)
		})

		test('low level decode string : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => osc.decodeToArray('s', input, true)).toThrow(TypeError)
		})

		test('low level decode string : pass invalid end padding (non strict)', () => {
			const input = Buffer.from(`hello world${osc.null}${osc.null}`)
			const expected = getSimpleExpected('string', 'hello world', false)

			expect(osc.decodeToArray('s', input)).toEqual(expected)
		})

		test('low level decode string : fail on invalid end padding (strict)', () => {
			const input = Buffer.from(`he${osc.null}`)

			expect(() => osc.decodeToArray('s', input, true)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode string : fail on invalid interior padding (strict)', () => {
			const input = Buffer.from(`he${osc.null}ll${osc.null}${osc.null}${osc.null}`)

			expect(() => osc.decodeToArray('s', input, true)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode string : pair of strings', () => {
			const input = Buffer.from(`hel${osc.null}bye${osc.null}`)
			const expected = getSimpleExpected('string', 'hel', false)

			expect(osc.decodeToArray('s', input, true)).toEqual(expected)
		})
	})
})

/* INTEGERS */
describe('integer type', () => {
	describe('encode', () => {
		test('low level encode integer : string fail', () => {
			expect(() => osc.encodeToBuffer('i', 'hi')).toThrow(TypeError)
		})

		test('low level encode integer : float fail', () => {
			expect(() => osc.encodeToBuffer('i', 69.69)).toThrow(TypeError)
		})

		test('low level encode integer : good positive integer', () => {
			const expected = Buffer.alloc(4)
			expected.writeInt32BE(69)
			expect(osc.encodeToBuffer('i', 69)).toEqual(expected)
		})

		test('low level encode integer : good negative integer', () => {
			const expected = Buffer.alloc(4)
			expected.writeInt32BE(-23)
			expect(osc.encodeToBuffer('i', -23)).toEqual(expected)
		})
	})

	describe('decode', () => {
		test('low level decode integer : good positive integer', () => {
			const input = Buffer.alloc(4)
			input.writeInt32BE(69)
			const expected = getSimpleExpected('integer', 69)

			expect(osc.decodeToArray('i', input)).toEqual(expected)
		})

		test('low level decode integer : good negative integer', () => {
			const input = Buffer.alloc(4)
			input.writeInt32BE(-23)
			const expected = getSimpleExpected('integer', -23)

			expect(osc.decodeToArray('i', input)).toEqual(expected)
		})

		test('low level decode integer : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => osc.decodeToArray('i', input, true)).toThrow(TypeError)
		})

		test('low level decode integer : fail on buffer underrun', () => {
			const input = Buffer.alloc(3)
			
			expect(() => osc.decodeToArray('i', input)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode integer : good integer pair', () => {
			const number1 = Buffer.alloc(4)
			number1.writeInt32BE(-69)
			const number2 = Buffer.alloc(4)
			number2.writeInt32BE(23)
			const expected = getSimpleExpected('integer', -69, false)

			expect(osc.decodeToArray('i', Buffer.concat([number1, number2]))).toEqual(expected)
		})
	})
})

/* FLOATS */
describe('float type', () => {
	describe('encode', () => {
		test('low level encode float : string fail', () => {
			expect(() => osc.encodeToBuffer('f', 'hi')).toThrow(TypeError)
		})

		test('low level encode float : good float', () => {
			const expected = Buffer.alloc(4)
			expected.writeFloatBE(69.69)
			expect(osc.encodeToBuffer('f', 69.69)).toEqual(expected)
		})
	})
	describe('decode', () => {
		test('low level decode float : good float', () => {
			const input = Buffer.alloc(4)
			input.writeFloatBE(69.69)
			const expected = getSimpleExpected('float', expect.closeTo(69.69))

			expect(osc.decodeToArray('f', input)).toEqual(expected)
		})

		test('low level decode float : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => osc.decodeToArray('f', input, true)).toThrow(TypeError)
		})

		test('low level decode float : fail on buffer underrun', () => {
			const input = Buffer.alloc(3)
			
			expect(() => osc.decodeToArray('f', input)).toThrow(osc.OSCSyntaxError)
		})

		test('low level decode integer : good float pair', () => {
			const number1 = Buffer.alloc(4)
			number1.writeFloatBE(69.69)
			const number2 = Buffer.alloc(4)
			number2.writeFloatBE(23.23)
			const expected = getSimpleExpected('float', expect.closeTo(69.69), false)

			expect(osc.decodeToArray('f', Buffer.concat([number1, number2]))).toEqual(expected)
		})
	})
})


/* DOUBLE */
describe('double type', () => {
	describe('encode', () => {
		test('low level encode double : string fail', () => {
			expect(() => osc.encodeToBuffer('d', 'hi')).toThrow(TypeError)
		})

		test('low level encode double : good double', () => {
			const expected = Buffer.alloc(8)
			expected.writeDoubleBE(3.40282347e+40)
			expect(osc.encodeToBuffer('d', 3.40282347e+40)).toEqual(expected)
		})
	})
	describe('decode', () => {
		test('low level decode double : good double', () => {
			const input = Buffer.alloc(8)
			input.writeDoubleBE(3.40282347e+40)
			const expected = getSimpleExpected('double', expect.closeTo(3.40282347e+40))

			expect(osc.decodeToArray('d', input)).toEqual(expected)
		})

		test('low level decode double : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => osc.decodeToArray('d', input, true)).toThrow(TypeError)
		})

		test('low level decode double : fail on buffer underrun', () => {
			const input = Buffer.alloc(7)
			
			expect(() => osc.decodeToArray('d', input)).toThrow(osc.OSCSyntaxError)
		})

	})
})


/* FLAG */
describe('argument-less types', () => {
	describe('encode', () => {
		test.each([
			['T', 'true'],
			['F', 'false'],
			['N', 'null/nil'],
			['I', 'bang'],
		])('low level encode [%s] %s : empty zero length buffer', (a, _b) => {
			const expected = Buffer.alloc(0)
			expect(osc.encodeToBuffer(a, 'ignored value')).toEqual(expected)
		})
	})
	describe('decode', () => {
		test.each([
			['T', 'true', 'true'],
			['F', 'false', 'false'],
			['N', 'null/nil', 'null'],
			['I', 'bang', 'bang'],
		])('low level decode [%s] %s', (a, _b, expectType) => {
			const input    = Buffer.alloc(0)
			const expected = getSimpleExpected(expectType, null)
			expect(osc.decodeToArray(a, input)).toEqual(expected)
		})
	})
})

/* BLOBS */
describe('blobs', () => {
	test('round robin', () => {
		const inputString  = 'hello'
		const inputBuffer  = Buffer.from(inputString)
		const encodedBlock = osc.encodeToBuffer('b', inputBuffer)
		const decodedBlock = osc.decodeToArray('b', encodedBlock)

		const expected = getSimpleExpected('blob', inputBuffer)
		
		expect(decodedBlock).toEqual(expected)
	})
})

/* CHAR */

describe('char type', () => {
	describe('encode', () => {
		test('low level encode char : multi-char fail', () => {
			expect(() => osc.encodeToBuffer('c', 'hi')).toThrow(TypeError)
		})

		test('low level encode char : non-ascii fail', () => {
			expect(() => osc.encodeToBuffer('c', '❤️')).toThrow(TypeError)
		})

		test('low level encode char : good character', () => {
			const expected = Buffer.alloc(4)
			expected.writeUInt32BE('a'.charCodeAt(0))
			expect(osc.encodeToBuffer('c', 'a')).toEqual(expected)
		})
	})

	describe('decode', () => {
		test('low level decode char : good char', () => {
			const input = Buffer.alloc(4)
			input.writeUInt32BE('a'.charCodeAt(0))
			const expected = getSimpleExpected('char', 'a')

			expect(osc.decodeToArray('c', input)).toEqual(expected)
		})

		test('low level decode char : fail on non buffer', () => {
			const input = 'hi there'

			expect(() => osc.decodeToArray('c', input, true)).toThrow(TypeError)
		})

		test('low level decode char : fail on buffer underrun', () => {
			const input = Buffer.alloc(3)
			
			expect(() => osc.decodeToArray('c', input)).toThrow(osc.OSCSyntaxError)
		})
	})
})


describe('color', () => {
	test('round robin', () => {
		const inputArray   = [204, 170, 136, 255]
		const encodedBlock = osc.encodeToBuffer('r', inputArray)
		const decodedBlock = osc.decodeToArray('r', encodedBlock)

		const expected = getSimpleExpected('color', inputArray)
		
		expect(decodedBlock).toEqual(expected)
	})
})


