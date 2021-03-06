'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})

var _getIterator2 = require('babel-runtime/core-js/get-iterator')

var _getIterator3 = _interopRequireDefault(_getIterator2)

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray')

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2)

var _from = require('babel-runtime/core-js/array/from')

var _from2 = _interopRequireDefault(_from)

var _map = require('babel-runtime/core-js/map')

var _map2 = _interopRequireDefault(_map)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

var tags = new _map2.default()
var prevStyles = new _map2.default()

exports.default = typeof window === 'undefined'
  ? renderOnServer
  : renderOnClient

function renderOnServer() {}

function renderOnClient(styles) {
  patch(diff(prevStyles, styles))
  prevStyles = styles
}

function diff(a, b) {
  var added = (0, _from2.default)(b.entries()).filter(function(_ref) {
    var _ref2 = (0, _slicedToArray3.default)(_ref, 1), k = _ref2[0]

    return !a.has(k)
  })
  var removed = (0, _from2.default)(a.entries()).filter(function(_ref3) {
    var _ref4 = (0, _slicedToArray3.default)(_ref3, 1), k = _ref4[0]

    return !b.has(k)
  })
  return [added, removed]
}

var fromServer = new _map2.default()

function patch(_ref5) {
  var _ref6 = (0, _slicedToArray3.default)(_ref5, 2),
    added = _ref6[0],
    removed = _ref6[1]

  var _iteratorNormalCompletion = true
  var _didIteratorError = false
  var _iteratorError = undefined

  try {
    for (
      var _iterator = (0, _getIterator3.default)(added), _step;
      !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
      _iteratorNormalCompletion = true
    ) {
      var _step$value = (0, _slicedToArray3.default)(_step.value, 2),
        id = _step$value[0],
        css = _step$value[1]

      // Avoid duplicates from server-rendered markup
      if (!fromServer.has(id)) {
        fromServer.set(id, document.getElementById('__jsx-style-' + id))
      }

      var tag = fromServer.get(id) || makeStyleTag(css)
      tags.set(id, tag)
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

  var _iteratorNormalCompletion2 = true
  var _didIteratorError2 = false
  var _iteratorError2 = undefined

  try {
    for (
      var _iterator2 = (0, _getIterator3.default)(removed), _step2;
      !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done);
      _iteratorNormalCompletion2 = true
    ) {
      var _step2$value = (0, _slicedToArray3.default)(_step2.value, 1),
        id = _step2$value[0]

      var t = tags.get(id)
      tags.delete(id)
      t.parentNode.removeChild(t)
      // Avoid checking the DOM later on
      fromServer.delete(id)
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
}

function makeStyleTag(str) {
  // Based on implementation by glamor
  var tag = document.createElement('style')
  tag.appendChild(document.createTextNode(str))

  var head = document.head || document.getElementsByTagName('head')[0]
  head.appendChild(tag)

  return tag
}
