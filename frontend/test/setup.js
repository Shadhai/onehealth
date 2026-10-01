import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

globalThis.React = React;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!window.scrollTo) {
  window.scrollTo = () => {};
}

const origError = console.error;
console.error = (...args) => {
  const msg = String(args[0] || "");
  if (
    msg.includes("ReactDOM.render is no longer supported") ||
    msg.includes("not wrapped in act")
  ) {
    return;
  }
  origError.apply(console, args);
};
