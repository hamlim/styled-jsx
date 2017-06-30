'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.moduleExportsVisitor = exports.namedExportDeclarationVisitor = exports.exportDefaultDeclarationVisitor = undefined

var _typeof2 = require('babel-runtime/helpers/typeof')

var _typeof3 = _interopRequireDefault(_typeof2)

var _keys = require('babel-runtime/core-js/object/keys')

var _keys2 = _interopRequireDefault(_keys)

exports.default = function() {
  return {
    visitor: {
      Program: function Program(path, state) {
        if (!plugins) {
          var _state$opts = state.opts,
            sourceMaps = _state$opts.sourceMaps,
            vendorPrefix = _state$opts.vendorPrefix

          plugins = (0, _utils.combinePlugins)(state.opts.plugins, {
            sourceMaps: sourceMaps || state.file.opts.sourceMaps,
            vendorPrefix: typeof vendorPrefix === 'boolean'
              ? vendorPrefix
              : true
          })
        }
      },
      ExportDefaultDeclaration: function ExportDefaultDeclaration(path, state) {
        callVisitor(exportDefaultDeclarationVisitor, path, state)
      },
      AssignmentExpression: function AssignmentExpression(path, state) {
        callVisitor(moduleExportsVisitor, path, state)
      },
      ExportNamedDeclaration: function ExportNamedDeclaration(path, state) {
        callVisitor(namedExportDeclarationVisitor, path, state)
      }
    }
  }
}

var _stringHash = require('string-hash')

var _stringHash2 = _interopRequireDefault(_stringHash)

var _babelTypes = require('babel-types')

var t = _interopRequireWildcard(_babelTypes)

var _styleTransform = require('./lib/style-transform')

var _styleTransform2 = _interopRequireDefault(_styleTransform)

var _constants = require('./_constants')

var _utils = require('./_utils')

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

var plugins = void 0
var getCss = function getCss(path) {
  var validate = arguments.length > 1 && arguments[1] !== undefined
    ? arguments[1]
    : false

  if (!path.isTemplateLiteral() && !path.isStringLiteral()) {
    return
  }
  var css = (0, _utils.getExpressionText)(path)
  if (validate && !(0, _utils.isValidCss)(css.modified || css)) {
    return
  }
  return css
}

var getStyledJsx = function getStyledJsx(css, opts, path) {
  var commonHash = (0, _stringHash2.default)(css.modified || css)
  var globalHash = '1' + commonHash
  var scopedHash = '2' + commonHash
  var compiledCss = void 0
  var globalCss = void 0
  var scopedCss = void 0
  var prefix =
    '[' + _constants.MARKUP_ATTRIBUTE_EXTERNAL + '~="' + scopedHash + '"]'
  var isTemplateLiteral = Boolean(css.modified)

  if (opts.sourceMaps) {
    var generator = (0, _utils.makeSourceMapGenerator)(opts.file)
    var filename = opts.sourceFileName
    var offset = path.get('loc').node.start
    compiledCss = [/* global */ '', prefix].map(function(prefix) {
      return (0, _utils.addSourceMaps)(
        (0, _styleTransform2.default)(
          prefix,
          opts.plugins(css.modified || css),
          {
            generator: generator,
            offset: offset,
            filename: filename,
            vendorPrefix: opts.vendorPrefix
          }
        ),
        generator,
        filename
      )
    })
  } else {
    compiledCss = ['', prefix].map(function(prefix) {
      return (0, _styleTransform2.default)(
        prefix,
        opts.plugins(css.modified || css),
        {
          vendorPrefix: opts.vendorPrefix
        }
      )
    })
  }
  globalCss = compiledCss[0]
  scopedCss = compiledCss[1]

  if (css.replacements) {
    globalCss = (0, _utils.restoreExpressions)(globalCss, css.replacements)
    scopedCss = (0, _utils.restoreExpressions)(scopedCss, css.replacements)
  }

  return {
    initial: (0, _utils.makeStyledJsxCss)(globalCss, isTemplateLiteral),
    hash: globalHash,
    scoped: (0, _utils.makeStyledJsxCss)(scopedCss, isTemplateLiteral),
    scopedHash: scopedHash
  }
}

var makeHashesAndScopedCssPaths = function makeHashesAndScopedCssPaths(
  identifierName,
  data
) {
  return (0, _keys2.default)(data).map(function(key) {
    var value = (0, _typeof3.default)(data[key]) === 'object'
      ? data[key]
      : t.stringLiteral(data[key])

    return t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(
          t.identifier(identifierName),
          t.identifier('__' + key)
        ),
        value
      )
    )
  })
}

var defaultExports = function defaultExports(path, decl, opts) {
  var identifierName = '__styledJsxDefaultExport'
  var css = getCss(decl, opts.validate)
  if (!css) {
    return
  }

  var _getStyledJsx = getStyledJsx(css, opts, path),
    initial = _getStyledJsx.initial,
    hash = _getStyledJsx.hash,
    scoped = _getStyledJsx.scoped,
    scopedHash = _getStyledJsx.scopedHash

  path.insertBefore(
    t.variableDeclaration('var', [
      t.variableDeclarator(
        t.identifier(identifierName),
        t.newExpression(t.identifier('String'), [initial])
      )
    ])
  )
  path.insertBefore(
    makeHashesAndScopedCssPaths(identifierName, {
      hash: hash,
      scoped: scoped,
      scopedHash: scopedHash
    })
  )
  decl.replaceWithSourceString(identifierName)
}

var exportDefaultDeclarationVisitor = (exports.exportDefaultDeclarationVisitor = function exportDefaultDeclarationVisitor(
  path,
  opts
) {
  defaultExports(path, path.get('declaration'), opts)
})

var namedExportDeclarationVisitor = (exports.namedExportDeclarationVisitor = function namedExportDeclarationVisitor(
  path,
  opts
) {
  var decl = path.get('declaration')
  if (!t.isVariableDeclaration(decl)) {
    return
  }
  decl.get('declarations').forEach(function(decl) {
    var src = decl.get('init')
    var css = getCss(src, opts.validate)
    if (!css) {
      return
    }

    var _getStyledJsx2 = getStyledJsx(css, opts, path),
      initial = _getStyledJsx2.initial,
      hash = _getStyledJsx2.hash,
      scoped = _getStyledJsx2.scoped,
      scopedHash = _getStyledJsx2.scopedHash

    var identifierName = decl.get('id').node.name
    path.insertAfter(
      makeHashesAndScopedCssPaths(identifierName, {
        hash: hash,
        scoped: scoped,
        scopedHash: scopedHash
      })
    )
    src.replaceWith(t.newExpression(t.identifier('String'), [initial]))
  })
})

var moduleExportsVisitor = (exports.moduleExportsVisitor = function moduleExportsVisitor(
  path,
  opts
) {
  if (path.get('left').getSource() !== 'module.exports') {
    return
  }
  defaultExports(path, path.get('right'), opts)
})

var callVisitor = function callVisitor(visitor, path, state) {
  var file = state.file
  var opts = file.opts

  visitor(path, {
    validate: state.opts.validate || opts.validate,
    sourceMaps: state.opts.sourceMaps || opts.sourceMaps,
    sourceFileName: opts.sourceFileName,
    file: file,
    plugins: plugins,
    vendorPrefix: state.opts.vendorPrefix
  })
}
