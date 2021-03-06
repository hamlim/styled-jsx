'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray')

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2)

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray')

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2)

var _getIterator2 = require('babel-runtime/core-js/get-iterator')

var _getIterator3 = _interopRequireDefault(_getIterator2)

exports.default = function(_ref) {
  var t = _ref.types

  return {
    inherits: _babelPluginSyntaxJsx2.default,
    visitor: {
      ImportDefaultSpecifier: function ImportDefaultSpecifier(path, state) {
        state.imports.push(path.get('local').node.name)
      },
      ImportSpecifier: function ImportSpecifier(path, state) {
        state.imports.push(
          (path.get('local') || path.get('imported')).node.name
        )
      },
      VariableDeclarator: function VariableDeclarator(path, state) {
        var subpath = path.get('init')
        if (
          !subpath.isCallExpression() ||
          subpath.get('callee').node.name !== 'require'
        ) {
          return
        }
        state.imports.push(path.get('id').node.name)
      },
      JSXOpeningElement: function JSXOpeningElement(path, state) {
        var el = path.node

        var _ref2 = el.name || {}, name = _ref2.name

        if (!state.hasJSXStyle) {
          return
        }

        if (state.ignoreClosing === null) {
          // We keep a counter of elements inside so that we
          // can keep track of when we exit the parent to reset state
          // note: if we wished to add an option to turn off
          // selectors to reach parent elements, it would suffice to
          // set this to `1` and do an early return instead
          state.ignoreClosing = 0
        }

        if (
          name &&
          name !== 'style' &&
          name !== _constants.STYLE_COMPONENT &&
          name.charAt(0) !== name.charAt(0).toUpperCase()
        ) {
          var _iteratorNormalCompletion = true
          var _didIteratorError = false
          var _iteratorError = undefined

          try {
            for (
              var _iterator = (0, _getIterator3.default)(el.attributes), _step;
              !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
              _iteratorNormalCompletion = true
            ) {
              var _ref4 = _step.value
              var _name = _ref4.name

              if (!_name) {
                continue
              }
              if (
                _name === _constants.MARKUP_ATTRIBUTE ||
                _name.name === _constants.MARKUP_ATTRIBUTE ||
                _name === _constants.MARKUP_ATTRIBUTE_EXTERNAL ||
                _name.name === _constants.MARKUP_ATTRIBUTE_EXTERNAL
              ) {
                // Avoid double attributes
                return
              }
            }
          } catch (err) {
            _didIteratorError = true
            _iteratorError = err
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return()
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError
              }
            }
          }

          if (state.jsxId) {
            el.attributes.push(
              (0, _utils.generateAttribute)(
                _constants.MARKUP_ATTRIBUTE,
                t.numericLiteral(state.jsxId)
              )
            )
          }

          if (state.externalJsxId) {
            el.attributes.push(
              (0, _utils.generateAttribute)(
                _constants.MARKUP_ATTRIBUTE_EXTERNAL,
                state.externalJsxId
              )
            )
          }
        }

        state.ignoreClosing++
        // Next visit will be: JSXElement exit()
      },

      JSXElement: {
        enter: function enter(path, state) {
          if (state.hasJSXStyle !== null) {
            return
          }

          var styles = (0, _utils.findStyles)(path)

          if (styles.length === 0) {
            return
          }

          state.styles = []
          state.externalStyles = []

          var scope = (path.findParent(function(path) {
            return (
              path.isFunctionDeclaration() ||
              path.isArrowFunctionExpression() ||
              path.isClassMethod()
            )
          }) || path).scope

          var _iteratorNormalCompletion2 = true
          var _didIteratorError2 = false
          var _iteratorError2 = undefined

          try {
            for (
              var _iterator2 = (0, _getIterator3.default)(styles), _step2;
              !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done);
              _iteratorNormalCompletion2 = true
            ) {
              var style = _step2.value

              // Compute children excluding whitespace
              var children = style.get('children').filter(function(c) {
                return (
                  t.isJSXExpressionContainer(c.node) ||
                  // Ignore whitespace around the expression container
                  (t.isJSXText(c.node) && c.node.value.trim() !== '')
                )
              })

              if (children.length !== 1) {
                throw path.buildCodeFrameError(
                  'Expected one child under ' +
                    ('JSX Style tag, but got ' + children.length + ' ') +
                    '(eg: <style jsx>{`hi`}</style>)'
                )
              }

              var child = children[0]

              if (!t.isJSXExpressionContainer(child)) {
                throw path.buildCodeFrameError(
                  'Expected a child of ' +
                    'type JSXExpressionContainer under JSX Style tag ' +
                    ('(eg: <style jsx>{`hi`}</style>), got ' + child.type)
                )
              }

              var expression = child.get('expression')

              if (t.isIdentifier(expression)) {
                var idName = expression.node.name
                if (state.imports.indexOf(idName) !== -1) {
                  var id = t.identifier(idName)
                  var isGlobal = (0, _utils.isGlobalEl)(
                    style.get('openingElement').node
                  )
                  state.externalStyles.push([
                    t.memberExpression(
                      id,
                      t.identifier(isGlobal ? '__hash' : '__scopedHash')
                    ),
                    id,
                    isGlobal
                  ])
                  continue
                }

                throw path.buildCodeFrameError(
                  'The Identifier ' +
                    ('`' +
                      expression.getSource() +
                      '` is either `undefined` or ') +
                    'it is not an external StyleSheet reference i.e. ' +
                    "it doesn't come from an `import` or `require` statement"
                )
              }

              if (
                !t.isTemplateLiteral(expression) &&
                !t.isStringLiteral(expression)
              ) {
                throw path.buildCodeFrameError(
                  'Expected a template ' +
                    'literal or String literal as the child of the ' +
                    'JSX Style tag (eg: <style jsx>{`some css`}</style>),' +
                    (' but got ' + expression.type)
                )
              }

              // Validate MemberExpressions and Identifiers
              // to ensure that are constants not defined in the closest scope
              ;(0, _utils.validateExpression)(expression, scope)

              var styleText = (0, _utils.getExpressionText)(expression)
              var styleId = (0, _stringHash2.default)(
                styleText.source || styleText
              )

              state.styles.push([styleId, styleText, expression.node.loc])
            }
          } catch (err) {
            _didIteratorError2 = true
            _iteratorError2 = err
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return()
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2
              }
            }
          }

          if (state.externalStyles.length > 0) {
            var expressions = state.externalStyles
              // Remove globals
              .filter(function(s) {
                return !s[2]
              })
              .map(function(s) {
                return s[0]
              })

            var expressionsLength = expressions.length

            if (expressionsLength === 0) {
              state.externalJsxId = null
            } else if (expressionsLength === 1) {
              state.externalJsxId = expressions[0]
            } else {
              // Construct a template literal of this form:
              // `${styles.__scopedHash} ${otherStyles.__scopedHash}`
              state.externalJsxId = t.templateLiteral(
                [
                  t.templateElement({ raw: '', cooked: '' })
                ].concat(
                  (0, _toConsumableArray3.default)(
                    []
                      .concat(
                        (0, _toConsumableArray3.default)(
                          new Array(expressionsLength - 1)
                        )
                      )
                      .map(function() {
                        return t.templateElement({ raw: ' ', cooked: ' ' })
                      })
                  ),
                  [t.templateElement({ raw: '', cooked: '' }, true)]
                ),
                expressions
              )
            }
          }

          if (state.styles.length > 0) {
            state.jsxId = (0, _stringHash2.default)(
              state.styles
                .map(function(s) {
                  return s[1].source || s[1]
                })
                .join('')
            )
          }

          state.hasJSXStyle = true
          state.file.hasJSXStyle = true
          // Next visit will be: JSXOpeningElement
        },
        exit: function exit(path, state) {
          var isGlobal = (0, _utils.isGlobalEl)(path.node.openingElement)

          if (state.hasJSXStyle && !--state.ignoreClosing && !isGlobal) {
            state.hasJSXStyle = null
            state.jsxId = null
            state.externalJsxId = null
          }

          if (!state.hasJSXStyle || !(0, _utils.isStyledJsx)(path)) {
            return
          }

          if (
            state.externalStyles.length > 0 &&
            path.get('children')[0].get('expression').isIdentifier()
          ) {
            var _state$externalStyles = state.externalStyles.shift(),
              _state$externalStyles2 = (0, _slicedToArray3.default)(
                _state$externalStyles,
                3
              ),
              _id = _state$externalStyles2[0],
              externalStylesReference = _state$externalStyles2[1],
              _isGlobal = _state$externalStyles2[2]

            path.replaceWith(
              (0, _utils.makeStyledJsxTag)(
                _id,
                _isGlobal
                  ? externalStylesReference
                  : t.memberExpression(
                      t.identifier(externalStylesReference.name),
                      t.identifier('__scoped')
                    )
              )
            )
            return
          }

          // We replace styles with the function call

          var _state$styles$shift = state.styles.shift(),
            _state$styles$shift2 = (0, _slicedToArray3.default)(
              _state$styles$shift,
              3
            ),
            id = _state$styles$shift2[0],
            css = _state$styles$shift2[1],
            loc = _state$styles$shift2[2]

          var useSourceMaps = Boolean(
            state.opts.sourceMaps || state.file.opts.sourceMaps
          )
          var transformedCss = void 0

          if (useSourceMaps) {
            var generator = (0, _utils.makeSourceMapGenerator)(state.file)
            var filename = state.file.opts.sourceFileName
            transformedCss = (0, _utils.addSourceMaps)(
              (0, _styleTransform2.default)(
                isGlobal ? '' : getPrefix(state.jsxId),
                plugins(css.modified || css),
                {
                  generator: generator,
                  offset: loc.start,
                  filename: filename,
                  vendorPrefix: state.opts.vendorPrefix
                }
              ),
              generator,
              filename
            )
          } else {
            transformedCss = (0, _styleTransform2.default)(
              isGlobal ? '' : getPrefix(state.jsxId),
              plugins(css.modified || css),
              {
                vendorPrefix: state.opts.vendorPrefix
              }
            )
          }

          if (css.replacements) {
            transformedCss = (0, _utils.restoreExpressions)(
              transformedCss,
              css.replacements
            )
          }

          path.replaceWith(
            (0, _utils.makeStyledJsxTag)(id, transformedCss, css.modified)
          )
        }
      },
      Program: {
        enter: function enter(path, state) {
          state.hasJSXStyle = null
          state.ignoreClosing = null
          state.file.hasJSXStyle = false
          state.imports = []
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
        exit: function exit(_ref5, state) {
          var node = _ref5.node, scope = _ref5.scope

          if (
            !(state.file.hasJSXStyle &&
              !scope.hasBinding(_constants.STYLE_COMPONENT))
          ) {
            return
          }

          var importDeclaration = t.importDeclaration(
            [
              t.importDefaultSpecifier(t.identifier(_constants.STYLE_COMPONENT))
            ],
            t.stringLiteral('styled-jsx/style')
          )

          node.body.unshift(importDeclaration)
        }
      },
      // Transpile external StyleSheets
      ExportDefaultDeclaration: function ExportDefaultDeclaration(path, state) {
        callExternalVisitor(
          _babelExternal.exportDefaultDeclarationVisitor,
          path,
          state
        )
      },
      AssignmentExpression: function AssignmentExpression(path, state) {
        callExternalVisitor(_babelExternal.moduleExportsVisitor, path, state)
      },
      ExportNamedDeclaration: function ExportNamedDeclaration(path, state) {
        callExternalVisitor(
          _babelExternal.namedExportDeclarationVisitor,
          path,
          state
        )
      }
    }
  }
}

var _babelPluginSyntaxJsx = require('babel-plugin-syntax-jsx')

var _babelPluginSyntaxJsx2 = _interopRequireDefault(_babelPluginSyntaxJsx)

var _stringHash = require('string-hash')

var _stringHash2 = _interopRequireDefault(_stringHash)

var _styleTransform = require('./lib/style-transform')

var _styleTransform2 = _interopRequireDefault(_styleTransform)

var _babelExternal = require('./babel-external')

var _utils = require('./_utils')

var _constants = require('./_constants')

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

// Ours
// Packages
var plugins = void 0
var getPrefix = function getPrefix(id) {
  return '[' + _constants.MARKUP_ATTRIBUTE + '="' + id + '"]'
}
var callExternalVisitor = function callExternalVisitor(visitor, path, state) {
  var file = state.file
  var opts = file.opts

  visitor(path, {
    validate: true,
    sourceMaps: state.opts.sourceMaps || opts.sourceMaps,
    sourceFileName: opts.sourceFileName,
    file: file,
    plugins: plugins,
    vendorPrefix: state.opts.vendorPrefix
  })
}
