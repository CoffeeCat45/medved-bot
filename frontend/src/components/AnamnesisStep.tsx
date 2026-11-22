import React from "react";
import { Icon } from "./Icons";

interface AnamnesisStepProps {
  chronicDiseases: string[];
  onToggleChronic: (item: string) => void;
  customChronic: string;
  onChangeCustomChronic: (val: string) => void;
  medications: string;
  onChangeMedications: (val: string) => void;
  allergies: string;
  onChangeAllergies: (val: string) => void;
  surgeriesLastYear: boolean;
  onChangeSurgeries: (val: boolean) => void;
  familyHistory: string[];
  onToggleFamily: (item: string) => void;
  isPregnant: boolean;
  onChangePregnant: (val: boolean) => void;
  isChild: boolean;
  onChangeChild: (val: boolean) => void;
  smoking: boolean;
  onChangeSmoking: (val: boolean) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const CHRONIC_LIST = ["Сахарный диабет", "Гипертония", "Астма"];
const FAMILY_LIST = ["ССЗ", "Онкология", "Диабет"];

export const AnamnesisStep: React.FC<AnamnesisStepProps> = (props) => {
  return (
    <div className="screen-content">
      <h1 className="title">Сбор анамнеза</h1>
      <p className="subtitle">Укажите хронические заболевания и особенности</p>

      <div className="section-block">
        <div className="block-label">Хронические заболевания:</div>
        {CHRONIC_LIST.map((item) => {
          const active = props.chronicDiseases.includes(item);
          return (
            <div key={item} className="toggle-row">
              <span>{item}</span>
              <div className="yes-no-group">
                <button
                  type="button"
                  className={`yn-btn ${!active ? "active" : ""}`}
                  onClick={() => active && props.onToggleChronic(item)}
                >
                  Нет
                </button>
                <button
                  type="button"
                  className={`yn-btn ${active ? "active" : ""}`}
                  onClick={() => !active && props.onToggleChronic(item)}
                >
                  Да
                </button>
              </div>
            </div>
          );
        })}
        <input
          type="text"
          className="text-input mt-8"
          placeholder="Другое хроническое заболевание..."
          value={props.customChronic}
          onChange={(e) => props.onChangeCustomChronic(e.target.value)}
        />
      </div>

      <div className="section-block">
        <div className="block-label">Лекарства и аллергии:</div>
        <input
          type="text"
          className="text-input"
          placeholder="Принимаемые лекарства (или напишите «нет»)"
          value={props.medications}
          onChange={(e) => props.onChangeMedications(e.target.value)}
        />
        <input
          type="text"
          className="text-input mt-8"
          placeholder="Аллергии (лекарственные, пищевые)"
          value={props.allergies}
          onChange={(e) => props.onChangeAllergies(e.target.value)}
        />
      </div>

      <div className="section-block">
        <div className="block-label">Наследственность:</div>
        <div className="chips-row">
          {FAMILY_LIST.map((item) => {
            const active = props.familyHistory.includes(item);
            return (
              <button
                key={item}
                type="button"
                className={`chip-btn ${active ? "active" : ""}`}
                onClick={() => props.onToggleFamily(item)}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section-block">
        <div className="toggle-row">
          <span>Операции / госпитализации за год</span>
          <div className="yes-no-group">
            <button
              type="button"
              className={`yn-btn ${!props.surgeriesLastYear ? "active" : ""}`}
              onClick={() => props.onChangeSurgeries(false)}
            >
              Нет
            </button>
            <button
              type="button"
              className={`yn-btn ${props.surgeriesLastYear ? "active" : ""}`}
              onClick={() => props.onChangeSurgeries(true)}
            >
              Да
            </button>
          </div>
        </div>

        <div className="toggle-row">
          <span>Пациент — ребенок (до 18 лет)</span>
          <div className="yes-no-group">
            <button
              type="button"
              className={`yn-btn ${!props.isChild ? "active" : ""}`}
              onClick={() => props.onChangeChild(false)}
            >
              Нет
            </button>
            <button
              type="button"
              className={`yn-btn ${props.isChild ? "active" : ""}`}
              onClick={() => props.onChangeChild(true)}
            >
              Да
            </button>
          </div>
        </div>

        <div className="toggle-row">
          <span>Беременность или лактация</span>
          <div className="yes-no-group">
            <button
              type="button"
              className={`yn-btn ${!props.isPregnant ? "active" : ""}`}
              onClick={() => props.onChangePregnant(false)}
            >
              Нет
            </button>
            <button
              type="button"
              className={`yn-btn ${props.isPregnant ? "active" : ""}`}
              onClick={() => props.onChangePregnant(true)}
            >
              Да
            </button>
          </div>
        </div>

        <div className="toggle-row">
          <span>Курение</span>
          <div className="yes-no-group">
            <button
              type="button"
              className={`yn-btn ${!props.smoking ? "active" : ""}`}
              onClick={() => props.onChangeSmoking(false)}
            >
              Нет
            </button>
            <button
              type="button"
              className={`yn-btn ${props.smoking ? "active" : ""}`}
              onClick={() => props.onChangeSmoking(true)}
            >
              Да
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary mt-16"
        disabled={props.isLoading}
        onClick={props.onSubmit}
      >
        {props.isLoading ? "Анализируем..." : "Получить рекомендацию"}
      </button>

      <button type="button" className="btn-back" onClick={props.onBack}>
        <Icon name="arrow-left" size={16} /> Назад
      </button>
    </div>
  );
};
