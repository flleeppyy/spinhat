type settingsObject = {
  [key: string]:? {
    type: "boolean" | "value" | "key-value" | "list",
    default: any,
  };
};

type patch = {
  for: "preload" | "webpreload" | "client",
  match: string | RegExp,
  replace: string | ((substring: string, ...args: any[]) => string),
};