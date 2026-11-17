import React from "react";
import { BodySelector } from "./BodySelector";

// SVG-иконка лёгких
const LungsIcon: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Лёгкие"
    role="img"
  >
    <path
      d="M23 5V22M25 5V22"
      stroke="#171717"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <path
      d="M23 14L17 21M25 14L31 21"
      stroke="#171717"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M17 19C13 16 10 21 8 27C5 34 6 40 11 42C16 44 21 40 22 35L23 23C21 21 19 20 17 19Z"
      fill="#F3A6AD"
      stroke="#171717"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M31 19C35 16 38 21 40 27C43 34 42 40 37 42C32 44 27 40 26 35L25 23C27 21 29 20 31 19Z"
      fill="#F3A6AD"
      stroke="#171717"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M13 27C12 31 12 34 15 36M35 27C36 31 36 34 33 36"
      stroke="#E98796"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CATEGORIES = [
  { id: "Температура", label: "Температура", icon: "🌡️" },
  { id: "Дыхание", label: "Дыхание", icon: "lungs" },
  { id: "Живот / ЖКТ", label: "Живот / ЖКТ", icon: "🤢" },
  { id: "Кожа", label: "Кожа", icon: "🩹" },
  {
    id: "Неврология",
    label: "Неврология\n(голова, головокружение)",
    icon: "🧠",
  },
  { id: "Травма", label: "Травма", icon: "🦴" },
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
            {cat.icon === "lungs" ? <LungsIcon /> : cat.icon}
          </span>

          <span className="category-label">{cat.label}</span>
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
        🎙️
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
        🎙️
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
      ← Назад
    </button>
  </div>
);
