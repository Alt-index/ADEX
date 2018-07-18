const Length = require('./length')
const { bufferCopy, toBuffer } = require('./util')

function encode (value, buffer, offset = 0) {
  let buf
  if (Array.isArray(value)) {
    buf = Buffer.concat(value.map((item) => encode(item)))
    buf = Buffer.concat([ Length.encode(buf.length, 0xc0), buf ])
  } else {
    buf = toBuffer(value)
    if (!(buf.length === 1 && buf[0] < 0x80)) {
      buf = Buffer.concat([ Length.encode(buf.length, 0x80), buf ])
    }
  }

  if (buffer !== undefined) {
    if (offset + buf.length > buffer.length) throw new Error('Not enough buffer size')
    buf.copy(buffer, offset)
    buf = buffer
  }

  encode.bytes = buf.length
  return buf
}

function decode (buffer, start = 0, end = buffer.length) {
  if (start >= end) throw new Error('Not enough data for decode')

  const firstByte = buffer[start]

  // A single byte whose value is in the [0x00, 0x7f] range, that byte is its own RLP encoding.
  if (firstByte <= 0x7f) {
    decode.bytes = 1
    return Buffer.from([ firstByte ])
  }

  // String is 0-55 bytes long.
  // A single byte with value 0x80 plus the length of the string followed by the string.
  // The range of the first byte is [0x80, 0xb7]
  if (firstByte <= 0xb7) {
    const length = firstByte - 0x80
    if (length === 1 && buffer[start + 1] < 0x80) throw new Error('First byte must be less than 0x80')

    const value = bufferCopy(buffer, start + 1, length)
    if (value.length !== length) throw new Error('Not enough data for decode')

    decode.bytes = 1 + length
    return value
  }

  // String with length more than 55 bytes long.
  // A single byte with value 0xb7 plus the length in bytes of the length of the string in binary form,
  // followed by the length of the string, followed by the string.
  // The range of the first byte is thus [0xb8, 0xbf]
  if (firstByte <= 0xbf) {
    const lengthLength = firstByte - 0xb7
    const length = Length.decode(buffer, start + 1, lengthLength)
    if (length <= 55) throw new Error('Invalid length')

    const value = bufferCopy(buffer, start + 1 + lengthLength, length)
    if (value.length !== length) throw new Error('Not enough data for decode')

    decode.bytes = 1 + lengthLength + length
    return value
  }

  // If the total payload of a list is 0-55 bytes long,
  // the RLP encoding consists of a single byte with value 0xc0 plus the length of the list
  // followed by the concatenation of the RLP encodings of the items.
  // The range of the first byte is thus [0xc0, 0xf7]
  if (firstByte <= 0xf7) {
    const length = firstByte - 0xc0
    const value = decodeList(buffer, start + 1, length)
    decode.bytes = 1 + length
    return value
  }

  // If the total payload of a list is more than 55 bytes long,
  // the RLP encoding consists of a single byte with value 0xf7 plus the length in bytes of the length
  // of the payload in binary form, followed by the length of the payload,
  // followed by the concatenation of the RLP encodings of the items.
  // The range of the first byte is thus [0xf8, 0xff]
  const lengthLength = firstByte - 0xf7
  const length = Length.decode(buffer, start + 1, lengthLength)
  if (length < 55) throw new Error('Invalid length')

  const value = decodeList(buffer, start + 1 + lengthLength, length)
  decode.bytes = 1 + lengthLength + length
  return value
}

function decodeList (buffer, start, length) {
  const lst = []

  for (const end = start + length; start !== end; start += decode.bytes) {
    lst.push(decode(buffer, start, end))
  }

  return lst
}

function encodingLength (value) {
  if (Array.isArray(value)) {
    const length = value.reduce((total, item) => total + encodingLength(item), 0)
    return Length.encodingLength(length) + length
  }

  const buffer = toBuffer(value)
  let length = buffer.length
  if (!(buffer.length === 1 && buffer[0] < 0x80)) length += Length.encodingLength(length)
  return length
}

module.exports = { encode, decode, encodingLength }
