![GitHub package.json version](https://img.shields.io/github/package-json/v/jtsage/node-simple-osc-lib) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jtsage/node-simple-osc-lib/node.js.yml) ![Coverage](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjtsage%2Fnode-simple-osc-lib%2Fmain%2Fcoverage%2Fcoverage-summary.json&query=%24.total.lines.pct&suffix=%25&label=coverage)

# simple-osc-lib

This package provides some node.js utilities for working with [OSC](http://opensoundcontrol.org/), a format for sound and systems control.  

Here we implement the OSC 1.1 specification.  OSC is a transport-independent protocol, so we don't provide any server objects, as you should be able to use OSC over any transport you like.  The most common is probably udp, but tcp is not unheard of.

This package was heavily influenced by the [osc-min](https://github.com/russellmcc/node-osc-min) API

## Differences from osc-min

+ no support for the message translation stuff
+ no support for parameter guessing in oscBuildMessage() or oscBuildBundle()
+ added `c` and `r` data types
+ zero-dependency package

## Input types

+ `s` :: `string` - string value (String padded to 32 bit block with nulls)
+ `f` :: `float` - numeric value (FloatBE - 32 bits)
+ `d` :: `double` - numeric value (DoubleBE - 64 bits)
+ `i` :: `integer` - numeric value (Int32BE - 32 bits)
+ `b` :: `blob` - node.js Buffer value (Buffer padded to 32 bit block with nulls)
+ `T` :: `true` - no value (0 bits)
+ `F` :: `false` - no value (0 bits)
+ `N` :: `null` - no value (0 bits)
+ `I` :: `bang` - no value (0 bits)
+ `r` :: `color` - RGBA as an array [R(0-255),G,B,A] (4 x UInt8 - 32 bits)
+ `c` :: `char` - Character (Int32BE - 32 bits)
+ `t` :: `timetag` - numeric value (pair of UInt32BE - 64 bits)
+ `A` :: `address` - non-stander string value, with special processing to ensure a valid osc address string (String padded to 32 bit block with nulls)

Note that `type` is always a string - i.e. `"true"` rather than `true`.

## Standard Usage

```javascript
const osc     = require('simple-osc-lib')

const oscRegular = new osc.simpleOscLib( /* options */)
```

### Build an OSC Single Message Buffer for sending

```javascript
const buffer = oscRegular.buildMessage({
    address : '/hello',
    args    : [
        { type : 'string', value : 'hi' },
        { type : 'string', value : 'there' },
    ],
})
```

### Build an OSC Bundle Buffer for sending

```javascript
const oscMessage1 = { address : '/hello', args : [...] }
const oscMessage2 = { address : '/goodbye', args : [...] }

// Generate a timetag half a second into the future
const timeTag = oscRegular.getTimeTagBufferFromDelta(0.5)

const buffer = oscRegular.buildBundle({
    timetag : timeTag,
    elements : [oscMessage1, oscMessage2],
})
```

### Decode an OSC Packet from receiving

```javascript
const oscMessage = oscRegular.readPacket(buffer)
```

Single message

```javascript
{
    type    : osc-message,
    address : /goodbye,
    args: [
        { type : 'string', value : 'cruel' },
        { type : 'string', value : 'world' }
    ]
}
```

Bundle (note that bundles can be nested)

```javascript
{
    type     : 'osc-bundle',
    timetag  : [ /* date Object */ ],
    elements : [ /* zero or more osc-messages or osc-bundles */ ]
}
```

## Return arguments

The type list above gives the text representation of what will appear in the `type` field of the `osc-message`. Additionally, arrays will be nested as such

```javascript
{
    type    : osc-message,
    address : /goodbye,
    args: [
        { type : 'array',  value : [
            { type : 'string', value : 'cruel' },
            { type : 'string', value : 'world' },
        ]},
    ]
}
```

## timetag Processing of Bundles

This package provides no pre-processing for timetags - they are returned as found, in all circumstances.  The OSC 1.1 spec does not clarify the proper handling of timetags in the past, as different implementations do different things with them. A timetag in the past may mean the bundle should be discarded, or it may mean it should be acted on immediately - this behavior is left to your preference. Please do not assume a received timetag refers to a future event.

## Overriding default options

Options are set when initializing the class - they can be accessed or changed at any time by accessing the `options` key.

+ __asciiOnly__ - Limit strings to ASCII characters.
+ __blockCharacter__ - Character to delineate 4-byte blocks in debug output (or '')
+ __debugCharacter__ - Character to replace NULLs in debug output.
+ __preprocessor__ - osc-message processor, take a single argument of an osc-message.  Only run on individual messages.
+ __strictAddress__ - Use strict address mode (all string rules, must begin with slash).
+ __strictMode__ - Use strict mode.

By default, no strict mode options are enabled.

The preprocessor can be used as a callback for each message received.  See section below for an example

> "The code is more what you'd call 'guidelines' than actual rules."
>  _– Barbossa, Pirates of the Caribbean_

## Exported Functions and Data Structures

## Modules

<dl>
<dt><a href="#module_simple-osc-lib">simple-osc-lib</a></dt>
<dd><p>Simple OSC communication for nodeJS</p>
</dd>
<dt><a href="#module_simple-osc-lib/x32">simple-osc-lib/x32</a></dt>
<dd><p>Extended processing for Behringer X32/M32 consoles.
This provides some override and pre-processing tools
to make it easier to work with the style of OSC messages
the Behringer uses.</p>
</dd>
</dl>

<a name="module_simple-osc-lib"></a>

## simple-osc-lib
Simple OSC communication for nodeJS


* [simple-osc-lib](#module_simple-osc-lib)
    * [~simpleOscLib](#module_simple-osc-lib..simpleOscLib)
        * [new simpleOscLib(options)](#new_module_simple-osc-lib..simpleOscLib_new)
        * [.encodeBufferChunk(type, value)](#module_simple-osc-lib..simpleOscLib+encodeBufferChunk) ⇒ <code>Buffer</code>
        * [.decodeBufferChunk(type, buffer_in)](#module_simple-osc-lib..simpleOscLib+decodeBufferChunk) ⇒ <code>Object</code>
        * [.getDateFromTimeTagArray(timetag)](#module_simple-osc-lib..simpleOscLib+getDateFromTimeTagArray) ⇒ <code>Date</code>
        * [.getTypeStringFromChar(type)](#module_simple-osc-lib..simpleOscLib+getTypeStringFromChar) ⇒ <code>String</code>
        * [.getTypeCharFromStringOrChar(type)](#module_simple-osc-lib..simpleOscLib+getTypeCharFromStringOrChar) ⇒ <code>String</code>
        * [.getTimeTagBufferFromTimestamp(number)](#module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromTimestamp) ⇒ <code>Buffer</code>
        * [.getTimeTagBufferFromDate(date)](#module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromDate) ⇒ <code>Buffer</code>
        * [.getTimeTagBufferFromDelta(seconds, now)](#module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromDelta) ⇒ <code>Buffer</code>
        * [.printableBuffer(buffer_in, rep_char, blockChar)](#module_simple-osc-lib..simpleOscLib+printableBuffer) ⇒ <code>String</code>
        * [.buildMessage(oscMessageObject)](#module_simple-osc-lib..simpleOscLib+buildMessage) ⇒ <code>Buffer</code>
        * [.buildBundle(oscBundleObject)](#module_simple-osc-lib..simpleOscLib+buildBundle) ⇒ <code>Buffer</code>
        * [.readPacket(buffer_in)](#module_simple-osc-lib..simpleOscLib+readPacket) ⇒ <code>Object</code>
        * [.readBundle(buffer_in)](#module_simple-osc-lib..simpleOscLib+readBundle) ⇒ <code>Object</code>
        * [.readMessage(buffer_in, options)](#module_simple-osc-lib..simpleOscLib+readMessage) ⇒ <code>Object</code>
        * [.messageBuilder(address)](#module_simple-osc-lib..simpleOscLib+messageBuilder) ⇒

<a name="module_simple-osc-lib..simpleOscLib"></a>

### simple-osc-lib~simpleOscLib
**Kind**: inner class of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  

* [~simpleOscLib](#module_simple-osc-lib..simpleOscLib)
    * [new simpleOscLib(options)](#new_module_simple-osc-lib..simpleOscLib_new)
    * [.encodeBufferChunk(type, value)](#module_simple-osc-lib..simpleOscLib+encodeBufferChunk) ⇒ <code>Buffer</code>
    * [.decodeBufferChunk(type, buffer_in)](#module_simple-osc-lib..simpleOscLib+decodeBufferChunk) ⇒ <code>Object</code>
    * [.getDateFromTimeTagArray(timetag)](#module_simple-osc-lib..simpleOscLib+getDateFromTimeTagArray) ⇒ <code>Date</code>
    * [.getTypeStringFromChar(type)](#module_simple-osc-lib..simpleOscLib+getTypeStringFromChar) ⇒ <code>String</code>
    * [.getTypeCharFromStringOrChar(type)](#module_simple-osc-lib..simpleOscLib+getTypeCharFromStringOrChar) ⇒ <code>String</code>
    * [.getTimeTagBufferFromTimestamp(number)](#module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromTimestamp) ⇒ <code>Buffer</code>
    * [.getTimeTagBufferFromDate(date)](#module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromDate) ⇒ <code>Buffer</code>
    * [.getTimeTagBufferFromDelta(seconds, now)](#module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromDelta) ⇒ <code>Buffer</code>
    * [.printableBuffer(buffer_in, rep_char, blockChar)](#module_simple-osc-lib..simpleOscLib+printableBuffer) ⇒ <code>String</code>
    * [.buildMessage(oscMessageObject)](#module_simple-osc-lib..simpleOscLib+buildMessage) ⇒ <code>Buffer</code>
    * [.buildBundle(oscBundleObject)](#module_simple-osc-lib..simpleOscLib+buildBundle) ⇒ <code>Buffer</code>
    * [.readPacket(buffer_in)](#module_simple-osc-lib..simpleOscLib+readPacket) ⇒ <code>Object</code>
    * [.readBundle(buffer_in)](#module_simple-osc-lib..simpleOscLib+readBundle) ⇒ <code>Object</code>
    * [.readMessage(buffer_in, options)](#module_simple-osc-lib..simpleOscLib+readMessage) ⇒ <code>Object</code>
    * [.messageBuilder(address)](#module_simple-osc-lib..simpleOscLib+messageBuilder) ⇒

<a name="new_module_simple-osc-lib..simpleOscLib_new"></a>

#### new simpleOscLib(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | simple-osc-lib options. |
| options.asciiOnly | <code>Boolean</code> | Limit strings to ASCII characters. |
| options.blockCharacter | <code>String</code> | Character to delineate 4-byte blocks in debug output (or '') |
| options.debugCharacter | <code>String</code> | Character to replace NULLs in debug output. |
| options.preprocessor | <code>String</code> | osc-message processor |
| options.strictAddress | <code>Boolean</code> | Use strict address mode (all string rules, must begin with slash). |
| options.strictMode | <code>Boolean</code> | Use strict mode. |

<a name="module_simple-osc-lib..simpleOscLib+encodeBufferChunk"></a>

#### simpleOscLib.encodeBufferChunk(type, value) ⇒ <code>Buffer</code>
Encode an OSC Data chunk - low level function

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Buffer</code> - buffer padded to 32-bit blocks with NULLs  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | OSC Data type string/char |
| value | <code>\*</code> | Value for data (must be null for null types) |

<a name="module_simple-osc-lib..simpleOscLib+decodeBufferChunk"></a>

#### simpleOscLib.decodeBufferChunk(type, buffer_in) ⇒ <code>Object</code>
Decode an OSC Data chunk - low level function

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Object</code> - Contains the type, value, and unused portion of the buffer  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | OSC Data type |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |

<a name="module_simple-osc-lib..simpleOscLib+getDateFromTimeTagArray"></a>

#### simpleOscLib.getDateFromTimeTagArray(timetag) ⇒ <code>Date</code>
Get a date object from a timetag array

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  

| Param | Type | Description |
| --- | --- | --- |
| timetag | <code>Array</code> | 2 element array for a timetag [unix seconds, fractional seconds] |

<a name="module_simple-osc-lib..simpleOscLib+getTypeStringFromChar"></a>

#### simpleOscLib.getTypeStringFromChar(type) ⇒ <code>String</code>
Resolve a character type into the human readable name

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | single character type |

<a name="module_simple-osc-lib..simpleOscLib+getTypeCharFromStringOrChar"></a>

#### simpleOscLib.getTypeCharFromStringOrChar(type) ⇒ <code>String</code>
Resolve a type from a character or string with error checking

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | character type string or single character |

<a name="module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromTimestamp"></a>

#### simpleOscLib.getTimeTagBufferFromTimestamp(number) ⇒ <code>Buffer</code>
Generate a timetag buffer from a timestamp

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Buffer</code> - 8 byte / 32 bit buffer  

| Param | Type | Description |
| --- | --- | --- |
| number | <code>Number</code> | timestamp (from epoch) |

<a name="module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromDate"></a>

#### simpleOscLib.getTimeTagBufferFromDate(date) ⇒ <code>Buffer</code>
Generate a timetag buffer from a date instance

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Buffer</code> - 8 byte / 32 bit buffer  

| Param | Type | Description |
| --- | --- | --- |
| date | <code>Date</code> | javascript date instance |

<a name="module_simple-osc-lib..simpleOscLib+getTimeTagBufferFromDelta"></a>

#### simpleOscLib.getTimeTagBufferFromDelta(seconds, now) ⇒ <code>Buffer</code>
Generate a timetag buffer for [seconds] in the future

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Buffer</code> - 8 byte / 32 bit buffer  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| seconds | <code>Number</code> |  | seconds in the future |
| now | <code>Number</code> \| <code>null</code> | <code></code> | point to calculate from (in ms!!) |

<a name="module_simple-osc-lib..simpleOscLib+printableBuffer"></a>

#### simpleOscLib.printableBuffer(buffer_in, rep_char, blockChar) ⇒ <code>String</code>
Format a buffer for console.log()

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | buffer |
| rep_char | <code>String</code> | Character to replace nulls in buffer |
| blockChar | <code>String</code> | Character to delineate 4-byte blocks in buffer (or '') |

<a name="module_simple-osc-lib..simpleOscLib+buildMessage"></a>

#### simpleOscLib.buildMessage(oscMessageObject) ⇒ <code>Buffer</code>
Build an OSC message buffer`address` is a required key, containing the destination address`args` is an array of objects of { type : 'type', value : value }

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Buffer</code> - 4 byte chunked buffer  

| Param | Type | Description |
| --- | --- | --- |
| oscMessageObject | <code>object</code> | osc message object |

<a name="module_simple-osc-lib..simpleOscLib+buildBundle"></a>

#### simpleOscLib.buildBundle(oscBundleObject) ⇒ <code>Buffer</code>
Build an OSC bundle buffer`timetag` is a required key, containing a timetag buffer`elements` can contain objects to be passed to oscBuildMessage or pre-prepared buffers padded to 32-bit blocks with NULLs

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Buffer</code> - 4 byte chunked buffer  

| Param | Type | Description |
| --- | --- | --- |
| oscBundleObject | <code>object</code> | osc bundle object |

<a name="module_simple-osc-lib..simpleOscLib+readPacket"></a>

#### simpleOscLib.readPacket(buffer_in) ⇒ <code>Object</code>
Decode an OSC packet.  Useful for when the client might send bundles or messages

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Object</code> - osc-bundle object or osc-message object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |

<a name="module_simple-osc-lib..simpleOscLib+readBundle"></a>

#### simpleOscLib.readBundle(buffer_in) ⇒ <code>Object</code>
Decode an OSC bundle

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Object</code> - osc-bundle object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |

<a name="module_simple-osc-lib..simpleOscLib+readMessage"></a>

#### simpleOscLib.readMessage(buffer_in, options) ⇒ <code>Object</code>
Decode a single OSC message.

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: <code>Object</code> - osc-message object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |
| options | <code>Object</code> | options |
| options.strictMode | <code>Object</code> | use strict mode |
| options.messageCallback | <code>Object</code> | callback to run on each message |

<a name="module_simple-osc-lib..simpleOscLib+messageBuilder"></a>

#### simpleOscLib.messageBuilder(address) ⇒
Build an osc message in a chainable way.Chainable methods available - for more complex messages, use buildMessage```javascriptmyMessage    .i(20)    .integer(20)    .f(1.0)    .float(1.0)    .s('hello')    .string('world')    .b(buffer)    .blob(buffer)```To get a transmittable buffer, call `myMessage.toBuffer()`To get a human readable version of the buffer, call `myMessage.toString()`

**Kind**: instance method of [<code>simpleOscLib</code>](#module_simple-osc-lib..simpleOscLib)  
**Returns**: oscBuilder instance  

| Param | Type | Description |
| --- | --- | --- |
| address | <code>String</code> | address to send to |

**Example**  
```js
const myBuffer = oscLib.messageBuilder('/hello').integer(10).float(2.0).string('world').toBuffer()
```
<a name="module_simple-osc-lib/x32"></a>

## simple-osc-lib/x32
Extended processing for Behringer X32/M32 consoles.This provides some override and pre-processing toolsto make it easier to work with the style of OSC messagesthe Behringer uses.


* [simple-osc-lib/x32](#module_simple-osc-lib/x32)
    * [~x32PreProcessor](#module_simple-osc-lib/x32..x32PreProcessor)
        * [new x32PreProcessor(options)](#new_module_simple-osc-lib/x32..x32PreProcessor_new)
        * [.readMessage(oscMessage)](#module_simple-osc-lib/x32..x32PreProcessor+readMessage) ⇒ <code>Object</code>
    * [~dB2Float](#module_simple-osc-lib/x32..dB2Float) ⇒ <code>Number</code>
    * [~float2dB](#module_simple-osc-lib/x32..float2dB) ⇒ <code>String</code>

<a name="module_simple-osc-lib/x32..x32PreProcessor"></a>

### simple-osc-lib/x32~x32PreProcessor
**Kind**: inner class of [<code>simple-osc-lib/x32</code>](#module_simple-osc-lib/x32)  

* [~x32PreProcessor](#module_simple-osc-lib/x32..x32PreProcessor)
    * [new x32PreProcessor(options)](#new_module_simple-osc-lib/x32..x32PreProcessor_new)
    * [.readMessage(oscMessage)](#module_simple-osc-lib/x32..x32PreProcessor+readMessage) ⇒ <code>Object</code>

<a name="new_module_simple-osc-lib/x32..x32PreProcessor_new"></a>

#### new x32PreProcessor(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | x32 Preprocessor options. |
| options.activeNodeTypes | <code>Boolean</code> | Active node message preprocessors from lib/x32_preprocessors (or 'all') |
| options.activeRegularTypes | <code>String</code> | Active regular message preprocessors from lib/x32_preprocessors (or 'all') |

<a name="module_simple-osc-lib/x32..x32PreProcessor+readMessage"></a>

#### x32PreProcessor.readMessage(oscMessage) ⇒ <code>Object</code>
This is the processor for X32 style messages

**Kind**: instance method of [<code>x32PreProcessor</code>](#module_simple-osc-lib/x32..x32PreProcessor)  
**Returns**: <code>Object</code> - an OSC message object with additional data  

| Param | Type | Description |
| --- | --- | --- |
| oscMessage | <code>Object</code> | an OSC message object |

**Example**  
```js
const osc     = require('simple-osc-lib')const osc_x32 = require('simple-osc-lib/x32')const x32Pre = new osc_x32.x32PreProcessor({    activeNodeTypes : 'all',    activeRegularTypes : 'all',})const oscRegular = new osc.simpleOscLib({    preprocessor : (msg) => x32Pre.readMessage(msg),})
```
<a name="module_simple-osc-lib/x32..dB2Float"></a>

### simple-osc-lib/x32~dB2Float ⇒ <code>Number</code>
Convert a string or number decibel representation to a floating point number

**Kind**: inner constant of [<code>simple-osc-lib/x32</code>](#module_simple-osc-lib/x32)  
**Returns**: <code>Number</code> - floating point representation of decibel level 0->1  

| Param | Type | Description |
| --- | --- | --- |
| db_in | <code>String</code> \| <code>Number</code> | string or float representation of decibel level +10->-90 |

<a name="module_simple-osc-lib/x32..float2dB"></a>

### simple-osc-lib/x32~float2dB ⇒ <code>String</code>
Convert floating point 0->1 to decibel level

**Kind**: inner constant of [<code>simple-osc-lib/x32</code>](#module_simple-osc-lib/x32)  
**Returns**: <code>String</code> - text level [+/-##.# dB]  

| Param | Type | Description |
| --- | --- | --- |
| f | <code>Number</code> | 0->1 floating point level |


## X32 Pre-Processing

The X32 version of the oscMessage processor adds some additional data, found in the `props` key.

Additionally the `wasProcessed` will be set true if the message was covered.

The following example enables all current X32 extra processing - if you are only interesting in a subset you can set `activeNodeTypes` and `activeRegularTypes` to only process what you care about.

### Example

```javascript
const osc     = require('simple-osc-lib')
const osc_x32 = require('simple-osc-lib/x32') // X32 specific processing (optional)

const x32Pre = new osc_x32.x32PreProcessor({
	activeNodeTypes : 'all',
	activeRegularTypes : 'all',
})

const oscRegular = new osc.simpleOscLib({
	preprocessor : (msg) => x32Pre.readMessage(msg),
})
```

### Standard OSC Messages by subtype

+ __cueCurrent__ :: /-show/prepos/current
+ __showMode__ :: /-prefs/show_control
+ __auxLevel__ :: /auxin/[##]/mix/fader
+ __auxMute__ :: /auxin/[##]/mix/on
+ __auxName__ :: /auxin/[##]/config/name
+ __busLevel__ :: /bus/[##]/mix/fader
+ __busMute__ :: /bus/[##]/mix/on
+ __busName__ :: /bus/[##]/config/name
+ __chanLevel__ :: /ch/[##]/mix/fader
+ __chanMute__ :: /ch/[##]/mix/on
+ __chanName__ :: /ch/[##]/config/name
+ __dcaLevel__ :: /dca/[#]/fader
+ __dcaMute__ :: /dca/[#]/on
+ __dcaName__ :: /dca/[#]/config/name
+ __mainLevel__ :: /main/st/mix/fader
+ __mainMute__ :: /main/st/mix/on
+ __mainName__ :: /main/st/config/name
+ __monoLevel__ :: /main/m/mix/fader
+ __monoMute__ :: /main/m/mix/on
+ __monoName__ :: /main/m/config/name
+ __mtxLevel__ :: /mtx/[##]/mix/fader
+ __mtxMute__ :: /mtx/[##]/mix/on
+ __mtxName__ :: /mtx/[##]/config/name

### `node` OSC Messages by subtype

+ __auxConfig__ :: node /auxin/[##]/config
+ __auxMix__ :: node /auxin/[##]/mix
+ __busConfig__ :: node /bus/[##]/config
+ __busMix__ :: node /bus/[##]/mix
+ __chanConfig__ :: node /ch/[##]/config
+ __chanMix__ :: node /ch/[##]/mix
+ __cue__ :: node /-show/showfile/cue/[###]
+ __cueCurrent__ :: node /-show/prepos/current
+ __dcaConfig__ :: node /dca/[#]/config
+ __dcaMix__ :: node /dca/[#]
+ __mainConfig__ :: node /main/st/config
+ __mainMix__ :: node /main/st/mix
+ __monoConfig__ :: node /main/m/config
+ __monoMix__ :: node /main/m/mix
+ __mtxConfig__ :: node /mtx/[##]/config
+ __mtxMix__ :: node /mtx/[##]/mix
+ __scene__ :: node /-show/showfile/scene/[###]
+ __show__ :: node /-show/showfile/show
+ __showMode__ :: node /-prefs/show_control
+ __snippet__ :: node /-show/showfile/snippet/[###]

&copy; 2024 J.T.Sage - ISC License