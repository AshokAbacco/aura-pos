import { Component } from "react";
import { LuTriangleAlert, LuRefreshCw } from "react-icons/lu";

/**
 * Keeps one broken page from blanking the whole app. If a page's code chunk failed to download
 * (common right after a new version is deployed, or on a flaky phone connection), reload once.
 */
export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    const chunk =
      /Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
        String(error?.message),
      );
    if (chunk && !sessionStorage.getItem("aura.chunkReload")) {
      sessionStorage.setItem("aura.chunkReload", "1");
      window.location.reload();
      return;
    }
    console.error(error);
  }
  componentDidMount() {
    sessionStorage.removeItem("aura.chunkReload");
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center"
      >
        <LuTriangleAlert size={28} className="text-amber-600" aria-hidden />
        <p className="font-semibold">This page could not be shown.</p>
        <p className="text-sm text-stone-600">
          Check your connection and try again. Your saved data is safe.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <LuRefreshCw aria-hidden /> Reload
        </button>
      </div>
    );
  }
}
