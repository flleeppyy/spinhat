const SpinHatPlugin = require("../classes/SpinHatPlugin");

class ReactDevtools extends SpinHatPlugin {

  name = "React Devtools";
  description = "Replaces react with the development version, which has devtools enabled.";

  patches = [
    {
      for: "web",
      moduleMatch: /[a-z]=60103,[a-z]=60106;[a-z]\.Fragment=60107,[a-z]\.StrictMode=60108,.\.Profiler=60114./,
      replace: async (original) => {

      },
    }
  ]


}