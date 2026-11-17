import React from "react";

interface BodySelectorProps {
  selectedParts: string[];
  onTogglePart: (part: string) => void;
}

export const BodySelector: React.FC<BodySelectorProps> = ({
  selectedParts,
  onTogglePart,
}) => {
  const isSelected = (part: string) => selectedParts.includes(part);

  const getFill = (part: string) =>
    isSelected(part) ? "#2979FF" : "var(--silhouette-fill)";

  return (
    <div className="body-selector-container">
      {/* Вид спереди (Лицо) */}
      <div className="body-column">
        <span className="body-label">Лицо</span>
        <svg viewBox="0 0 120 240" className="body-svg">
          {/* Голова */}
          <circle
            cx="60"
            cy="24"
            r="16"
            fill={getFill("Голова")}
            onClick={() => onTogglePart("Голова")}
            className="body-part"
          />
          {/* Грудь */}
          <rect
            x="38"
            y="45"
            width="44"
            height="36"
            rx="6"
            fill={getFill("Грудь")}
            onClick={() => onTogglePart("Грудь")}
            className="body-part"
          />
          {/* Живот */}
          <rect
            x="40"
            y="84"
            width="40"
            height="36"
            rx="6"
            fill={getFill("Живот")}
            onClick={() => onTogglePart("Живот")}
            className="body-part"
          />
          {/* Левая рука */}
          <path
            d="M33 47 L16 115 L25 118 L36 62 Z"
            fill={getFill("Руки")}
            onClick={() => onTogglePart("Руки")}
            className="body-part"
          />
          {/* Правая рука */}
          <path
            d="M87 47 L104 115 L95 118 L84 62 Z"
            fill={getFill("Руки")}
            onClick={() => onTogglePart("Руки")}
            className="body-part"
          />
          {/* Левая нога */}
          <rect
            x="41"
            y="124"
            width="16"
            height="90"
            rx="6"
            fill={getFill("Ноги")}
            onClick={() => onTogglePart("Ноги")}
            className="body-part"
          />
          {/* Правая нога */}
          <rect
            x="63"
            y="124"
            width="16"
            height="90"
            rx="6"
            fill={getFill("Ноги")}
            onClick={() => onTogglePart("Ноги")}
            className="body-part"
          />
        </svg>
      </div>

      {/* Вид сзади (Спина) */}
      <div className="body-column">
        <span className="body-label">Спина</span>
        <svg viewBox="0 0 120 240" className="body-svg">
          {/* Затылок */}
          <circle
            cx="60"
            cy="24"
            r="16"
            fill={getFill("Голова")}
            onClick={() => onTogglePart("Голова")}
            className="body-part"
          />
          {/* Спина целиком */}
          <rect
            x="38"
            y="45"
            width="44"
            height="75"
            rx="8"
            fill={getFill("Спина")}
            onClick={() => onTogglePart("Спина")}
            className="body-part"
          />
          {/* Руки */}
          <path
            d="M33 47 L16 115 L25 118 L36 62 Z"
            fill={getFill("Руки")}
            onClick={() => onTogglePart("Руки")}
            className="body-part"
          />
          <path
            d="M87 47 L104 115 L95 118 L84 62 Z"
            fill={getFill("Руки")}
            onClick={() => onTogglePart("Руки")}
            className="body-part"
          />
          {/* Ноги */}
          <rect
            x="41"
            y="124"
            width="16"
            height="90"
            rx="6"
            fill={getFill("Ноги")}
            onClick={() => onTogglePart("Ноги")}
            className="body-part"
          />
          <rect
            x="63"
            y="124"
            width="16"
            height="90"
            rx="6"
            fill={getFill("Ноги")}
            onClick={() => onTogglePart("Ноги")}
            className="body-part"
          />
        </svg>
      </div>
    </div>
  );
};
