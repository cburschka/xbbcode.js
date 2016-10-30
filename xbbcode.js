'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * xbbcode.js
 *
 * Copyright 2014-2015 Christoph Burschka
 * Released under the MIT license.
 */

var XBBCode = function () {
  /**
   * Generate a new XBBCode parser.
   *
   * @param tags: {object} (tagName : (renderer | extended))
   *        tagName: {string}
   *        renderer: {string} | {function}
   *        extended: {object} {
   *          "renderer": renderer,
   *          ["selfclosing": {bool} ,]
   *          ["nocode": {bool} ,]
   *        }
   *
   * The render function will receive a tag object with the keys
   * "content", "option", "attrs" (keyed by attribute name) and "name".
   * the render string may contain the placeholders {content}, {option}, {name},
   * or any attribute key.
   */
  var XBBCode = function () {
    function XBBCode(plugins) {
      _classCallCheck(this, XBBCode);

      this.plugins = plugins;
    }

    _createClass(XBBCode, [{
      key: 'render',
      value: function render(text) {
        var tags = this.findTags(text);
        var tree = this.buildTree(tags, text);
        return tree.render();
      }
    }, {
      key: 'lexer',
      value: function lexer(text) {
        var tokens = [];
        var pattern = new RegExp(RE_TAG, 'gi');
        var match = void 0;
        var last = 0;
        while (match = pattern.exec(text)) {
          var _match = match;
          var index = _match.index;
          var _match2 = match;

          var _match3 = _slicedToArray(_match2, 5);

          var tag = _match3[0];
          var close = _match3[1];
          var name = _match3[2];
          var _ = _match3[3];
          var attributes = _match3[4];

          if (!this.plugins[name]) return;
          tokens.push(text.substring(last, index), {
            tag: tag, name: name, option: option,
            open: !!close,
            attributes: BBCodeElement.parseAttributes(attributes)
          });
          last = index + tag.length;
        }
        return tokens;
      }
    }, {
      key: 'parse',
      value: function parse(tokens) {
        var _this = this;

        // Initialize tag counter.
        var countOpen = {};
        tokens.forEach(function (token) {
          if (token.name) countOpen[token.name] = 0;
        });

        var stack = new Stack(new BBCodeElement());
        tokens.forEach(function (token) {
          if (typeof token === 'string') return stack.last().append(token);

          var tag = token.tag;
          var name = token.name;
          var open = token.open;
          var option = token.option;
          var attributes = token.attributes;

          var plugin = _this.plugins[name];

          if (open) {
            stack.push(new BBCodeElement(plugin, token));
            countOpen[name]++;
          }

          // Found a closing tag that matches an open one.
          else if (countOpen[name]) {
              // Break all dangling tags inside the one that just closed.
              while (stack.last().name != name) {
                // Break a tag by appending its element and content to its parent.
                var broken = stack.pop();
                stack.last().append(broken.tag, broken.children);
                countOpen[broken.name]--;
              }

              var closed = stack.pop();
              stack.last().append(closed);
              countOpen[name]--;
            }
        });

        // Break the dangling open tags.
        while (stack.length > 1) {
          var broken = stack.pop();
          stack.last().append(broken.tag, broken.children);
        }
        return stack[0];
      }
    }]);

    return XBBCode;
  }();

  var BBCodeElement = function () {
    function BBCodeElement(plugin, token) {
      _classCallCheck(this, BBCodeElement);

      this.plugin = plugin;
      this.token = token;
      this.name = token.name;
      this.children = [];
    }

    _createClass(BBCodeElement, [{
      key: 'getContent',
      value: function getContent() {
        if (this.content === undefined) this.content = this.children.map(function (child) {
          return child.render ? child.render() : child;
        }).join('');
        return this.content;
      }
    }, {
      key: 'getSource',
      value: function getSource() {
        if (this.source === undefined) this.source = this.children.map(function (child) {
          return child.getSource ? child.getSource() : child;
        }).join('');
        return this.source;
      }
    }, {
      key: 'append',
      value: function append() {
        for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
          children[_key] = arguments[_key];
        }

        children.push.apply(children, _toConsumableArray([].concat(children)));
      }
    }, {
      key: 'render',
      value: function render() {
        var renderer = this.plugin.body || this.plugin;
        if (typeof renderer === 'function') return renderer(this);
        if (typeof renderer === 'string') {
          // Replace placeholders of the form {x}, but allow escaping
          // literal braces with {{x}}.
          return renderer.replace(/\{(?:(attribute:)?(\w+)|(\{\w+\}))\}/g, function (_, attr, key, escape) {
            if (escape) return escape;
            if (attr) return this.attributes[key] || '';
            if (key == 'content') return this.getContent();
            if (key == 'name') return this.name;
            if (key == 'option') return this.option || '';
            return '';
          });
        }
      }
    }], [{
      key: 'parseAttributes',
      value: function parseAttributes(text) {
        var attributes = {};
        var pattern = new RegExp(RE_ATTRIBUTE, 'gi');
        var match = void 0;
        while (match = pattern.exec(text)) {
          var _match4 = match;

          var _match5 = _slicedToArray(_match4, 4);

          var _ = _match5[0];
          var key = _match5[1];
          var __ = _match5[2];
          var value = _match5[3];

          attributes[key] = value;
        }
        return attributes;
      }
    }]);

    return BBCodeElement;
  }();

  // Match a quote, optionally.
  var RE_QUOTE = '"|\'|&(?:quot|#039);|';
  // Match an attribute (key=value pair).
  // The attribute value concludes after the same quote (if any) is
  // re-encountered followed by a white-space character, ], or the string end.
  // (string end cannot occur when matching a full tag).
  var RE_ATTRIBUTE = '\\s+(\\w+)=(' + RE_QUOTE + ')(.*?)\\2(?=\\s|\\]|$)';
  var RE_TAG = '\\[(\\/?)' + // Match the [ and an optional /.
  '(\\w+)' + // The tag name has no white space.
  '(?:' + '=(' + RE_QUOTE + ')(.*?)\\3(?=\\])' + // =option
  '|(\\s+(\\w+)=(' + RE_QUOTE + ')(.*?)\\7(?=\\s|\\]|$)+)' + // attributes
  '(?=\\1))?' + // reject closing tags with attributes.
  '\\]'; // match the final ].

  var Stack = function (_Array) {
    _inherits(Stack, _Array);

    function Stack() {
      _classCallCheck(this, Stack);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(Stack).apply(this, arguments));
    }

    _createClass(Stack, [{
      key: 'last',
      value: function last() {
        return this[this.length - 1];
      }
    }]);

    return Stack;
  }(Array);

  if (module) module.exports = { XBBCode: XBBCode, BBCodeElement: BBCodeElement };
  return XBBCode;
}();
