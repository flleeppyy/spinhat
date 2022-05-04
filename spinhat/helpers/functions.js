const terser = require("terser");

function getFunctionBody(fn) {
  const fnStr = fn.toString();
  const fnBody = fnStr.substring(fnStr.indexOf("{") + 1, fnStr.lastIndexOf("}"));
  console.log(fnBody, fnStr);
  return fnBody;
}

async function getMinifiedFunctionBody(fn) {
  const fnBody = getFunctionBody(fn);
  return terser.minify(fnBody);
}
module.exports = {
  getFunctionBody,
  getMinifiedFunctionBody
}