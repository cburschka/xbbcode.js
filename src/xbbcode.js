/*!
 * xbbcode.js
 *
 * Copyright 2014-2015 Christoph Burschka
 * Released under the MIT license.
 */

const XBBCode = (() => {
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
  const XBBCode = class {
    constructor(plugins) {
      this.plugins = plugins;
    }

    render(text) {
      const tags = this.findTags(text);
      const tree = this.buildTree(tags, text);
      return tree.render();
    }

    lexer(text) {
      const tokens = [];
      const pattern = new RegExp(RE_TAG, 'gi');
      let match;
      let last = 0;
      while (match = pattern.exec(text)) {
        const {index} = match;
        const [tag, close, name, _, attributes] = match;
        if (!this.plugins[name]) return;
        tokens.push(
          text.substring(last, index),
          {
            tag, name, option,
            open: !!close,
            attributes: BBCodeElement.parseAttributes(attributes),
          }
        );
        last = index + tag.length;
      }
      return tokens;
    }

    parse(tokens) {
      // Initialize tag counter.
      const countOpen = {};
      tokens.forEach(token => {
        if (token.name) countOpen[token.name] = 0;
      });

      const stack = new Stack(new BBCodeElement());
      tokens.forEach(token => {
        if (typeof token === 'string') return stack.last().append(token);

        const {tag, name, open, option, attributes} = token;
        const plugin = this.plugins[name];

        if (open) {
          stack.push(new BBCodeElement(plugin, token));
          countOpen[name]++;
        }

        // Found a closing tag that matches an open one.
        else if (countOpen[name]) {
          // Break all dangling tags inside the one that just closed.
          while (stack.last().name != name) {
            // Break a tag by appending its element and content to its parent.
            const broken = stack.pop();
            stack.last().append(broken.tag, broken.children);
            countOpen[broken.name]--;
          }

          const closed = stack.pop();
          stack.last().append(closed);
          countOpen[name]--;
        }
      });

      // Break the dangling open tags.
      while (stack.length > 1) {
        const broken = stack.pop();
        stack.last().append(broken.tag, broken.children);
      }
      return stack[0];
    }
  }

  const BBCodeElement = class {
    constructor(plugin, token) {
      this.plugin = plugin;
      this.token = token;
      this.name = token.name;
      this.children = [];
    }

    getContent() {
      if (this.content === undefined) this.content = this.children
        .map(child => child.render ? child.render() : child)
        .join('');
      return this.content;
    }

    getSource() {
      if (this.source === undefined) this.source = this.children
        .map(child => child.getSource ? child.getSource() : child)
        .join('');
      return this.source;
    }

    append(...children) {
      children.push(...[].concat(children));
    }

    render() {
      const renderer = this.plugin.body || this.plugin;
      if (typeof renderer === 'function') return renderer(this);
      if (typeof renderer === 'string') {
        // Replace placeholders of the form {x}, but allow escaping
        // literal braces with {{x}}.
        return renderer.replace(/\{(?:(attribute:)?(\w+)|(\{\w+\}))\}/g, function(_, attr, key, escape) {
          if (escape) return escape;
          if (attr) return this.attributes[key] || '';
          if (key == 'content') return this.getContent();
          if (key == 'name') return this.name;
          if (key == 'option') return this.option || '';
          return '';
        });
      }
    }

    static parseAttributes(text) {
      const attributes = {};
      const pattern = new RegExp(RE_ATTRIBUTE, 'gi');
      let match;
      while (match = pattern.exec(text)) {
        const [_, key, __, value] = match;
        attributes[key] = value;
      }
      return attributes;
    }
  }

  // Match a quote, optionally.
  const RE_QUOTE = '"|\'|&(?:quot|#039);|';
  // Match an attribute (key=value pair).
  // The attribute value concludes after the same quote (if any) is
  // re-encountered followed by a white-space character, ], or the string end.
  // (string end cannot occur when matching a full tag).
  const RE_ATTRIBUTE = '\\s+(\\w+)=(' + RE_QUOTE + ')(.*?)\\2(?=\\s|\\]|$)';
  const RE_TAG  = '\\[(\\/?)' + // Match the [ and an optional /.
                '(\\w+)' +      // The tag name has no white space.
                '(?:' +
                  '=(' + RE_QUOTE + ')(.*?)\\3(?=\\])' + // =option
                  '|(\\s+(\\w+)=(' + RE_QUOTE + ')(.*?)\\7(?=\\s|\\]|$)+)' + // attributes
                '(?=\\1))?' + // reject closing tags with attributes.
                '\\]'; // match the final ].

  const Stack = class extends Array {
    last() {
      return this[this.length - 1];
    }
  }

  if (module) module.exports = {XBBCode, BBCodeElement}
  return XBBCode;
})();
