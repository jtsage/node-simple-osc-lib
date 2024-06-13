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
const osc = require('simple-osc-lib')
const x32 = require('simple-osc-lib/x32') // X32 specific processing (optional)
```

### Build an OSC Single Message Buffer for sending

```javascript
osc.oscBuildMessage({
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
const timeTag = osc.generateTimeTagFromDelta(0.5)

osc.oscBuildBundle({
    timetag : timeTag,
    elements : [oscMessage1, oscMessage2],
})
```

### Decode an OSC Packet from receiving

```javascript

// messageCallback allows you to inject a pre-processor to the returned types.
// this is how the x32 extension works.

osc.oscReadPacket(buffer, { strictMode : false, messageCallback : (oscMessage) => {} })
```

Single message

```json
{
    "type": "osc-message",
    "address": "/goodbye",
    "args": [
        { "type": "string", "value": "cruel" },
        { "type": "string", "value": "world" }
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
    "type": "osc-message",
    "address": "/goodbye",
    "args": [
		{ "type": "array", "value": [
            { "type": "string", "value": "cruel" },
            { "type": "string", "value": "world" }
        ]}
    ]
}
```

## timetag Processing of Bundles

This package provides no pre-processing for timetags - they are returned as found, in all circumstances.  The OSC 1.1 spec does not clarify the proper handling of timetags in the past, as different implementations do different things with them. A timetag in the past may mean the bundle should be discarded, or it may mean it should be acted on immediately - this behavior is left to your preference. Please do not assume a received timetag refers to a future event.

## Overriding default options

The options data structure is exported - you can change the values directly in your code.  _Please note:_ this is ineffective in a child process, so you may have to reset the options if forked or pass them. By default, no strict mode options are enabled.

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
    * [~uNULL](#module_simple-osc-lib..uNULL) : <code>String</code>
    * [~options](#module_simple-osc-lib..options)
    * [~debugOSCBuffer(buffer_in, rep_char)](#module_simple-osc-lib..debugOSCBuffer) ⇒ <code>String</code>
    * [~debugOSCBufferBlocks(buffer_in, rep_char)](#module_simple-osc-lib..debugOSCBufferBlocks) ⇒ <code>String</code>
    * [~encodeToBuffer(type, value, ...args)](#module_simple-osc-lib..encodeToBuffer) ⇒ <code>Buffer</code>
    * [~decodeToArray(type, buffer_in, ...args)](#module_simple-osc-lib..decodeToArray) ⇒ <code>Object</code>
    * [~getDateFromTimeTag(timetag)](#module_simple-osc-lib..getDateFromTimeTag) ⇒ <code>Date</code>
    * [~generateTimeTagFromTimestamp(number)](#module_simple-osc-lib..generateTimeTagFromTimestamp) ⇒ <code>Buffer</code>
    * [~generateTimeTagFromDate(date)](#module_simple-osc-lib..generateTimeTagFromDate) ⇒ <code>Buffer</code>
    * [~generateTimeTagFromDelta(seconds, now)](#module_simple-osc-lib..generateTimeTagFromDelta) ⇒ <code>Buffer</code>
    * [~oscBuildMessage(oscMessageObject)](#module_simple-osc-lib..oscBuildMessage) ⇒ <code>Buffer</code>
    * [~oscBuildBundle(oscBundleObject)](#module_simple-osc-lib..oscBuildBundle) ⇒ <code>Buffer</code>
    * [~oscReadMessage(buffer_in, options)](#module_simple-osc-lib..oscReadMessage) ⇒ <code>Object</code>
    * [~oscReadBundle(buffer_in, options)](#module_simple-osc-lib..oscReadBundle) ⇒ <code>Object</code>
    * [~oscReadPacket(buffer_in, options)](#module_simple-osc-lib..oscReadPacket) ⇒ <code>Object</code>

<a name="module_simple-osc-lib..uNULL"></a>

### simple-osc-lib~uNULL : <code>String</code>
Unicode null

**Kind**: inner constant of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
<a name="module_simple-osc-lib..options"></a>

### simple-osc-lib~options
**Kind**: inner constant of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | simple-osc-lib options. |
| options.asciiOnly | <code>Boolean</code> | Limit strings to ASCII characters. |
| options.debugCharacter | <code>String</code> | Character to replace NULLs in debug output. |
| options.strictAddress | <code>Boolean</code> | Use strict address mode (all string rules, must begin with slash). |
| options.strictMode | <code>Boolean</code> | Use strict mode. |

<a name="module_simple-osc-lib..debugOSCBuffer"></a>

### simple-osc-lib~debugOSCBuffer(buffer_in, rep_char) ⇒ <code>String</code>
Display a buffer contents in a more readable way - note this only really works withstring only data

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>String</code> - Approximate representation of buffer  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | Buffer to print |
| rep_char | <code>String</code> | Character to replace NULL |

<a name="module_simple-osc-lib..debugOSCBufferBlocks"></a>

### simple-osc-lib~debugOSCBufferBlocks(buffer_in, rep_char) ⇒ <code>String</code>
Display a buffer contents in a more readable way (with 4-byte chunk marking) - note this only really works with string only data

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>String</code> - Approximate representation of buffer  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | Buffer to print |
| rep_char | <code>String</code> | Character to replace NULL |

<a name="module_simple-osc-lib..encodeToBuffer"></a>

### simple-osc-lib~encodeToBuffer(type, value, ...args) ⇒ <code>Buffer</code>
Encode an OSC Data type - low level function

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Buffer</code> - buffer padded to 32-bit blocks with NULLs  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | OSC Data type string/char |
| value | <code>\*</code> | Value for data (must be null for null types) |
| ...args | <code>any</code> | Additional arguments for the encoder, typically strictMode |

<a name="module_simple-osc-lib..decodeToArray"></a>

### simple-osc-lib~decodeToArray(type, buffer_in, ...args) ⇒ <code>Object</code>
Decode an OSC Data buffer - low level function

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Object</code> - Contains the type, value, and unused portion of the buffer  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | OSC Data type |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |
| ...args | <code>any</code> | Additional arguments for the decoder, typically strictMode |

<a name="module_simple-osc-lib..getDateFromTimeTag"></a>

### simple-osc-lib~getDateFromTimeTag(timetag) ⇒ <code>Date</code>
Turn a timetag back into a javascript date object

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Date</code> - javascript Date representation  

| Param | Type | Description |
| --- | --- | --- |
| timetag | <code>Buffer</code> | timetag data buffer |

<a name="module_simple-osc-lib..generateTimeTagFromTimestamp"></a>

### simple-osc-lib~generateTimeTagFromTimestamp(number) ⇒ <code>Buffer</code>
Generate a timetag buffer from a timestamp

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Buffer</code> - 8 byte / 32 bit buffer  

| Param | Type | Description |
| --- | --- | --- |
| number | <code>Number</code> | timestamp (from epoch) |

<a name="module_simple-osc-lib..generateTimeTagFromDate"></a>

### simple-osc-lib~generateTimeTagFromDate(date) ⇒ <code>Buffer</code>
Generate a timetag buffer from a date instance

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Buffer</code> - 8 byte / 32 bit buffer  

| Param | Type | Description |
| --- | --- | --- |
| date | <code>Date</code> | javascript date instance |

<a name="module_simple-osc-lib..generateTimeTagFromDelta"></a>

### simple-osc-lib~generateTimeTagFromDelta(seconds, now) ⇒ <code>Buffer</code>
Generate a timetag buffer for [seconds] in the future

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Buffer</code> - 8 byte / 32 bit buffer  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| seconds | <code>Number</code> |  | seconds in the future |
| now | <code>Date</code> \| <code>null</code> | <code></code> | point to calculate from |

<a name="module_simple-osc-lib..oscBuildMessage"></a>

### simple-osc-lib~oscBuildMessage(oscMessageObject) ⇒ <code>Buffer</code>
Build a single OSC message buffer

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Buffer</code> - buffer padded to 32-bit blocks with NULLs  

| Param | Type | Description |
| --- | --- | --- |
| oscMessageObject | <code>Object</code> | single OSC message object |

<a name="module_simple-osc-lib..oscBuildBundle"></a>

### simple-osc-lib~oscBuildBundle(oscBundleObject) ⇒ <code>Buffer</code>
Build an OSC bundle buffer`timetag` is a required key, containing a timetag buffer`elements` can contain objects to be passed to oscBuildMessage or pre-prepared buffers padded to 32-bit blocks with NULLs

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Buffer</code> - 4 byte chunked buffer  

| Param | Type | Description |
| --- | --- | --- |
| oscBundleObject | <code>object</code> | osc bundle object |

<a name="module_simple-osc-lib..oscReadMessage"></a>

### simple-osc-lib~oscReadMessage(buffer_in, options) ⇒ <code>Object</code>
Decode a single OSC message.

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Object</code> - osc-message object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |
| options | <code>Object</code> | options |
| options.strictMode | <code>Object</code> | use strict mode |
| options.messageCallback | <code>Object</code> | callback to run on each message |

<a name="module_simple-osc-lib..oscReadBundle"></a>

### simple-osc-lib~oscReadBundle(buffer_in, options) ⇒ <code>Object</code>
Decode an OSC bundle

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Object</code> - osc-bundle object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |
| options | <code>Object</code> | options |
| options.strictMode | <code>Object</code> | use strict mode |
| options.messageCallback | <code>Object</code> | callback to run on each message |

<a name="module_simple-osc-lib..oscReadPacket"></a>

### simple-osc-lib~oscReadPacket(buffer_in, options) ⇒ <code>Object</code>
Decode an OSC packet.  Useful for when the client might send bundles or messages

**Kind**: inner method of [<code>simple-osc-lib</code>](#module_simple-osc-lib)  
**Returns**: <code>Object</code> - osc-bundle object or osc-message object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |
| options | <code>Object</code> | options |
| options.strictMode | <code>Object</code> | use strict mode |
| options.messageCallback | <code>Object</code> | callback to run on each message |

<a name="module_simple-osc-lib/x32"></a>

## simple-osc-lib/x32
Extended processing for Behringer X32/M32 consoles.This provides some override and pre-processing toolsto make it easier to work with the style of OSC messagesthe Behringer uses.


* [simple-osc-lib/x32](#module_simple-osc-lib/x32)
    * [~dB2Float](#module_simple-osc-lib/x32..dB2Float) ⇒ <code>Number</code>
    * [~float2dB](#module_simple-osc-lib/x32..float2dB) ⇒ <code>String</code>
    * [~nodeArgMap](#module_simple-osc-lib/x32..nodeArgMap)
    * [~oscReadPacket(buffer_in, options)](#module_simple-osc-lib/x32..oscReadPacket) ⇒ <code>Object</code>
    * [~x32PacketProcessor(oscMessage)](#module_simple-osc-lib/x32..x32PacketProcessor) ⇒ <code>Object</code>

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

<a name="module_simple-osc-lib/x32..nodeArgMap"></a>

### simple-osc-lib/x32~nodeArgMap
This object is used to pre-process those messages that have an address of `node` or `/node`.Note that the X32 family does not use a leading slash on node messages it sends.

**Kind**: inner constant of [<code>simple-osc-lib/x32</code>](#module_simple-osc-lib/x32)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| nodeArgMap | <code>Object</code> | node message coverage |
| nodeArgMap[key].regex | <code>RegExp</code> | match regex for this message type |
| nodeArgMap[key].props | <code>function</code> | function that returns an object that is saved to the `props` key of the original message object |

**Example**  
```js
nodeArgMap.show = {    regex : /^\/-show\/showfile\/show$/,    props : (msgObj) => ({        name       : msgObj.args[0].value,        subType    : 'show',    }),}
```
<a name="module_simple-osc-lib/x32..oscReadPacket"></a>

### simple-osc-lib/x32~oscReadPacket(buffer_in, options) ⇒ <code>Object</code>
Decode an OSC packet.  Useful for when the client might send bundles or messages.This version runs the X32 preprocessor on received messages

**Kind**: inner method of [<code>simple-osc-lib/x32</code>](#module_simple-osc-lib/x32)  
**Returns**: <code>Object</code> - osc-bundle object or osc-message object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | buffer padded to 32-bit blocks with NULLs |
| options | <code>Object</code> | options |
| options.strictMode | <code>Object</code> | use strict mode |
| options.messageCallback | <code>Object</code> | callback to run on each message |

<a name="module_simple-osc-lib/x32..x32PacketProcessor"></a>

### simple-osc-lib/x32~x32PacketProcessor(oscMessage) ⇒ <code>Object</code>
This is the processor for X32 style messages

**Kind**: inner method of [<code>simple-osc-lib/x32</code>](#module_simple-osc-lib/x32)  
**Returns**: <code>Object</code> - an OSC message object with additional data  

| Param | Type | Description |
| --- | --- | --- |
| oscMessage | <code>Object</code> | an OSC message object |


* * *

&copy; 2024 J.T.Sage - ISC License