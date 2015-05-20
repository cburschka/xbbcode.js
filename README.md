xbbcode.js
==========

A JavaScript port of my xbbcode module for Drupal.

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

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
