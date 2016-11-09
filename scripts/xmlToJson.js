'use strict';

module.exports = xml => {
  xml = xml.replace(/>\s+/g, '>').
        replace(/<\s+/g, '<').
        replace(/^<\?[^>]+>/, '');

  const stack = [{}];
  const tagStack = [];

  while (xml.length) {
    let o = stack[stack.length - 1];
    const oldTag = tagStack[tagStack.length - 1];
    let tag;

    if (xml[0] === '<') {
      tag = xml.substr(0, xml.indexOf('>', 1) + 1);
      xml = xml.slice(tag.length);

      if (tag[tag.length - 2] === '/') {
        tag = tag.replace(/^<\s*([^\s]+)\s*\/>$/gi, '$1');
        o[tag] = '';
      } else if (tag[1] === '/') {
        tag = tag.replace(/^<\/([^\s]+)>$/, '$1');
        stack.pop();
        tagStack.pop();
      } else {
        tag = tag.replace(/^<([^\s]+)>$/, '$1');

        if (o[tag]) {
          if (!o[tag].length) {
            o[tag] = [o[tag]];
          }

          var n = '';
          o[tag].push(n);
          stack.push(n);
          tagStack.push(tag);
        } else {
          if (typeof o === 'string') {
            stack[stack.length - 1] = {};
            if (stack[stack.length - 2][oldTag].length) {
              stack[stack.length - 2][oldTag][stack[stack.length - 2][oldTag].length - 1] = stack[stack.length - 1];
            } else {
              stack[stack.length - 2][oldTag] = stack[stack.length - 1];
            }
            o = stack[stack.length - 1];
          }

          o[tag] = '';
          stack.push(o[tag]);
          tagStack.push(tag);
        }
      }
    } else {
      tag = xml.substr(0, xml.indexOf('<', 1));

      xml = xml.slice(tag.length);

      stack[stack.length - 1] = tag;
      stack[stack.length - 2][oldTag] = stack[stack.length - 1];
    }
  }
  return stack[0];
};