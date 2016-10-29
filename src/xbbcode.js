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
    constructor(tagEngine) {
      this.tagEngine = tagEngine;
    }

    render(text) {
      return processTags(text, findTags(text), this.tagEngine);
    }
  }

  // Match a quote, optionally.
  const quote = '"|\'|&(?:quot|#039);|';
  // Match an attribute (key=value pair).
  // The attribute value concludes after the same quote (if any) is
  // re-encountered followed by a white-space character, ], or the string end.
  // (string end cannot occur when matching a full tag).
  const re_attr = '\\s+(\\w+)=(' + quote + ')(.*?)\\2(?=\\s|\\]|$)';
  const re_tag  = '\\[(\\/?)' + // Match the [ and an optional /.
                '(\\w+)' +      // The tag name has no white space.
                '(?:' +
                  '=(' + quote + ')(.*?)\\3(?=\\])' + // =option
                  '|(\\s+(\\w+)=(' + quote + ')(.*?)\\7(?=\\s|\\]|$)+)' + // attributes
                '(?=\\1))?' + // reject closing tags with attributes.
                '\\]'; // match the final ].

  const findTags = text => {
    const tags = [];
    const re = new RegExp(re_tag, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      tags.push({
        open: m[1] === '',
        name: m[2],
        option: m[4],
        attrs: parseAttributes(m[5]),
        tag: m[0],
        start: m.index,
        end: m.index + m[0].length,
        offset: m.index + m[0].length,
        content: ''
      });
    }
    return tags;
  };

  const parseAttributes = text => {
    const attrs = {};
    const re = new RegExp(re_attr, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      attrs[m[1]] = m[3];
    }
    return attrs;
  };

  const processTags = (text, tags, tagEngine) => {
    // Initialize tag counter.
    const openByName = {};
    tags.forEach(({name}) => {
      openByName[name] = 0;
    });

    const root = {content: '', start: 0, offset: 0};
    const stack = [root];
    let parent;

    tags.forEach(tag => {
      parent = stack[stack.length-1];
      let renderer = tagEngine[tag.name];
      if (!renderer) return;

      // Append everything before this tag to the last open one.
      parent.content += text.substring(parent.offset, tag.start);
      parent.offset = tag.start;

      // Found a new opening tag.
      if (tag.open) {
        // If the tag is self-closing, render and append.
        if (renderer.selfclosing) {
          parent.content += String(renderTag(tag, renderer));
          parent.offset = tag.end;
        }
        else {
          stack.push(tag);
          openByName[tag.name]++;
        }
      }
      // Found a closing tag that matches an opening one.
      else if (openByName[tag.name] > 0) {
        parent.offset = tag.end; // Skip past the closing tag.
        // Break open tags until we get to the right one.
        let current = stack.pop();
        openByName[current.name]--;
        parent = stack[stack.length-1];

        while (stack && current.name != tag.name) {
          // Break a tag by appending its element and content to its parent.
          parent.content += current.tag + current.content;
          parent.offset = current.offset;

          current = stack.pop();
          openByName[current.name]--;
          parent = stack[stack.length-1];
        }

        // If the tag forbids rendering its content, revert to unrendered.
        if (renderer.nocode)
          current.content = text.substring(current.end, current.offset);
        parent.content += String(renderTag(current, renderer));
        parent.offset = tag.end;
      }
    });

    // Append the remainder of the text to the last open tag.
    parent = stack[stack.length-1];
    parent.content += text.substring(parent.offset);

    // Break the dangling open tags.
    while (stack.length > 1) {
      current = stack.pop();
      parent = stack[stack.length-1];
      parent.content += current.tag + current.content;
    }
    return root.content;
  };

  function renderTag(tag, renderer) {
    if (typeof renderer === 'object') {
      renderer = renderer.body;
    }
    if (typeof renderer === 'function') {
      return renderer({
        name: tag.name,
        option: tag.option,
        attrs: tag.attrs,
        content: tag.content
      });
    }
    else if (typeof renderer === 'string') {
      // Replace placeholders of the form {x}, but allow escaping
      // literal braces with {{x}}.
      return renderer.replace(/\{(?:(attr:)?(\w+)|(\{\w+\}))\}/g, function(_, attr, key, esc) {
        if (esc) return esc;
        else if (attr) {
          if (tag.attrs && tag.attrs[key]) return tag.attrs[key];
        }
        else {
          if (key == 'content') return tag.content;
          if (key == 'name') return tag.name;
          if (tag.option && key == 'option') return tag.option;
        }
        return '';
      });
    }
  };

  return XBBCode;
})();
