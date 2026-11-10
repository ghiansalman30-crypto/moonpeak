// Entry used by every built View: connect to the host, then render the resource component.
import { Component, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { start } from "./store.js";

class Boundary extends Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return createElement(
      "pre",
      { style: { padding: 16, margin: 0, color: "#c0392b", font: "13px/1.5 ui-monospace, monospace", whiteSpace: "pre-wrap" } },
      String(this.state.error?.stack || this.state.error),
    );
  }
}

export function mount(App, info = {}) {
  start(info);
  let el = document.getElementById("root");
  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
  }
  const root = createRoot(el);
  const render = (C) => root.render(createElement(StrictMode, null, createElement(Boundary, { key: Math.random() }, createElement(C))));
  render(App);
  // Used by the dev entry for hot updates: swap the component, keep the host connection and app state.
  return { root, update: render };
}
