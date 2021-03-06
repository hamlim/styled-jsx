'use strict'

var stylis = require('stylis')

function disableNestingPlugin() {
  for (
    var _len = arguments.length, args = Array(_len), _key = 0;
    _key < _len;
    _key++
  ) {
    args[_key] = arguments[_key]
  }

  var context = args[0],
    _args$ = args[3],
    parent = _args$ === undefined ? [] : _args$,
    line = args[4],
    column = args[5]

  if (context === 2) {
    parent = parent[0]
    if (
      typeof parent === 'string' &&
      parent.trim().length > 0 &&
      parent.charAt(0) !== '@'
    ) {
      throw new Error(
        'Nesting detected at ' +
          line +
          ':' +
          column +
          '. ' +
          'Unfortunately nesting is not supported by styled-jsx.'
      )
    }
  }
}

var generator = void 0
var filename = void 0
var offset = void 0

function sourceMapsPlugin() {
  for (
    var _len2 = arguments.length, args = Array(_len2), _key2 = 0;
    _key2 < _len2;
    _key2++
  ) {
    args[_key2] = arguments[_key2]
  }

  var context = args[0], line = args[4], column = args[5], length = args[6]

  // Pre-processed, init source map

  if (context === -1 && generator !== undefined) {
    generator.addMapping({
      generated: {
        line: 1,
        column: 0
      },
      source: filename,
      original: offset
    })

    return
  }

  // Post-processed
  if (context === -2 && generator !== undefined) {
    generator = undefined
    offset = undefined
    filename = undefined

    return
  }

  // Selector/property, update source map
  if ((context === 1 || context === 2) && generator !== undefined) {
    generator.addMapping({
      generated: {
        line: 1,
        column: length
      },
      source: filename,
      original: {
        line: line + offset.line,
        column: column + offset.column
      }
    })
  }
}

stylis.use(disableNestingPlugin)
stylis.use(sourceMapsPlugin)
stylis.set({
  cascade: false,
  compress: true
})

/**
 * Public transform function
 *
 * @param {String} prefix
 * @param {String} styles
 * @param {Object} settings
 * @return {string}
 */
function transform(prefix, styles) {
  var settings = arguments.length > 2 && arguments[2] !== undefined
    ? arguments[2]
    : {}

  generator = settings.generator
  offset = settings.offset
  filename = settings.filename
  stylis.set({
    prefix: typeof settings.vendorPrefix === 'boolean'
      ? settings.vendorPrefix
      : true
  })

  return stylis(prefix, styles)
}

module.exports = transform
