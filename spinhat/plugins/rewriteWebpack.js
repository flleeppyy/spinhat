
const { writeFileSync } = require("fs");
const SpinHatPlugin = require("../classes/SpinHatPlugin");
const { getMinifiedFunctionBody, getFunctionBody } = require("../helpers/functions");
module.exports = class rewriteWebpack extends SpinHatPlugin {
  name = "Rewrite Webpack";
  description = "Replace webpack with a custom webpack, with development mode \"enabled\"";
  author = "Flleeppyy";

  patches = [
    {
      for: "webpreload",
      match: /\(\(\)=>{var t=({.*}}),e={};.*n\(n\.s=(.*)\)}\)\(\);/,
      replace: (original, moduleObject, entryPointModule) => {
        return webpack(moduleObject, parseInt(entryPointModule));
      }
    },
    {
      for: "client",
      match: /\(\(\)=>{var t=({.*}}),e={};.*n\(n\.s=(.*)\)}\)\(\);/,
      replace: (original, moduleObject, entryPointModule) => {
        return webpack(moduleObject, parseInt(entryPointModule));
      }
    }
  ];
}
/**
 *
 * @param {string} modules string
 * @param {number} entrypoint entry point number
 * @returns
 */
function webpack(modules, entrypoint) {
  return `
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

  exports["default"] = __webpack_exports__["default"];
  Object.defineProperty(exports, "__esModule", { value: true });
  __webpack_require__((__webpack_require__.main = ${entrypoint}));
})();`

}

