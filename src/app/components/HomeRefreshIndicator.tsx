import { useHomeData } from "../../home/HomeDataProvider";

export function HomeRefreshIndicator() {
  const {
    refreshing,
    error,
  } = useHomeData();

  if (!refreshing && !error) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="rounded-xl px-3 py-2 text-center"
      style={{
        background: error
          ? "rgba(239,68,68,.12)"
          : "rgba(109,40,217,.12)",
        color: error
          ? "#FCA5A5"
          : "#C4B5FD",
        fontSize: ".72rem",
      }}
    >
      {error
        ? error.message
        : "Updating dashboard..."}
    </div>
  );
}
