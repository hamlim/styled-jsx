'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.combinePlugins = exports.addSourceMaps = exports.makeSourceMapGenerator = exports.isValidCss = exports.generateAttribute = exports.validateExpression = exports.validateExpressionVisitor = exports.makeStyledJsxTag = exports.makeStyledJsxCss = exports.restoreExpressions = exports.getExpressionText = exports.findStyles = exports.isStyledJsx = exports.isGlobalEl = undefined

var _extends2 = require('babel-runtime/helpers/extends')

var _extends3 = _interopRequireDefault(_extends2)

var _typeof2 = require('babel-runtime/helpers/typeof')

var _typeof3 = _interopRequireDefault(_typeof2)

var _babelTypes = require('babel-types')

var t = _interopRequireWildcard(_babelTypes)

var _escapeStringRegexp = require('escape-string-regexp')

var _escapeStringRegexp2 = _interopRequireDefault(_escapeStringRegexp)

var _babelTraverse = require('babel-traverse')

var _babelTraverse2 = _interopRequireDefault(_babelTraverse)

var _babylon = require('babylon')

var _cssTree = require('css-tree')

var _sourceMap = require('source-map')

var _convertSourceMap = require('convert-source-map')

var _convertSourceMap2 = _interopRequireDefault(_convertSourceMap)

var _constants = require('./_constants')

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj
  } else {
    var newObj = {}
    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
          newObj[key] = obj[key]
      }
    }
    newObj.default = obj
    return newObj
  }
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

var isGlobalEl = (exports.isGlobalEl = function isGlobalEl(el) {
  return el.attributes.some(function(_ref) {
    var name = _ref.name
    return name && name.name === _constants.GLOBAL_ATTRIBUTE
  })
})

var isStyledJsx = (exports.isStyledJsx = function isStyledJsx(_ref2) {
  var el = _ref2.node
  return (
    t.isJSXElement(el) &&
    el.openingElement.name.name === 'style' &&
    el.openingElement.attributes.some(function(attr) {
      return attr.name.name === _constants.STYLE_ATTRIBUTE
    })
  )
})

var findStyles = (exports.findStyles = function findStyles(path) {
  if (isStyledJsx(path)) {
    var node = path.node

    return isGlobalEl(node.openingElement) ? [path] : []
  }

  return path.get('children').filter(isStyledJsx)
})

var getExpressionText = (exports.getExpressionText = function getExpressionText(
  expr
) {
  var node = expr.node

  // Assume string literal
  if (t.isStringLiteral(node)) {
    return node.value
  }

  var expressions = expr.get('expressions')

  // Simple template literal without expressions
  if (expressions.length === 0) {
    return node.quasis[0].value.cooked
  }

  // Special treatment for template literals that contain expressions:
  //
  // Expressions are replaced with a placeholder
  // so that the CSS compiler can parse and
  // transform the css source string
  // without having to know about js literal expressions.
  // Later expressions are restored
  // by doing a replacement on the transformed css string.
  //
  // e.g.
  // p { color: ${myConstant}; }
  // becomes
  // p { color: %%styled-jsx-placeholder-${id}%%; }

  var replacements = expressions
    .map(function(e, id) {
      return {
        pattern: new RegExp(
          '\\$\\{\\s*' +
            (0, _escapeStringRegexp2.default)(e.getSource()) +
            '\\s*\\}'
        ),
        replacement: '%%styled-jsx-placeholder-' + id + '%%',
        initial: '${' + e.getSource() + '}'
      }
    })
    .sort(function(a, b) {
      return a.initial.length < b.initial.length
    })

  var source = expr.getSource().slice(1, -1)

  var modified = replacements.reduce(function(source, currentReplacement) {
    source = source.replace(
      currentReplacement.pattern,
      currentReplacement.replacement
    )
    return source
  }, source)

  return {
    source: source,
    modified: modified,
    replacements: replacements
  }
})

var restoreExpressions = (exports.restoreExpressions = function restoreExpressions(
  css,
  replacements
) {
  return replacements.reduce(function(css, currentReplacement) {
    css = css.replace(
      new RegExp(currentReplacement.replacement, 'g'),
      currentReplacement.initial
    )
    return css
  }, css)
})

var makeStyledJsxCss = (exports.makeStyledJsxCss = function makeStyledJsxCss(
  transformedCss,
  isTemplateLiteral
) {
  if (!isTemplateLiteral) {
    return t.stringLiteral(transformedCss)
  }
  // Build the expression from transformedCss
  var css = void 0
  ;(0, _babelTraverse2.default)(
    (0, _babylon.parse)('`' + transformedCss + '`'),
    {
      TemplateLiteral: function TemplateLiteral(path) {
        if (!css) {
          css = path.node
        }
      }
    }
  )
  return css
})

var makeStyledJsxTag = (exports.makeStyledJsxTag = function makeStyledJsxTag(
  id,
  transformedCss,
  isTemplateLiteral
) {
  var css = void 0

  if (
    (typeof transformedCss === 'undefined'
      ? 'undefined'
      : (0, _typeof3.default)(transformedCss)) === 'object' &&
    (t.isIdentifier(transformedCss) || t.isMemberExpression(transformedCss))
  ) {
    css = transformedCss
  } else {
    css = makeStyledJsxCss(transformedCss, isTemplateLiteral)
  }

  return t.jSXElement(
    t.jSXOpeningElement(
      t.jSXIdentifier(_constants.STYLE_COMPONENT),
      [
        t.jSXAttribute(
          t.jSXIdentifier(_constants.STYLE_COMPONENT_ID),
          t.jSXExpressionContainer(
            typeof id === 'number' ? t.numericLiteral(id) : id
          )
        ),
        t.jSXAttribute(
          t.jSXIdentifier(_constants.STYLE_COMPONENT_CSS),
          t.jSXExpressionContainer(css)
        )
      ],
      true
    ),
    null,
    []
  )
})

// We only allow constants to be used in template literals.
// The following visitor ensures that MemberExpressions and Identifiers
// are not in the scope of the current Method (render) or function (Component).
var validateExpressionVisitor = (exports.validateExpressionVisitor = {
  MemberExpression: function MemberExpression(path, scope) {
    var node = path.node

    if (
      (t.isIdentifier(node.property) &&
        t.isThisExpression(node.object) &&
        (node.property.name === 'props' || node.property.name === 'state')) ||
      (t.isIdentifier(node.object) && scope.hasOwnBinding(node.object.name))
    ) {
      throw path.buildCodeFrameError(
        'Expected a constant ' +
          'as part of the template literal expression ' +
          '(eg: <style jsx>{`p { color: ${myColor}`}</style>), ' +
          ('but got a MemberExpression: this.' + node.property.name)
      )
    }
  },
  Identifier: function Identifier(path, scope) {
    if (t.isMemberExpression(path.parentPath)) {
      return
    }
    var name = path.node.name

    if (scope.hasOwnBinding(name)) {
      throw path.buildCodeFrameError(
        'Expected `' +
          name +
          '` ' +
          'to not come from the closest scope.\n' +
          'Styled JSX encourages the use of constants ' +
          'instead of `props` or dynamic values ' +
          'which are better set via inline styles or `className` toggling. ' +
          'See https://github.com/zeit/styled-jsx#dynamic-styles'
      )
    }
  }
})

var validateExpression = (exports.validateExpression = function validateExpression(
  expr,
  scope
) {
  return expr.traverse(validateExpressionVisitor, scope)
})

var generateAttribute = (exports.generateAttribute = function generateAttribute(
  name,
  value
) {
  return t.jSXAttribute(t.jSXIdentifier(name), t.jSXExpressionContainer(value))
})

var isValidCss = (exports.isValidCss = function isValidCss(str) {
  try {
    ;(0, _cssTree.parse)(
      // Replace the placeholders with some valid CSS
      // so that parsing doesn't fail for otherwise valid CSS.
      str
        // Replace all the placeholders with `all`
        .replace(
          // `\S` (the `delimiter`) is to match
          // the beginning of a block `{`
          // a property `:`
          // or the end of a property `;`
          /(\S)?\s*%%styled-jsx-placeholder-[^%]+%%(?:\s*(\}))?/gi,
          function(match, delimiter, isBlockEnd) {
            // The `end` of the replacement would be
            var end = void 0

            if (delimiter === ':' && isBlockEnd) {
              // ';}' single property block without semicolon
              // E.g. { color: all;}
              end = ';}'
            } else if (delimiter === '{' || isBlockEnd) {
              // ':;' when we are at the beginning or the end of a block
              // E.g. { all:; ...otherstuff
              // E.g. all:; }
              end = ':;' + (isBlockEnd || '')
            } else if (delimiter === ';') {
              // ':' when we are inside of a block
              // E.g. color: red; all:; display: block;
              end = ':'
            } else {
              // Otherwise empty
              end = ''
            }

            return (delimiter || '') + 'all' + end
          }
        )
        // Replace block placeholders before media queries
        // E.g. all @media (all) {}
        .replace(/all\s*([@])/g, function(match, delimiter) {
          return 'all {} ' + delimiter
        })
        // Replace block placeholders at the beginning of a media query block
        // E.g. @media (all) { all:; div { ... }}
        .replace(/@media[^{]+{\s*all:;/g, '@media (all) { ')
    )
    return true
  } catch (err) {}
  return false
})

var makeSourceMapGenerator = (exports.makeSourceMapGenerator = function makeSourceMapGenerator(
  file
) {
  var filename = file.opts.sourceFileName
  var generator = new _sourceMap.SourceMapGenerator({
    file: filename,
    sourceRoot: file.opts.sourceRoot
  })

  generator.setSourceContent(filename, file.code)
  return generator
})

var addSourceMaps = (exports.addSourceMaps = function addSourceMaps(
  code,
  generator,
  filename
) {
  return [
    code,
    _convertSourceMap2.default
      .fromObject(generator)
      .toComment({ multiline: true }),
    '/*@ sourceURL=' + filename + ' */'
  ].join('\n')
})

var combinePlugins = (exports.combinePlugins = function combinePlugins(
  plugins,
  opts
) {
  if (!plugins) {
    return function(css) {
      return css
    }
  }

  if (
    !Array.isArray(plugins) ||
    plugins.some(function(p) {
      return !Array.isArray(p) && typeof p !== 'string'
    })
  ) {
    throw new Error(
      '`plugins` must be an array of plugins names (string) or an array `[plugin-name, {options}]`'
    )
  }

  return plugins
    .map(function(plugin, i) {
      var options = {}
      if (Array.isArray(plugin)) {
        options = plugin[1] || {}
        plugin = plugin[0]
      }

      // eslint-disable-next-line import/no-dynamic-require
      var p = require(plugin)
      if (p.default) {
        p = p.default
      }

      var type = typeof p === 'undefined'
        ? 'undefined'
        : (0, _typeof3.default)(p)
      if (type !== 'function') {
        throw new Error(
          'Expected plugin ' +
            plugins[i] +
            ' to be a function but instead got ' +
            type
        )
      }
      return {
        plugin: p,
        settings: (0, _extends3.default)({}, opts, {
          options: options
        })
      }
    })
    .reduce(function(previous, _ref3) {
      var plugin = _ref3.plugin, settings = _ref3.settings
      return function(css) {
        return plugin(previous ? previous(css) : css, settings)
      }
    }, null)
})
