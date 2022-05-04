const SpinHatPlugin = require("../classes/SpinHatPlugin");
class ReactDevtools extends SpinHatPlugin {

  name = "React Devtools";
  description = "Allows you to use the React Devtools";

  // patches = [
  //   {
  //     for: "web",
  //     match: "window.__REACT_DEVTOOLS_GLOBAL_HOOK__",
  //   }
  // ],

  onLoad() {
    // https://gist.github.com/mathiasbynens/1143845
    var gm_uwin = (function(){
      var a;
      try {
          a = unsafeWindow == window ? false : unsafeWindow; // Chrome: window == unsafeWindow
      } catch(e) { }
      return a || (function(){
              var el = document.createElement('p');
              el.setAttribute('onclick', 'return window;');
              return el.onclick();
          }());
    }());

    // DevTools Anti-Detector https://greasyfork.org/eo/scripts/41559-devtools-anti-detector
    let knownRoots = new WeakSet();
    function wrapRegExp(root) {
        if (knownRoots.has(root))
            return;
        let _proto = void 0;
        try {
            _proto = root.RegExp.prototype;
        } catch(ignore) {
            return;
        }
        // Prevent RegExpt + toString trick (technically possible with any other object, but I encountered only this one
        let _RE_tS = Object.getOwnPropertyDescriptor(_proto, 'toString');
        let _RE_tSV = _RE_tS.value || _RE_tS.get();
        let fts = Function.prototype.toString;
        Object.defineProperty(_proto, 'toString', {
            enumerable: _RE_tS.enumerable,
            configurable: _RE_tS.configurable,
            get: () => _RE_tSV,
            set: function(val) {
                console.warn('Attempt to change toString for', this, 'with', fts.call(val));
                //throw 'stop it!';
                return true;
            }
        });
    }

    wrapRegExp(unsafeWindow);

    let _contentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
    let _get_contentWindow = _contentWindow.get;
    _contentWindow.get = function() {
        let _cw = _get_contentWindow.apply(this, arguments);
        if (_cw)
            wrapRegExp(_cw);
        return _cw;
    };
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', _contentWindow);
  }
}