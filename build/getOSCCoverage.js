const x32 = require('../lib/x32_preprocessors.js')
const fs = require('node:fs')
const path = require('node:path')

const coverageLines = [
	'### Standard OSC Messages by subtype\n'
]

for ( const thisItem of Object.keys(x32.regular) ) {
	const itemRegex = x32.regular[thisItem].regEx.toString()
		.replaceAll('\\d{2}', '[##]')
		.replaceAll('\\d', '[#]')
		.replaceAll('\\/', '/')
		.replace(/^\/\^/, '')
		.replace(/\$\/$/, '')
	coverageLines.push(`+ __${thisItem}__ :: ${itemRegex}`)
}

coverageLines.push('\n### `node` OSC Messages by subtype\n')

for ( const thisItem of Object.keys(x32.node) ) {
	const itemRegex = x32.node[thisItem].regEx.toString()
		.replaceAll('\\d{3}', '[###]')
		.replaceAll('\\d{2}', '[##]')
		.replaceAll('\\d', '[#]')
		.replaceAll('\\/', '/')
		.replace(/^\/\^/, '')
		.replace(/\$\/$/, '')
	coverageLines.push(`+ __${thisItem}__ :: node ${itemRegex}`)
}

fs.writeFileSync(path.join(__dirname, 'osc-coverage.hbs'), coverageLines.join('\n'))