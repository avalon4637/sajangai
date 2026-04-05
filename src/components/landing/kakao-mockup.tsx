// Reusable KakaoTalk message mockup component
// CSS-only implementation — no images needed

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
}

export function KakaoMockup({
  profileName = "점장",
  profileEmoji = "🧑‍💼",
  message,
  buttons = [],
  type = "report",
  time = "오전 8:00",
}: KakaoMockupProps) {
  const bgColors: Record<string, string> = {
    report: "#B9C4CE",
    alert: "#B9C4CE",
    action: "#B9C4CE",
  };

  return (
    <div
      className="rounded-2xl p-3 w-full max-w-xs mx-auto"
      style={{ backgroundColor: bgColors[type] }}
    >
      {/* Profile row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-lg flex-shrink-0">
          {profileEmoji}
        </div>
        <div>
          <p className="text-xs font-bold text-[#1E293B]">{profileName}</p>
        </div>
      </div>

      {/* Message bubble */}
      <div className="ml-11">
        <div
          className="rounded-2xl rounded-tl-none p-3 text-sm leading-relaxed text-[#1E293B] whitespace-pre-line"
          style={{ backgroundColor: "#FEE500" }}
        >
          {message}
        </div>

        {/* Buttons */}
        {buttons.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {buttons.map((btn, i) => (
              <div
                key={i}
                className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-center text-xs font-semibold text-[#1E40AF] cursor-pointer hover:bg-blue-50 transition-colors"
              >
                {btn.label}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-[10px] text-gray-600">{time}</p>
      </div>
    </div>
  );
}
