/* eslint-disable @typescript-eslint/no-require-imports */
const {buildDocumentation} = require('tsdoc-markdown')
const fs   = require('node:fs')
const path = require('node:path')
const x32  = require('../dist/lib/x32_preprocessors.js')

const mainDoc = buildDocumentation({
	inputFiles : ['../src/index.ts'],
	buildOptions : {
		types : true,
		repo : {
			url : 'https://github.com/jtsage/node-simple-osc-lib',
		},
	},
})

const x32Doc = buildDocumentation({
	inputFiles : ['../src/x32.ts'],
	buildOptions : {
		types : true,
		repo : {
			url : 'https://github.com/jtsage/node-simple-osc-lib',
		},
	},
})

let template = fs.readFileSync(path.join(__dirname, 'readme_template.md'), 'utf8')

const mdOut = []

mdOut.push('## Main Class')
for ( const item of mainDoc ) {
	if ( item.name === 'simpleOscLib' ) {
		mdOut.push(`### ${item.name}\n`, item.documentation, '\n#### Methods')
		for ( const meth of item.methods ) {
			mdOut.push(`\n##### ${meth.name}`, `\n_${meth.type}_\n`, meth.documentation, '\n---\n')
		}
	}
}

mdOut.push('## Return Classes')

for ( const item of mainDoc ) {
	if ( item.name === 'OSCMessage' || item.name === 'OSCBundle' ) {
		mdOut.push(`### ${item.name}\n`, item.documentation, '\n|Name|Type|Description|', '|---|---|---|')
		for ( const [idx, prop] of item.properties.entries() ) {
			const texts = item.jsDocs[idx].text
			mdOut.push(`|${prop.name}|_${prop.type}_|${texts[texts.length - 1].text.substring(2)}|`)
		}
		mdOut.push('\n---\n')
	}
}



const coverageLines = [
	'### Standard OSC Messages by subtype\n'
]

for ( const thisItem of Object.keys(x32.regular) ) {
	const itemRegex = x32.regular[thisItem].regEx.toString()
		.replaceAll('\\d{3}', '[###]')
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

const x32Out = []

x32Out.push('## X32 Class')
for ( const item of x32Doc ) {
	if ( item.name === 'x32PreProcessor' ) {
		x32Out.push(`### ${item.name}\n`, item.documentation, '\n#### Methods')
		for ( const meth of item.methods ) {
			x32Out.push(`\n##### ${meth.name}`, `\n_${meth.type}_\n`, meth.documentation, '\n---\n')
		}
	}
}

template = template.replace('{{>main}}', mdOut.join('\n'))
template = template.replace('{{>osc-coverage}}', coverageLines.join('\n'))
template = template.replace('{{>x32}}', x32Out.join('\n'))


fs.writeFileSync(path.join(__dirname,  '..', 'README.md'), template, 'utf-8')