// Reusable KakaoTalk message mockup component
// Wrapped in phone frame for realistic appearance

interface KakaoButton {
  label: string;
}

interface KakaoMockupProps {
  profileName?: string;
  profileEmoji?: string;
  message: string;
  buttons?: KakaoButton[];
  type?: "report" | "alert" | "action";
  time?: string;
  /** Phone frame width class — default "w-[280px]", use "w-[240px]" for inline */
  size?: "default" | "small" | "compact";
}

export function KakaoMockup({
  profileName = "점장",
  profileEmoji = "🧑‍💼",
  message,
  buttons = [],
  type = "report",
  time = "오전 8:00",
  size = "default",
}: KakaoMockupProps) {
  const sizeClasses = {
    default: "w-[280px]",
    small: "w-[240px]",
    compact: "w-[220px]",
  };

  const chatMinHeight = {
    default: "min-h-[360px]",
    small: "min-h-[300px]",
    compact: "min-h-[260px]",
  };

  const messageParts = message.split("\n").filter(Boolean);
  const title = messageParts[0] || "";
  const body = messageParts.slice(1);

  return (
    <div className={`relative mx-auto ${sizeClasses[size]}`}>
      {/* Phone frame */}
      <div className="rounded-[2rem] border-[8px] border-slate-800 bg-slate-800 shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="bg-slate-800 text-white text-[10px] flex justify-between items-center px-5 py-1">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-3.5 h-2 border border-white rounded-[2px] relative">
              <div className="absolute inset-[1px] right-[2px] bg-white rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* KakaoTalk chat header */}
        <div className="bg-[#B2C7D9] flex items-center gap-2 px-3 py-2 border-b border-black/5">
          <svg
            className="w-4 h-4 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-xs font-semibold text-slate-700">
            {profileName}
          </span>
        </div>

        {/* KakaoTalk chat area */}
        <div className={`bg-[#B2C7D9] px-3 py-4 ${chatMinHeight[size]}`}>
          {/* Date chip */}
          <div className="text-center text-[11px] text-slate-600 mb-3">
            <span className="bg-black/10 rounded-full px-2.5 py-0.5">
              {time}
            </span>
          </div>

          {/* Message from agent */}
          <div className="flex gap-2 items-start">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-sm shrink-0">
              {profileEmoji}
            </div>
            <div>
              <p className="text-[11px] text-slate-700 mb-1">{profileName}</p>
              <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2.5 text-[12px] leading-relaxed max-w-[200px] shadow-sm">
                {type === "report" ? (
                  <>
                    <p className="font-medium mb-1">{title}</p>
                    {body.map((line, i) => (
                      <p key={i} className="text-slate-700">
                        {line}
                      </p>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="font-medium mb-1">{title}</p>
                    {body.map((line, i) => (
                      <p key={i} className="text-slate-700">
                        {line}
                      </p>
                    ))}
                  </>
                )}
              </div>

              {/* Action buttons */}
              {buttons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {buttons.map((btn, i) => (
                    <button
                      key={i}
                      className="bg-white rounded-lg px-3 py-1.5 text-[11px] text-slate-700 shadow-sm border border-slate-200"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phone home indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-white rounded-full" />
    </div>
  );
}
