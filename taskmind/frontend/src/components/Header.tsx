"use client";

interface Props {
  total: number;
  search: string;
  onSearchChange: (v: string) => void;
  onNewTask: () => void;
  isMobile?: boolean;
}

export default function Header({ total, search, onSearchChange, onNewTask, isMobile }: Props) {
  return (
    <header className="border-b border-zinc-800 px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 bg-zinc-950">
      <div className="flex items-center gap-3">
        <span className="font-bold text-white tracking-tight text-base">TaskMind</span>
        {total > 0 && (
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md tabular-nums">
            {total}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Busca — ícone no mobile, input no desktop */}
        {isMobile ? (
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-6 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-36 transition-colors"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-base leading-none"
              >×</button>
            )}
          </div>
        ) : (
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-8 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-52 transition-colors"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-base leading-none"
              >×</button>
            )}
          </div>
        )}

        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Nova tarefa</span>
        </button>
      </div>
    </header>
  );
}
