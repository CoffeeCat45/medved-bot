import React from "react";
import { Icon } from "./Icons";
import type {
  TriageResult,
  HistoryItem,
  PaymentType,
  EmergencyAlert,
} from "../types";

export function getUrgencyClass(urgency: string): string {
  switch (urgency) {
    case "Экстренно":
      return "urgency-red";
    case "Срочно (24ч)":
      return "urgency-orange";
    case "Планово":
      return "urgency-green";
    default:
      return "urgency-teal";
  }
}

interface FinalProps {
  result: TriageResult;
  paymentPref: PaymentType;
  onPaymentChange: (v: PaymentType) => void;
  onOpenModal: () => void;
  onReset: () => void;
  onOpenHistory: () => void;
}

export const FinalScreen: React.FC<FinalProps> = ({
  result,
  paymentPref,
  onPaymentChange,
  onOpenModal,
  onReset,
  onOpenHistory,
}) => (
  <div className="screen-content card-screen">
    <h2 className="screen-title">Рекомендация</h2>

    <div className="result-row">
      <span className="result-label"><Icon name="user" size={22} /> Специалист:</span>
      <span className="result-value">{result.specialist}</span>
    </div>

    <div className="result-row">
      <span className="result-label"><Icon name="hospital" size={22} /> Куда обратиться:</span>
      <span className="result-value">{result.place}</span>
    </div>

    <div className="urgency-wrapper">
      <span className={`urgency-badge ${getUrgencyClass(result.urgency)}`}>
        {result.urgency}
      </span>
    </div>

    <div className="reasoning-block">
      <div className="reasoning-title">Почему мы так решили</div>
      <p className="reasoning-text">{result.reasoning.join(" ")}</p>
    </div>

    <div className="payment-inline">
      <span>Форма обращения:</span>
      <select
        value={paymentPref}
        onChange={(e) => onPaymentChange(e.target.value as PaymentType)}
        className="payment-select-inline"
      >
        <option value="ОМС">ОМС (бесплатно)</option>
        <option value="ДМС">ДМС</option>
        <option value="Платно">Платно</option>
      </select>
    </div>

    <button type="button" className="btn-primary" onClick={onOpenModal}>
      Записаться на прием
    </button>

    <button type="button" className="btn-secondary-text" onClick={onReset}>
      Начать сначала
    </button>

    <div className="disclaimer-banner mt-12">
      <Icon name="warning" size={20} />
      <span>При ухудшении самочувствия вызывайте скорую (103/112)</span>
    </div>

    <button type="button" className="btn-history-link" onClick={onOpenHistory}>
      История обращений
    </button>
  </div>
);

interface HistoryProps {
  history: HistoryItem[];
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryProps> = ({ history, onBack }) => (
  <div className="screen-content card-screen">
    <h2 className="screen-title">История обращений</h2>
    <p className="screen-subtitle">
      Все ваши обращения к боту «Медведь онлайн»
    </p>

    <div className="history-list">
      {history.map((item) => (
        <div key={item.id} className="history-card">
          <div className="history-card-top">
            <span className="history-date">{item.date}</span>
            <span
              className={`urgency-badge small ${getUrgencyClass(item.urgency)}`}
            >
              {item.urgency}
            </span>
          </div>
          <div className="history-rec">
            Рекомендация: обратиться к {item.specialist}
          </div>
          <div className="history-symptoms">
            Вы отметили: {item.symptomsSummary}
          </div>
        </div>
      ))}
    </div>

    <button type="button" className="btn-back mt-16" onClick={onBack}>
      <Icon name="arrow-left" size={16} /> Назад
    </button>
  </div>
);

interface EmergencyProps {
  alert: EmergencyAlert | null;
  onContinue: () => void;
}

export const EmergencyScreen: React.FC<EmergencyProps> = ({
  alert,
  onContinue,
}) => (
  <div className="screen-content emergency-screen">
    <div className="emergency-card">
      <div className="emergency-icon"><Icon name="warning" size={26} /></div>
      <h2 className="emergency-title">
        Внимание!
        <br />
        Ваши симптомы опасны
      </h2>
      <p className="emergency-desc">
        {alert?.message ||
          "Одышка в покое и боль в груди могут указывать на неотложное состояние. Не ждите окончания опроса"}
      </p>
      <p className="emergency-call-text">
        Вызовите скорую помощь по номеру
        <br />
        <strong>103 или 112</strong>
      </p>

      <a href="tel:103" className="btn-emergency-primary">
        Вызвать скорую (103)
      </a>
      <a href="tel:112" className="btn-emergency-outline">
        Позвонить 112
      </a>

      <p className="emergency-note">Пожалуйста, не занимайтесь самолечением!</p>
    </div>

    <button type="button" className="btn-back mt-16" onClick={onContinue}>
      <Icon name="arrow-left" size={16} /> Продолжить опрос
    </button>
  </div>
);
