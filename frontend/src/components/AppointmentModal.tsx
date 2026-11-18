import React, { useState } from "react";
import type { PaymentType } from "../types";

interface AppointmentModalProps {
  specialist: string;
  defaultFullName: string;
  defaultPayment: PaymentType;
  onClose: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  specialist,
  defaultFullName,
  defaultPayment,
  onClose,
}) => {
  const [fullName, setFullName] = useState(defaultFullName);
  const [clinic, setClinic] = useState("");
  const [doctor, setDoctor] = useState(specialist);
  const [time, setTime] = useState("10:00");
  const [date, setDate] = useState("2026-11-20");
  const [payment, setPayment] = useState<PaymentType>(defaultPayment);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    //BACKEND — при необходимости отправить данные записи
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2 className="modal-title">Запись на прием</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="text"
            className="text-input"
            placeholder="ФИО"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="text"
            className="text-input"
            placeholder="Номер и адрес поликлиники"
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            required
          />
          <input
            type="text"
            className="text-input"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            required
          />
          <input
            type="time"
            className="text-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <input
            type="date"
            className="text-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="payment-row">
            <span className="payment-label">Выбор оплаты:</span>
            <select
              className="payment-select"
              value={payment}
              onChange={(e) => setPayment(e.target.value as PaymentType)}
            >
              <option value="Платно">Платно</option>
              <option value="ОМС">ОМС</option>
              <option value="ДМС">ДМС</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Записаться
          </button>
        </form>

        {isSuccess && (
          <div className="toast-success">Запись прошла успешно!</div>
        )}
      </div>
    </div>
  );
};
