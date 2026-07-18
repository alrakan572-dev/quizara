import type {
  ReactNode,
} from "react";

import { useHomeData } from "../../home/HomeDataProvider";

interface Props {
  children: ReactNode;
}

export function HomeDataBoundary({
  children,
}: Props) {
  const {
    data,
    loading,
    error,
    refresh,
  } = useHomeData();

  if (loading && !data) {
    return (
      <div
        className="rounded-3xl px-5 py-10 text-center"
        style={{
          background: "#1F2937",
          color: "#F9FAFB",
        }}
      >
        <div className="text-4xl">
          🦊
        </div>
        <p>Loading Quizora...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        className="rounded-3xl px-5 py-10 text-center"
        style={{
          background: "#1F2937",
          color: "#F9FAFB",
        }}
      >
        <div className="text-4xl">
          ⚠️
        </div>
        <p>{error.message}</p>
        <button
          type="button"
          onClick={() =>
            void refresh()
          }
          className="rounded-xl px-4 py-2"
          style={{
            background: "#6D28D9",
            color: "white",
          }}
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
