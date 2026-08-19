import * as oscTypes from '../src/types'
import { OSCOptionsDefault } from '../src'

export const strictMode = {
	... OSCOptionsDefault,

	asciiOnly     : true,
	strictAddress : true,
	strictMode    : true,
}

export const symbolMode = {
	... OSCOptionsDefault,

	stringAsSymbol : true,
}

export const regularMode = OSCOptionsDefault

export const stringBuffer = ( size : number, content : string ) => {
	const buffer = Buffer.alloc( size )
	buffer.write( content )
	return buffer
}

export const getSimpleExpected = (
	value : oscTypes.OSCArguments,
	emptyBuffer = true
) => {
	return {
		arg    : value,
		remain : emptyBuffer ? Buffer.alloc( 0 ) : expect.any( Buffer ),
	}
}