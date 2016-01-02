xbbcode.js
==========

This is a JavaScript version of my xbbcode module for Drupal.

xbbcode parses arbitrary text to find a properly nested tree of BBCode tags in square brackets,
and renders these tags according to markup strings and rendering callbacks that it has been
given during parser creation.

Usage
=====

xbbcode.js creates a global function named `xbbcode`. To create a parser, 
this function is invoked with a single argument containing the mapping of BBCode
tags to output, in the form of `tagEngine` described below:

    tagEngine ::= {object} { tagName : (renderer | extended) }
    tagName   ::= {string} (must match /\w+/)
    extended  ::= {object} {
                      "body" : renderer
                   [, "selfclosing" : {bool} ]
                   [, "nocode"      : {bool} ]
                  }
    renderer  ::= {string} | {function}


A string renderer consists of any text with the following optional placeholders: 
`{content}`, `{option}`, `{name}`, or `{attr:attributeName}` for any attribute name. 
The following examples show what part of the input these placeholders will be replaced with.

* `[{name}={option}]{content}[/{name}]`
* `[{name} attributeName="{attr:attributeName}" attribute2="{attr:attribute2}"]{content}][/{name}]`

A function renderer receives a single argument, which is an object with the following properties: 
`content`, `option`, `name`, and `attrs`. The first three are the same as above; 
`attrs` is an object containing every attribute as a property.


Sample
------

    bbCodeTags = {
      b: '<strong>{content}</strong>',
      quote: '<q>{content}</q>',
      code: '<code>{content}</code>',
      url: function (tag) {
        return   '<a href="' 
               + 'http://example.com/outgoing?url='
               + encodeURI(tag.option)
               + '">' + tag.content + '</a>';
      },
      img: {
        body: '<img src="{content}" alt="Image({content}" />',
        nocode: true
      }
    };
    bbcodeParser = XBBCode(bbCodeTags);

    input = '[quote][code][url=http://example.org/][img]http://example.org/[b]image[/b].png[/img][/code][/url][/quote]';
    console.log(bbcodeParser.render(input);

    // Note that the [url] tag is improperly nested; it closes after the [code] tag.
    // It will therefore not be rendered, to avoid generating improperly
    // nested output markup.
    // The [img] tag is set not to allow BBCode inside it,
    // Which prevents the [b] tag from being rendered.
    >>> "<q><code>[url=http://example.org/]<img src="http://example.org/[b]image[/b].png" /></a></code>[/url]</q>"

LICENSE
=======

The MIT License (MIT)

Copyright (c) 2014-2015 Christoph Burschka

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
