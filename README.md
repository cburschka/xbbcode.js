xbbcode.js
==========

This is a JavaScript version of [XBBCode](https://drupal.org/project/xbbcode).

xbbcode parses arbitrary text to find a properly nested tree of BBCode tags in
square brackets, and renders these tags according to markup strings and
rendering callbacks that it has been given during parser creation.

Usage
=====

xbbcode.js creates an XBBCode class, which is also its only export.
(This way, the module can be used both via `require()` and by simple inclusion
in a web page.)

To create a parser, this class is instantiated with a single argument
containing the mapping of BBCode tags to output, in the form of `plugins`
described below:

    plugins   ::= { name : renderer }*
    name      ::= string (must match /\w+/)
    renderer  ::= string | function

A string renderer consists of any text with the following optional placeholders:
`{content}`, `{option}`, `{name}`, `{attribute.*}` or `{source} for any attribute name.

* In `[tag1=abc]xyz[/tag1]`, `{option}` is `abc` and `{content}` is `xyz`.
* In `[tag2 abc="xyz"][tag3][/tag3][/tag2]`, `{attribute.abc}` is `xyz`,
  `{source}` is `[tag3][/tag3]`, and `{content}` is whatever `[tag3][/tag3]`
  is rendered as.

The `{name}` placeholder is replaced with the tag name.

A function renderer receives a BBCodeElement instance as its only argument.
This object has the following methods, whose return values match the values
in the previous section:

- getName()
- getContent()
- getOption()
- getAttribute(key)
- getSource()

Sample
------

    const XBBCode = require('xbbcode');
    const filter = XBBCode.create({
      b:     '<strong>{content}</strong>',
      quote: '<q>{content}</q>',
      code:  '<code>{content}</code>',
      url:   tag =>
        (`<a href="http://example.com/outgoing?url=${encodeURI(tag.getOption())}">`
        + tag.getContent()
        + '</a>'),
      img:   '<img src="{source}" alt="Image({source}" />',
    });

    input = '[quote][code][url=http://example.org/][img]http://example.org/[b]image[/b].png[/img][/code][/url][/quote]';
    console.log(filter(input));

    // Note that the [url] tag is improperly nested; it closes after the [code] tag.
    // It will therefore not be rendered, to avoid generating improperly
    // nested output markup.
    // The [img] tag is set not to allow BBCode inside it,
    // Which prevents the [b] tag from being rendered.
    // "<q><code>[url=http://example.org/]<img src="http://example.org/[b]image[/b].png" /></a></code>[/url]</q>"

The recommended way to use xbbcode.js is to import the `src/xbbcode.js` file.

On legacy platforms, it may be necessary to run `make`, which uses Babel to
translate the file to a pre-ES2015 syntax, and then use `./xbbcode.js` in the
root folder.

LICENSE
=======

The MIT License (MIT)

Copyright (c) 2014-2016 Christoph Burschka

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
