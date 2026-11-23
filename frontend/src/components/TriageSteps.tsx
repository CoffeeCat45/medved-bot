import React from "react";
import { BodySelector } from "./BodySelector";

import { Icon } from "./Icons";

const CATEGORIES = [
  { id: "Температура", label: "Температура", description: "", icon: "thermometer" },
  { id: "Дыхание", label: "Дыхание", description: "", icon: "lungs" },
  { id: "Живот / ЖКТ", label: "Живот / ЖКТ", description: "", icon: "stomach" },
  { id: "Кожа", label: "Кожа", description: "", icon: "band" },
  {
    id: "Неврология",
    label: "Неврология",
    description: "(голова, головокружение)",
    icon: "brain",
  },
  { id: "Травма", label: "Травма", description: "", icon: "bone" },
];

interface Step1Props {
  category: string;
  setCategory: (v: string) => void;
  complaintText: string;
  setComplaintText: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  onVoiceInput: (setter: React.Dispatch<React.SetStateAction<string>>) => void;
  onNext: () => void;
}

export const Step1Symptoms: React.FC<Step1Props> = ({
  category,
  setCategory,
  complaintText,
  setComplaintText,
  isLoading,
  onVoiceInput,
  onNext,
}) => (
  <div className="screen-content card-screen">
    <h2 className="screen-title">Что вас беспокоит?</h2>

    <p className="screen-subtitle">
      Выберите один из вариантов или опишите симптом текстом
    </p>

    <div className="categories-grid">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`category-card ${category === cat.id ? "selected" : ""}`}
          onClick={() => setCategory(category === cat.id ? "" : cat.id)}
        >
          <span className="category-icon">
            <Icon
              name={
                cat.icon as
                  | "thermometer"
                  | "lungs"
                  | "stomach"
                  | "band"
                  | "brain"
                  | "bone"
              }
              size={40}
            />
          </span>

          <span className="category-label">{cat.label}{cat.description && <small>{cat.description}</small>}</span>
        </button>
      ))}
    </div>

    <div className="divider-text">или</div>

    <div className="input-with-mic">
      <input
        type="text"
        className="text-input"
        placeholder="Напишите свой симптом..."
        value={complaintText}
        onChange={(e) => setComplaintText(e.target.value)}
      />

      <button
        type="button"
        className="mic-btn"
        onClick={() => onVoiceInput(setComplaintText)}
        title="Голосовой ввод"
      >
        <Icon name="microphone" size={23} />
      </button>
    </div>

    <button
      type="button"
      className="btn-primary mt-16"
      disabled={(!category && !complaintText.trim()) || isLoading}
      onClick={onNext}
    >
      {isLoading ? "Проверяем..." : "Далее"}
    </button>
  </div>
);

interface Step2Props {
  selectedParts: string[];
  onTogglePart: (part: string) => void;
  customLocalization: string;
  setCustomLocalization: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  onVoiceInput: (setter: React.Dispatch<React.SetStateAction<string>>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2Localization: React.FC<Step2Props> = ({
  selectedParts,
  onTogglePart,
  customLocalization,
  setCustomLocalization,
  isLoading,
  onVoiceInput,
  onNext,
  onBack,
}) => (
  <div className="screen-content card-screen">
    <h2 className="screen-title">Где именно болит?</h2>

    <p className="screen-subtitle">
      Выберите область/области или опишите текстом
    </p>

    <BodySelector selectedParts={selectedParts} onTogglePart={onTogglePart} />

    {selectedParts.length > 0 && (
      <div className="selected-tags">Выбрано: {selectedParts.join(", ")}</div>
    )}

    <div className="divider-text">или</div>

    <div className="input-with-mic">
      <input
        type="text"
        className="text-input"
        placeholder="Опишите где болит..."
        value={customLocalization}
        onChange={(e) => setCustomLocalization(e.target.value)}
      />

      <button
        type="button"
        className="mic-btn"
        onClick={() => onVoiceInput(setCustomLocalization)}
        title="Голосовой ввод"
      >
        <Icon name="microphone" size={23} />
      </button>
    </div>

    <button
      type="button"
      className="btn-primary mt-16"
      disabled={isLoading}
      onClick={onNext}
    >
      {isLoading ? "Проверяем..." : "Далее"}
    </button>

    <button type="button" className="btn-back" onClick={onBack}>
      <Icon name="arrow-left" size={16} /> Назад
    </button>
  </div>
);
