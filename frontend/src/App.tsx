import { useState, useEffect } from "react";
import "./App.css";
import type {
  TriageResult,
  HistoryItem,
  PaymentType,
  EmergencyAlert,
  PatientCasePayload,
} from "./types";
import {
  fetchUserProfile,
  checkRedFlags,
  submitTriage,
  ApiError,
} from "./api/mockBackend";
import { BearMascot } from "./components/BearMascot";
import { Icon } from "./components/Icons";
import { AnamnesisStep } from "./components/AnamnesisStep";
import { AppointmentModal } from "./components/AppointmentModal";
import { Step1Symptoms, Step2Localization } from "./components/TriageSteps";
import {
  FinalScreen,
  HistoryScreen,
  EmergencyScreen,
  ErrorScreen,
} from "./components/ResultScreens";

type ScreenStep =
  | "start"
  | "step1"
  | "step2"
  | "step3"
  | "final"
  | "history"
  | "emergency"
  | "error";
const AUTH_LABELS: Record<string, string> = {
  NO_TOKEN_IN_URL:
    "MAX не передал токен авторизации. Работаю в демо-режиме с тестовым профилем.",
  AUTH_NO_TOKEN:
    "Токен не дошёл до сервера. Работаю в демо-режиме с тестовым профилем.",
  AUTH_TOKEN_REJECTED:
    "Сервис авторизации отклонил токен. Работаю в демо-режиме с тестовым профилем.",
  AUTH_CORE_UNREACHABLE:
    "Сервис авторизации организаторов не отвечает. Работаю в демо-режиме с тестовым профилем.",
  AUTH_CORE_ERROR:
    "Сервис авторизации вернул ошибку. Работаю в демо-режиме с тестовым профилем.",
  NETWORK: "Нет связи с сервером. Работаю в демо-режиме с тестовым профилем.",
  UNKNOWN: "Неизвестная ошибка авторизации. Работаю в демо-режиме с тестовым профилем.",
};
export function App() {
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [screen, setScreen] = useState<ScreenStep>("start");
  const [previousScreen, setPreviousScreen] = useState<ScreenStep>("step1");
  const [isLoading, setIsLoading] = useState(false);
  const [userFullName, setUserFullName] = useState("Иванов Иван Иванович");
  const [isChild, setIsChild] = useState(false);
  const [category, setCategory] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [customLocalization, setCustomLocalization] = useState("");
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [customChronic, setCustomChronic] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [surgeriesLastYear, setSurgeriesLastYear] = useState(false);
  const [familyHistory, setFamilyHistory] = useState<string[]>([]);
  const [isPregnant, setIsPregnant] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyAlert | null>(
    null,
  );
  const [paymentPref, setPaymentPref] = useState<PaymentType>("ОМС");
  const [lastPayload, setLastPayload] = useState<PatientCasePayload | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("medved_history_v2");
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

    useEffect(() => {
    fetchUserProfile()
      .then((profile) => {
        setAuthCode(null);
        if (profile?.full_name) {
          const { lastName, firstName, middleName } = profile.full_name;
          const fullName = [lastName, firstName, middleName]
            .filter(Boolean)
            .join(" ");
          if (fullName) setUserFullName(fullName);
        }
        if (profile?.birthDate) {
          const age =
            new Date().getFullYear() -
            new Date(profile.birthDate).getFullYear();
          if (age < 18) setIsChild(true);
        }
      })
      .catch((err: unknown) => {
        const code = err instanceof ApiError ? err.code : "UNKNOWN";
        setAuthCode(code);
        console.warn("AUTH fail:", code, err);
      });
  }, []);

  const toggleArrayItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string,
  ) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
    );
  };

  const handleVoiceInput = (
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Голосовой ввод поддерживается в Chrome / Яндекс Браузере.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      if (!transcript) return;
      setter((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        alert(
          "Нет доступа к микрофону. Разрешите доступ в настройках браузера.",
        );
      } else if (event.error === "no-speech") {
        alert("Речь не распознана. Попробуйте ещё раз.");
      } else {
        alert(`Ошибка голосового ввода: ${event.error}`);
      }
    };
    recognition.start();
  };

  const handleCheckAndNext = async (
    textToCheck: string,
    nextStep: ScreenStep,
  ) => {
    setIsLoading(true);
    try {
      const alertData = await checkRedFlags(textToCheck, isChild);
      if (alertData.is_emergency) {
        setEmergencyAlert(alertData);
        setPreviousScreen(screen);
        setScreen("emergency");
        return;
      }
      setScreen(nextStep);
    } catch {
      setPreviousScreen(screen);
      setScreen("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishTriage = async () => {
    setIsLoading(true);
    try {
      const allChronic = [...chronicDiseases];
      if (customChronic.trim()) allChronic.push(customChronic.trim());
      const allLocalization = [...selectedParts];
      if (customLocalization.trim())
        allLocalization.push(customLocalization.trim());
      const payload: PatientCasePayload = {
        category: category || "Общая жалоба",
        complaint_text: complaintText,
        localization: allLocalization.join(", "),
        chronic_diseases: allChronic,
        medications,
        allergies,
        surgeries_last_year: surgeriesLastYear,
        family_history: familyHistory,
        is_pregnant: isPregnant,
        is_child: isChild,
        smoking,
        payment_preference: paymentPref,
      };
      setLastPayload(payload);
      const triageResponse = await submitTriage(payload);
      setResult(triageResponse);
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        specialist: triageResponse.specialist.toLowerCase(),
        urgency: triageResponse.urgency,
        symptomsSummary:
          [category, ...allLocalization, complaintText]
            .filter(Boolean)
            .join(", ") || "общее недомогание",
      };
      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("medved_history_v2", JSON.stringify(updatedHistory));
      setScreen("final");
    } catch {
      setPreviousScreen(screen);
      setScreen("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentChange = async (newPref: PaymentType) => {
    setPaymentPref(newPref);
    if (!result || !lastPayload) return;
    setIsLoading(true);
    try {
      const updated = await submitTriage({
        ...lastPayload,
        payment_preference: newPref,
      });
      setResult(updated);
    } catch {
      setPreviousScreen(screen);
      setScreen("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCategory("");
    setComplaintText("");
    setSelectedParts([]);
    setCustomLocalization("");
    setChronicDiseases([]);
    setCustomChronic("");
    setMedications("");
    setAllergies("");
    setSurgeriesLastYear(false);
    setFamilyHistory([]);
    setIsPregnant(false);
    setSmoking(false);
    setResult(null);
    setLastPayload(null);
    setScreen("start");
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("medved_history_v2");
  };

  const currentStepNumber =
    screen === "step1"
      ? 1
      : screen === "step2"
        ? 2
        : screen === "step3"
          ? 3
          : screen === "final"
            ? 4
            : 0;

  return (
    <div className="app-shell" data-theme={theme}>
      <div className="mobile-frame">
        <header className="top-bar">
          {screen !== "start" ? (
            <div
              className="brand-mini"
              onClick={handleReset}
              title="На главную"
            >
              <BearMascot size={30} />
              <span>Медведь онлайн</span>
            </div>
          ) : (
            <div />
          )}
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="Переключить тему"
          >
            <Icon name={theme === "light" ? "moon" : "sun"} size={23} />
          </button>
        </header>
        {currentStepNumber > 0 && (
          <div className="stepper">
            {[1, 2, 3, 4].map((step, idx) => (
              <div key={step} className="stepper-item">
                <div
                  className={`step-circle ${
                    step === currentStepNumber
                      ? "active"
                      : step < currentStepNumber
                        ? "completed"
                        : ""
                  }`}
                >
                  {step}
                </div>
                {idx < 3 && (
                  <div
                    className={`step-line ${
                      step < currentStepNumber ? "completed" : ""
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {screen === "start" && (
          <div className="screen-content start-screen">
            <div className="disclaimer-banner">
              <Icon name="warning" size={20} />
              <span>
                Я не ставлю диагноз и не заменяю врача. При ухудшении состояния
                вызывайте скорую помощь!
              </span>
            </div>
            {authCode && (
              <div className="auth-debug-banner">
                <Icon name="warning" size={20} />
                <span>{AUTH_LABELS[authCode] || AUTH_LABELS.UNKNOWN}</span>
              </div>
            )}
            <div className="start-card">
              <div className="logo-circle">
                <Icon name="stethoscope" size={34} />
              </div>
              <h1 className="start-title">Медведь онлайн</h1>
              <p className="start-subtitle">
                Ваш цифровой помощник по вопросам здоровья
              </p>
              {userFullName && (
                <p className="user-greeting">
                  Здравствуйте, <strong>{userFullName}</strong>
                </p>
              )}
              <label className="child-checkbox">
                <input
                  type="checkbox"
                  checked={isChild}
                  onChange={(e) => setIsChild(e.target.checked)}
                />
                <span>Заполняю для ребенка (до 18 лет)</span>
              </label>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setScreen("step1")}
              >
                Начать
              </button>
              <p className="legal-hint">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                (ФЗ-152)
              </p>
            </div>
          </div>
        )}
        {screen === "step1" && (
          <Step1Symptoms
            category={category}
            setCategory={setCategory}
            complaintText={complaintText}
            setComplaintText={setComplaintText}
            isLoading={isLoading}
            onVoiceInput={handleVoiceInput}
            onNext={() => handleCheckAndNext(complaintText, "step2")}
          />
        )}
        {screen === "step2" && (
          <Step2Localization
            selectedParts={selectedParts}
            onTogglePart={(part) =>
              toggleArrayItem(selectedParts, setSelectedParts, part)
            }
            customLocalization={customLocalization}
            setCustomLocalization={setCustomLocalization}
            isLoading={isLoading}
            onVoiceInput={handleVoiceInput}
            onNext={() => handleCheckAndNext(customLocalization, "step3")}
            onBack={() => setScreen("step1")}
          />
        )}
        {screen === "step3" && (
          <AnamnesisStep
            chronicDiseases={chronicDiseases}
            onToggleChronic={(d) =>
              toggleArrayItem(chronicDiseases, setChronicDiseases, d)
            }
            customChronic={customChronic}
            onChangeCustomChronic={setCustomChronic}
            medications={medications}
            onChangeMedications={setMedications}
            allergies={allergies}
            onChangeAllergies={setAllergies}
            surgeriesLastYear={surgeriesLastYear}
            onChangeSurgeries={setSurgeriesLastYear}
            familyHistory={familyHistory}
            onToggleFamily={(f) =>
              toggleArrayItem(familyHistory, setFamilyHistory, f)
            }
            isPregnant={isPregnant}
            onChangePregnant={setIsPregnant}
            isChild={isChild}
            onChangeChild={setIsChild}
            smoking={smoking}
            onChangeSmoking={setSmoking}
            isLoading={isLoading}
            onSubmit={handleFinishTriage}
            onBack={() => setScreen("step2")}
          />
        )}
        {screen === "final" && result && (
          <FinalScreen
            result={result}
            paymentPref={paymentPref}
            onPaymentChange={handlePaymentChange}
            onOpenModal={() => setIsModalOpen(true)}
            onReset={handleReset}
            onOpenHistory={() => setScreen("history")}
          />
        )}
        {screen === "history" && (
          <HistoryScreen
            history={history}
            onBack={() => setScreen(result ? "final" : "start")}
            onClear={handleClearHistory}
          />
        )}
        {screen === "emergency" && (
          <EmergencyScreen
            alert={emergencyAlert}
            onContinue={() => setScreen(previousScreen)}
          />
        )}
        {screen === "error" && (
          <ErrorScreen onBack={() => setScreen(previousScreen)} />
        )}
        <div className="mascot-footer">
          <BearMascot />
        </div>
      </div>
      {isModalOpen && result && (
        <AppointmentModal
          specialist={result.specialist}
          defaultFullName={userFullName}
          defaultPayment={paymentPref}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
