//@ts-check
/**
Notes
helpful: https://devtools.tech/blog/understanding-webpacks-require---rid---7VvMusDzMPVh17YyHdyL
*/
const { writeFileSync, readFileSync } = require("fs");
const SpinHatPlugin = require("../classes/SpinHatPlugin");
const { getMinifiedFunctionBody, getFunctionBody } = require("../helpers/functions");
// module.exports = class rewriteWebpack extends SpinHatPlugin {
//   name = "Rewrite Webpack";
//   description = "Replace webpack with a custom webpack, with development mode \"enabled\"";
//   author = "Flleeppyy";

//   patches = [
//     {
//       for: "webpreload",
//       match: /\(\(\)=>{var t=({.*}}),e={};.*n\(n\.s=(.*)\)}\)\(\);/,
//       replace: (original, moduleObject, entryPointModule) => {
//         return webpack(moduleObject, parseInt(entryPointModule));
//       }
//     },
//     {
//       for: "client",
//       match: /\(\(\)=>{var t=({.*}}),e={};.*n\(n\.s=(.*)\)}\)\(\);/,
//       replace: (original, moduleObject, entryPointModule) => {
//         return webpack(moduleObject, parseInt(entryPointModule));
//       }
//     }
//   ];
// }

/**
 *
 * @param {string} modules string
 * @param {number} entrypoint entry point number
 * @param {boolean} callImmediately if true, call the entrypoint immediately
 * @returns
 */
function webpack(modules, entrypoint, webpackPrefix = "", callImmediately = false) {
  let entryFunction = "";
  let returnstring = `
(() => {
  var __webpack_modules__ = ${modules};
  var __webpack_module_cache__ = {};

  function __webpack_require__(moduleId) {
    // Check if module is in cache
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== undefined) {
      return cachedModule.exports;
    }
    // Create a new module (and put it into the cache)
    var module = __webpack_module_cache__[moduleId] = {
      // no module.id needed
      // no module.loaded needed
      exports: {}
    };

    // Execute the module function
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);

    // Return the exports of the module
    return module.exports;
  }

  (() => {
    // getDefaultExport function for compatibility with non-harmony modules
    __webpack_require__.n = (module) => {
      var getter = module && module.__esModule ?
        () => (module['default']) :
        () => (module);
      __webpack_require__.d(getter, { a: getter });
      return getter;
    };
  })();

  (() => {
    // define getter functions for harmony exports
    __webpack_require__.d = (exports, definition) => {
      for(var key in definition) {
        if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
          Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
        }
      }
    };
  })();

  // hmd
  (() => {
    __webpack_require__.hmd = function(module) {
      module = Object.create(module);
      if (!module.children) module.children = [];
      Object.defineProperty(module, 'exports', {
        enumerable: true,
        set: function() {
          throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + module.id);
        }
      });
      return module;
    }
  })();

  (() => {
    __webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
  })();

  /* webpack/runtime/make namespace object */
  (() => {
    // define __esModule on exports
    __webpack_require__.r = (exports) => {
      if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
      }
      Object.defineProperty(exports, '__esModule', { value: true });
    };
  })();
  var __webpack_exports__ = {};

  __webpack_require__.nmd = (t) => ((t.paths = []), t.children || (t.children = []), t);

  exports["default"] = __webpack_exports__["default"];
  Object.defineProperty(exports, "__esModule", { value: true });
  //__webpack_require__((__webpack_require__.s = ${entrypoint}));

  // expose the modules object (__webpack_modules__)
  __webpack_require__.m = __webpack_modules__;

  // expose the module cache
  __webpack_require__.c = __webpack_module_cache__;

  // __webpack_public_path__
  __webpack_require__.p = "";
  // var n = __webpack_require__;

  globalThis.${webpackPrefix}__webpack_require__ = __webpack_require__;
  let load = () => {
    var hjf = __webpack_require__((__webpack_require__.s = ${entrypoint}));
    load = () => {};
    return hjf;
  }

  __webpack_require__.load = load;

${callImmediately ? `
  // Load entry module
  return load();
  // return __webpack_require__((__webpack_require__.s = ${entrypoint}));
` : ""}
})()`

  return returnstring;
}
/**
 * Wrap the webpack function with a custom webpack function
 * @param {*} filename Path to file that contains webpack
 * @param {*} webpackPrefix Prefix to add to the global webpack variable
 * @param {*} callImmediately If true, call the entrypoint immediately
 * @returns {{buffer: Buffer, entrypoint: number}} webpackPrefix?+__webpack_require__
 */
function wrapWebpack(filename, webpackPrefix = "", callImmediately = false) {
  // read the file
  console.log(filename, webpackPrefix, callImmediately);
  /**
   * @type {string}
   */
  let file = readFileSync(filename, "utf8");

  let entrypoint = null;

  file = file.replace(/\(\(\)=>{var t=({.*}}),e={};.*n\(n\.s=(.*)\)}\)\(\);/, (original, modulesObject, entryPointModule) => {
    entrypoint = entryPointModule;
    return webpack(modulesObject, parseInt(entryPointModule), webpackPrefix, callImmediately);
  });
  // console.log(file);

  // write the file
  return {
    buffer: Buffer.from(file),
    entrypoint,
  }
}

module.exports = {
  wrapWebpack,
}