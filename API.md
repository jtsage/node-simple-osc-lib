## Constants

<dl>
<dt><a href="#options">options</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#debugOSCBuffer">debugOSCBuffer(buffer_in, rep_char)</a> ⇒ <code>String</code></dt>
<dd><p>Display a buffer contents in a more readable way - note this only really works with
string only data</p>
</dd>
<dt><a href="#debugOSCBufferBlocks">debugOSCBufferBlocks(buffer_in, rep_char)</a> ⇒ <code>String</code></dt>
<dd><p>Display a buffer contents in a more readable way (with 4-byte chunk marking) - note this 
only really works with string only data</p>
</dd>
<dt><a href="#encodeToBuffer">encodeToBuffer(type, value, ...args)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Encode an OSC Data type - low level function</p>
</dd>
<dt><a href="#decodeToArray">decodeToArray(type, buffer_in, ...args)</a> ⇒ <code>Object</code></dt>
<dd><p>Decode an OSC Data buffer - low level function</p>
</dd>
<dt><a href="#calcTimeTagFromSeconds">calcTimeTagFromSeconds(seconds)</a> ⇒ <code>Array</code></dt>
<dd><p>Exposed for test suite</p>
</dd>
<dt><a href="#getDateFromTimeTag">getDateFromTimeTag(timetag)</a> ⇒ <code>Date</code></dt>
<dd><p>Turn a timetag back into a javascript date object</p>
</dd>
<dt><a href="#generateTimeTagFromTimestamp">generateTimeTagFromTimestamp(number)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Make a timetag from a timestamp</p>
</dd>
<dt><a href="#generateTimeTagFromDate">generateTimeTagFromDate(date)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Make a timetag from a date instance</p>
</dd>
<dt><a href="#generateTimeTagFromDelta">generateTimeTagFromDelta(seconds, now)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Make a timetag for [seconds] in the future</p>
</dd>
<dt><a href="#oscBuildMessage">oscBuildMessage(oscMessageObject)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Build a single OSC message buffer</p>
</dd>
<dt><a href="#oscBuildBundle">oscBuildBundle(oscBundleObject)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Build an OSC bundle buffer</p>
</dd>
<dt><a href="#oscReadMessage">oscReadMessage(buffer_in, useStrict)</a> ⇒ <code>Object</code></dt>
<dd><p>Decode a single OSC message.</p>
</dd>
<dt><a href="#oscReadBundle">oscReadBundle(buffer_in, useStrict)</a> ⇒ <code>Object</code></dt>
<dd><p>Decode an OSC bundle</p>
</dd>
<dt><a href="#oscReadPacket">oscReadPacket(buffer_in, useStrict)</a> ⇒ <code>Object</code></dt>
<dd><p>Decode an OSC packet.  Useful for when the client can send bundles or messages</p>
</dd>
</dl>

<a name="options"></a>

## options
**Kind**: global constant  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | simple-osc-lib options. |
| options.asciiOnly | <code>Boolean</code> | Limit strings to ASCII characters. |
| options.debugCharacter | <code>String</code> | Character to replace NULLs in debug output. |
| options.strictAddress | <code>Boolean</code> | Use strict address mode (all string rules, must begin with slash). |
| options.strictMode | <code>Boolean</code> | Use strict mode. |

<a name="debugOSCBuffer"></a>

## debugOSCBuffer(buffer_in, rep_char) ⇒ <code>String</code>
Display a buffer contents in a more readable way - note this only really works with
string only data

**Kind**: global function  
**Returns**: <code>String</code> - Approximate representation of buffer  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | Buffer to print |
| rep_char | <code>String</code> | Character to replace NULL |

<a name="debugOSCBufferBlocks"></a>

## debugOSCBufferBlocks(buffer_in, rep_char) ⇒ <code>String</code>
Display a buffer contents in a more readable way (with 4-byte chunk marking) - note this 
only really works with string only data

**Kind**: global function  
**Returns**: <code>String</code> - Approximate representation of buffer  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | Buffer to print |
| rep_char | <code>String</code> | Character to replace NULL |

<a name="encodeToBuffer"></a>

## encodeToBuffer(type, value, ...args) ⇒ <code>Buffer</code>
Encode an OSC Data type - low level function

**Kind**: global function  
**Returns**: <code>Buffer</code> - fixed length buffer  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | OSC Data type |
| value | <code>\*</code> | Value for data |
| ...args | <code>any</code> |  |

<a name="decodeToArray"></a>

## decodeToArray(type, buffer_in, ...args) ⇒ <code>Object</code>
Decode an OSC Data buffer - low level function

**Kind**: global function  
**Returns**: <code>Object</code> - Contains the type, value, and unused portion of the buffer  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | OSC Data type |
| buffer_in | <code>Buffer</code> | 4-byte chunked buffer |
| ...args | <code>any</code> |  |

<a name="calcTimeTagFromSeconds"></a>

## calcTimeTagFromSeconds(seconds) ⇒ <code>Array</code>
Exposed for test suite

**Kind**: global function  
**Returns**: <code>Array</code> - unix seconds, fractional seconds  

| Param | Type |
| --- | --- |
| seconds | <code>Number</code> | 

<a name="getDateFromTimeTag"></a>

## getDateFromTimeTag(timetag) ⇒ <code>Date</code>
Turn a timetag back into a javascript date object

**Kind**: global function  
**Returns**: <code>Date</code> - javascript Date representation  

| Param | Type | Description |
| --- | --- | --- |
| timetag | <code>Buffer</code> | timetag data buffer |

<a name="generateTimeTagFromTimestamp"></a>

## generateTimeTagFromTimestamp(number) ⇒ <code>Buffer</code>
Make a timetag from a timestamp

**Kind**: global function  
**Returns**: <code>Buffer</code> - 8 byte buffer  

| Param | Type | Description |
| --- | --- | --- |
| number | <code>Number</code> | timestamp (from epoch) |

<a name="generateTimeTagFromDate"></a>

## generateTimeTagFromDate(date) ⇒ <code>Buffer</code>
Make a timetag from a date instance

**Kind**: global function  
**Returns**: <code>Buffer</code> - 8 byte buffer  

| Param | Type | Description |
| --- | --- | --- |
| date | <code>Date</code> | javascript date instance |

<a name="generateTimeTagFromDelta"></a>

## generateTimeTagFromDelta(seconds, now) ⇒ <code>Buffer</code>
Make a timetag for [seconds] in the future

**Kind**: global function  
**Returns**: <code>Buffer</code> - 8 byte buffer  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| seconds | <code>Number</code> |  | seconds in the future |
| now | <code>Date</code> \| <code>null</code> | <code></code> | point to calculate from |

<a name="oscBuildMessage"></a>

## oscBuildMessage(oscMessageObject) ⇒ <code>Buffer</code>
Build a single OSC message buffer

**Kind**: global function  
**Returns**: <code>Buffer</code> - 4 byte chunked buffer  

| Param | Type | Description |
| --- | --- | --- |
| oscMessageObject | <code>Object</code> | single OSC message object |

<a name="oscBuildBundle"></a>

## oscBuildBundle(oscBundleObject) ⇒ <code>Buffer</code>
Build an OSC bundle buffer

**Kind**: global function  
**Returns**: <code>Buffer</code> - 4 byte chunked buffer  

| Param | Type | Description |
| --- | --- | --- |
| oscBundleObject | <code>object</code> | osc bundle object |

<a name="oscReadMessage"></a>

## oscReadMessage(buffer_in, useStrict) ⇒ <code>Object</code>
Decode a single OSC message.

**Kind**: global function  
**Returns**: <code>Object</code> - osc-message object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | binary OSC message |
| useStrict | <code>Boolean</code> | strict mode |

<a name="oscReadBundle"></a>

## oscReadBundle(buffer_in, useStrict) ⇒ <code>Object</code>
Decode an OSC bundle

**Kind**: global function  
**Returns**: <code>Object</code> - osc-bundle object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | binary OSC message |
| useStrict | <code>Boolean</code> | strict mode |

<a name="oscReadPacket"></a>

## oscReadPacket(buffer_in, useStrict) ⇒ <code>Object</code>
Decode an OSC packet.  Useful for when the client can send bundles or messages

**Kind**: global function  
**Returns**: <code>Object</code> - osc-bundle object  

| Param | Type | Description |
| --- | --- | --- |
| buffer_in | <code>Buffer</code> | binary OSC packet |
| useStrict | <code>Boolean</code> | strict mode |
