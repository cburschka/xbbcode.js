const XBBCode = require('./src/xbbcode.js');

const filter = XBBCode.create({
  b: '<strong>{content}</strong>',
  url: tag => `<a href="${tag.getOption()}">${tag.getContent()}</a>`,
});

const input = 'Hello [b][url=https://github.com/cburschka/xbbcode.js]world[/url][/b].';
console.log(">>>", input);
console.log(filter(input));
