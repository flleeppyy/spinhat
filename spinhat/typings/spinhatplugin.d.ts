type settingsObject = {
  [key: string]:? {
    type: "boolean" | "value" | "key-value" | "list",
    default: any,
  };
};

type patch = {
  for: "main" | "webpreload" | "client",
  match: string | RegExp,
  moduleMatch: string | RegExp,
  replace: string | ((substring: string, ...args: any[]) => string),
};