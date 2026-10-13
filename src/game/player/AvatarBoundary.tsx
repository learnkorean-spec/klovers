import { Component, type ReactNode } from "react";

/**
 * If the rigged people cannot load (an old browser, a blocked download, a
 * decoder the page may not run), the world keeps going with the simple
 * figures instead of failing as a whole.
 */
export default class AvatarBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.warn("[world] rigged people unavailable, using simple figures", e);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
