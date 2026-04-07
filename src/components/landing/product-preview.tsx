export function ProductPreview() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          실제 대시보드를 미리 보세요
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          점장이 매일 분석하는 대시보드
        </p>

        {/* Browser frame mockup */}
        <div className="rounded-xl border shadow-2xl overflow-hidden bg-white">
          {/* Browser chrome */}
          <div className="bg-slate-100 border-b px-4 py-2.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-400 max-w-md mx-auto text-center">
                사장AI
              </div>
            </div>
          </div>

          {/* Dashboard preview content */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50">
            <div className="flex gap-6">
              {/* Mini sidebar */}
              <div className="hidden sm:block w-40 shrink-0">
                <div className="space-y-2">
                  <div className="text-sm font-bold text-slate-800 mb-3">
                    사장AI
                  </div>
                  {["점장", "세리", "답장이", "바이럴"].map((name, i) => (
                    <div
                      key={name}
                      className={`text-xs px-3 py-2 rounded-lg ${
                        i === 1
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-slate-500"
                      }`}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 space-y-4">
                <div className="text-lg font-bold text-slate-800">
                  세리 · 매출 분석
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "총 매출",
                      value: "382만",
                      color: "text-emerald-600",
                    },
                    {
                      label: "순이익",
                      value: "+107만",
                      color: "text-emerald-600",
                    },
                    {
                      label: "현금흐름",
                      value: "325만",
                      color: "text-slate-800",
                    },
                    {
                      label: "일평균",
                      value: "76만",
                      color: "text-slate-800",
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bg-white rounded-lg border p-3"
                    >
                      <p className="text-[10px] text-muted-foreground">
                        {kpi.label}
                      </p>
                      <p className={`text-sm font-bold ${kpi.color}`}>
                        {kpi.value}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          원
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className="bg-white rounded-lg border p-4 h-32 flex items-end gap-1">
                  {[40, 65, 55, 78, 45, 82, 70, 60, 90, 75, 68, 85].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-100 rounded-t"
                        style={{ height: `${h}%` }}
                      >
                        <div
                          className="w-full bg-blue-600 rounded-t"
                          style={{ height: "60%" }}
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
