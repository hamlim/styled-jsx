'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})

var _getIterator2 = require('babel-runtime/core-js/get-iterator')

var _getIterator3 = _interopRequireDefault(_getIterator2)

var _map = require('babel-runtime/core-js/map')

var _map2 = _interopRequireDefault(_map)

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of')

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf)

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck')

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2)

var _createClass2 = require('babel-runtime/helpers/createClass')

var _createClass3 = _interopRequireDefault(_createClass2)

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn')

var _possibleConstructorReturn3 = _interopRequireDefault(
  _possibleConstructorReturn2
)

var _inherits2 = require('babel-runtime/helpers/inherits')

var _inherits3 = _interopRequireDefault(_inherits2)

exports.flush = flush

var _react = require('react')

var _render = require('./render')

var _render2 = _interopRequireDefault(_render)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

var components = []

var _class = (function(_Component) {
  ;(0, _inherits3.default)(_class, _Component)

  function _class() {
    ;(0, _classCallCheck3.default)(this, _class)
    return (0, _possibleConstructorReturn3.default)(
      this,
      (_class.__proto__ || (0, _getPrototypeOf2.default)(_class))
        .apply(this, arguments)
    )
  }

  ;(0, _createClass3.default)(_class, [
    {
      key: 'componentWillMount',
      value: function componentWillMount() {
        mount(this)
      }

      // To avoid FOUC, we process new changes
      // on `componentWillUpdate` rather than `componentDidUpdate`.
    },
    {
      key: 'componentWillUpdate',
      value: function componentWillUpdate(nextProps) {
        update({
          instance: this,
          styleId: nextProps.styleId,
          css: nextProps.css
        })
      }
    },
    {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        unmount(this)
      }
    },
    {
      key: 'render',
      value: function render() {
        return null
      }
    }
  ])
  return _class
})(_react.Component)

exports.default = _class

function stylesMap(updated) {
  var ret = new _map2.default()
  var _iteratorNormalCompletion = true
  var _didIteratorError = false
  var _iteratorError = undefined

  try {
    for (
      var _iterator = (0, _getIterator3.default)(components), _step;
      !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
      _iteratorNormalCompletion = true
    ) {
      var c = _step.value

      if (updated && c === updated.instance) {
        // On `componentWillUpdate`
        // we use `styleId` and `css` from updated component rather than reading `props`
        // from the component since they haven't been updated yet.
        ret.set(updated.styleId, updated.css)
      } else {
        ret.set(c.props.styleId, c.props.css)
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

  return ret
}

function flush() {
  var ret = stylesMap()
  components = []
  return ret
}

function mount(component) {
  components.push(component)
  update()
}

function unmount(component) {
  var i = components.indexOf(component)
  if (i < 0) {
    return
  }

  components.splice(i, 1)
  update()
}

function update(updates) {
  ;(0, _render2.default)(stylesMap(updates))
}
