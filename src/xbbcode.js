/*!
 * xbbcode.js
 *
 * Copyright 2014-2015 Christoph Burschka
 * Released under the MIT license.
 */

((global, factory) => {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  global.XBBCode = factory();
})(window, () => {
  /**
   * Generate a new XBBCode parser.
   *
   * @param tags An object keyed by tag name, the values being strings or functions.
   *
   * A render function will receive a BBCodeElement object with the methods
   * getContent(), getSource(), getAttribute(), getOption() and getName().
   * A template string may contain the placeholders
  *  {content}, {source}, {attribute.*}, {option} and {name}.
   */
  const XBBCode = class {
    static create(plugins) {
      const processor = new XBBCode(plugins);
      return text => processor.process(text);
    }

    constructor(plugins) {
      this.plugins = plugins;
    }

    process(text) {
      return this.parser(this.lexer(text)).render();
    }

    lexer(text) {
      const tokens = [];
      const pattern = new RegExp(RE_TAG, 'gi');
      let match;
      let last = 0;
      while (match = pattern.exec(text)) {
        const {index} = match;
        const [tag, close, name, _, option, attributes] = match;
        if (!this.plugins[name]) continue;
        tokens.push(
          text.substring(last, index),
          {tag, name, option, attributes, open: !close}
        );
        last = index + tag.length;
      }
      tokens.push(text.substring(last));
      return tokens;
    }

    parser(tokens) {
      // Initialize tag counter.
      const countOpen = {};
      tokens.forEach(token => {
        if (token.name) countOpen[token.name] = 0;
      });

      const stack = new Stack(new BBCodeElement(tag => tag.getContent()));
      tokens.forEach(token => {
        if (typeof token === 'string') return stack.top().append(token);

        const {tag, name, open, option, attributes} = token;
        const plugin = this.plugins[name];

        if (open) {
          stack.push(new BBCodeElement(plugin, token));
          countOpen[name]++;
        }

        // Found a closing tag that matches an open one.
        else if (countOpen[name]) {
          // Break all dangling tags inside the one that just closed.
          while (stack.top().getName() != name) {
            // Break a tag by appending its element and content to its parent.
            const broken = stack.pop();
            stack.top().append(...broken.break());
            countOpen[broken.getName()]--;
          }

          const closed = stack.pop();
          stack.top().append(closed);
          countOpen[name]--;
        }
        // Found a closing tag that wasn't open; just print it.
        else stack.top().append(tag);
      });

      // Break the dangling open tags.
      while (stack.size() > 1) {
        const broken = stack.pop();
        stack.top().append(...broken.break());
      }
      return stack.pop();
    }
  }

  const BBCodeElement = class {
    constructor(plugin, token) {
      this.children = [];
      this.plugin = plugin;
      this.token = token || {};
    }

    break() {
      return [this.token.tag, ...this.children];
    }

    getContent() {
      if (this.content === undefined) this.content = this.children
        .map(child => child.render ? child.render() : child)
        .join('');
      return this.content;
    }

    getName() {
      return this.token.name;
    }

    getOption() {
      return this.token.option;
    }

    getAttribute(key) {
      if (!this.attributes) this.parseAttributes();
      return this.attributes[key];
    }

    getSource() {
      if (this.source === undefined) this.source = this.children
        .map(child => child.getSource ? child.getSource() : child)
        .join('');
      return this.source;
    }

    append(...children) {
      this.children.push(...children);
    }

    render() {
      const renderer = (typeof this.plugin === 'function') ?
        this.plugin :
        // Replace placeholders of the form {x}, but allow escaping
        // literal braces with {{x}}.
        tag => this.plugin.replace(/\{(?:(attribute\.)?(\w+)|(\{\w+\}))\}/g, (_, attr, key, escape) => {
          if (escape) return escape;
          if (attr) return this.getAttribute(key) || '';
          switch (key) {
            case 'content': return this.getContent();
            case 'name':    return this.getName();
            case 'option':  return this.getOption();
            case 'source':  return this.getSource();
          }
          return '';
        });
      return renderer(this);
    }

    parseAttributes() {
      this.attributes = {};
      const pattern = new RegExp(RE_ATTRIBUTE, 'gi');
      let match;
      while (match = pattern.exec(this.token.attributes)) {
        const [_, key, __, value] = match;
        this.attributes[key] = value;
      }
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

  const Stack = class {
    constructor(...x) {
      this.arr = [...x];
    }
    pop() {
      return this.arr.pop();
    }
    push(...x) {
      return this.arr.push(...x);
    }
    top() {
      return this.arr[this.arr.length - 1];
    }
    size() {
      return this.arr.length;
    }
  }

  return XBBCode;
});
