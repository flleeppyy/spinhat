// @ts-check
/// <reference path="../typings/spinhatplugin.d.ts" />

/**
 * @abstract
 */
module.exports = class SpinHatPlugin {
  /**
   * @type {string}
   */
  name;

  /**
   * @type {string}
   */
  description;

  /**
   * @type {string}
   */
  author;

  /**
   * @type {settingsObject}
   */
  settings = {};

  /**
   * @type {patch[]}
   */
  patches = [];

  /**
   * @type {() => void | undefined}
   */
  onDOMReady;

  /**
   * @type {() => void | undefined}
   */
  onLoad;
};
