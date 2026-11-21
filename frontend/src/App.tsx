import { useState, useEffect } from "react";
import "./App.css";
import type {
  TriageResult,
  HistoryItem,
  PaymentType,
  EmergencyAlert,
} from "./types";
import {
  fetchUserProfile,
  checkRedFlags,
  submitTriage,
} from "./api/mockBackend";
import { BearMascot } from "./components/BearMascot";
import { AnamnesisStep } from "./components/AnamnesisStep";
import { AppointmentModal } from "./components/AppointmentModal";
import { Step1Symptoms, Step2Localization } from "./components/TriageSteps";
import {
  FinalScreen,
  HistoryScreen,
  EmergencyScreen,
} from "./components/ResultScreens";

type ScreenStep =
  | "start"
  | "step1"
  | "step2"
  | "step3"
  | "final"
  | "history"
  | "emergency";

  
export function App() {
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
  const [paymentPref, setPaymentPref] = useState<PaymentType>("Платно");
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
    fetchUserProfile().then((profile) => {
      if (profile?.full_name) {
        const { lastName, firstName, middleName } = profile.full_name;
        setUserFullName(
          [lastName, firstName, middleName].filter(Boolean).join(" "),
        );
      }
      if (profile?.birthDate) {
        const age =
          new Date().getFullYear() - new Date(profile.birthDate).getFullYear();
        if (age < 18) setIsChild(true);
      }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results.transcript;
      setter((prev) => (prev ? `${prev} ${transcript}` : transcript));
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

    const triageResponse = await submitTriage({
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
    });

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
localStorage.setItem("medved_history_v2", JSON.stringify(updatedHistory));;

    setScreen("final");
  } catch (error) {
    alert("Не удалось получить рекомендацию. Сервис временно недоступен.");
  } finally {
    setIsLoading(false);
  }
};

  const handlePaymentChange = (newPref: PaymentType) => {
    setPaymentPref(newPref);
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
    setScreen("start");
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
              <span className="brand-dot" />
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
            {theme === "light" ? "🌙" : "☀️"}
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
                    className={`step-line ${step < currentStepNumber ? "completed" : ""}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {screen === "start" && (
          <div className="screen-content start-screen">
            <div className="disclaimer-banner">
              <span>⚠️</span>
              <span>
                Я не ставлю диагноз и не заменяю врача. При ухудшении состояния
                вызывайте скорую помощь!
              </span>
            </div>

            <div className="start-card">
              <div className="logo-circle">logo</div>
              <h1 className="start-title">Медведь онлайн</h1>
              <p className="start-subtitle">
                Ваш цифровой помощник по вопросам здоровья
              </p>

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
          />
        )}

        {screen === "emergency" && (
          <EmergencyScreen
            alert={emergencyAlert}
            onContinue={() => setScreen(previousScreen)}
          />
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
