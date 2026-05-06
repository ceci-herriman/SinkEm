// src/Header.jsx
export default function Header({
  title = "Sink ’Em 🚢",
  displayName,
  opponentName,
  gameCode,
  userMessage,
  timer,
  isMyFireTurn,
  onHome,
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-700 shadow-sm" role="banner">
      <div className="mx-auto max-w-6xl px-4 py-3 grid gap-2 sm:gap-x-10 sm:grid-cols-[1fr_auto_auto] items-center">

        {/* to the left: title, status */}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight">
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          <p className="text-sm text-gray-600 truncate dark:text-gray-300">
            {"The Classic Naval Combat Game"}
          </p>
        </div>

        {/* Middle: Names */}
        <div className="flex items-center gap-4 text-sm text-gray-800 dark:text-gray-300">
          <div className="flex flex-col sm:text-right">
            <span className="font-medium">You</span>
            <span className="truncate">{displayName || "—"}</span>
          </div>
          <div className="hidden sm:block h-8 w-px bg-gray-300" />
          <div className="flex flex-col sm:text-right">
            <span className="font-medium">Opponent</span>
            <span className="truncate">{opponentName || "Waiting…"}</span>
          </div>
        </div>

        {/* to the right: timer, home */}
        <div className="flex items-center justify-end gap-6">
          {typeof timer === "number" && isMyFireTurn ? (
            <div className="ml-12 rounded-md border px-2 py-1 text-xs font-semibold">
              ⏳ {timer}s
            </div>
          ) : null}

          <button
            type="button"
            onClick={onHome}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 active:scale-[0.98] transition"
          >
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                Home 🏠
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}