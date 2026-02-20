"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw } from "lucide-react";
import type { KpiInput } from "@/lib/kpi/calculator";
import {
  runSimulation,
  type SimulationType,
  type SimulationParams,
  type SimulationResult,
} from "@/lib/simulation/engine";
import { ScenarioCards } from "@/components/simulation/scenario-cards";
import { SimulationResultComparison } from "@/components/simulation/simulation-result-comparison";
import { SurvivalScoreComparison } from "@/components/simulation/survival-score-comparison";

interface SimulationFormProps {
  currentInput: KpiInput;
}

interface PresetButton {
  label: string;
  value: number;
  isPercentage: boolean;
}

const presets: Record<SimulationType, PresetButton[]> = {
  employee_change: [
    { label: "알바 1명 추가 (+200만원)", value: 2000000, isPercentage: false },
    {
      label: "정직원 1명 채용 (+350만원)",
      value: 3500000,
      isPercentage: false,
    },
  ],
  revenue_change: [
    { label: "매출 10% 증가", value: 10, isPercentage: true },
    { label: "매출 20% 감소", value: -20, isPercentage: true },
  ],
  rent_change: [
    { label: "임대료 50만원 인상", value: 500000, isPercentage: false },
    { label: "임대료 10% 인상", value: 10, isPercentage: true },
  ],
  expense_change: [
    { label: "재료비 10% 절감", value: -10, isPercentage: true },
    { label: "재료비 20% 증가", value: 20, isPercentage: true },
  ],
};

const typeLabels: Record<SimulationType, string> = {
  employee_change: "인건비",
  revenue_change: "매출",
  rent_change: "임대료",
  expense_change: "재료비",
};

export function SimulationForm({ currentInput }: SimulationFormProps) {
  const [selectedType, setSelectedType] = useState<SimulationType | null>(null);
  const [value, setValue] = useState<string>("");
  const [isPercentage, setIsPercentage] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSelectType = useCallback(
    (type: SimulationType) => {
      setSelectedType(type);
      setValue("");
      setIsPercentage(false);
      // Clear result only when changing type, not when tweaking params
      if (type !== selectedType) {
        setResult(null);
      }
    },
    [selectedType]
  );

  const handlePreset = useCallback(
    (preset: PresetButton) => {
      setValue(String(preset.value));
      setIsPercentage(preset.isPercentage);
    },
    []
  );

  const handleRunSimulation = useCallback(() => {
    if (!selectedType || !value) return;

    const numValue = Number(value);
    if (Number.isNaN(numValue)) return;

    const params: SimulationParams = {
      type: selectedType,
      value: numValue,
      isPercentage,
    };

    const simResult = runSimulation(currentInput, params);
    setResult(simResult);
  }, [selectedType, value, isPercentage, currentInput]);

  const handleReset = useCallback(() => {
    setSelectedType(null);
    setValue("");
    setIsPercentage(false);
    setResult(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Scenario selection */}
      <ScenarioCards selectedType={selectedType} onSelect={handleSelectType} />

      {/* Parameter input */}
      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              시뮬레이션 조건 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset buttons */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                빠른 선택
              </Label>
              <div className="flex flex-wrap gap-2">
                {presets[selectedType].map((preset) => (
                  <Badge
                    key={preset.label}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors px-3 py-1.5 text-sm"
                    onClick={() => handlePreset(preset)}
                  >
                    {preset.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Value input + unit toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="sim-value">
                  {typeLabels[selectedType]} 변동값
                </Label>
                <Input
                  id="sim-value"
                  type="number"
                  placeholder={
                    isPercentage
                      ? "변동 비율 입력 (예: 10, -20)"
                      : "변동 금액 입력 (예: 2000000, -500000)"
                  }
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>단위</Label>
                <Tabs
                  value={isPercentage ? "percent" : "absolute"}
                  onValueChange={(v) => setIsPercentage(v === "percent")}
                >
                  <TabsList>
                    <TabsTrigger value="absolute">원</TabsTrigger>
                    <TabsTrigger value="percent">%</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleRunSimulation}
                disabled={!value || Number.isNaN(Number(value))}
              >
                <Play className="size-4" />
                시뮬레이션 실행
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="size-4" />
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result display */}
      {result && (
        <div className="space-y-6">
          {/* Survival score visual comparison */}
          <SurvivalScoreComparison
            beforeScore={result.before.survivalScore}
            afterScore={result.after.survivalScore}
          />

          {/* Detailed comparison table */}
          <SimulationResultComparison result={result} />
        </div>
      )}
    </div>
  );
}
