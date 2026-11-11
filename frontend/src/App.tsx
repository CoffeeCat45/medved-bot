import { useState, useEffect } from 'react';
import { MaxUI, Button } from '@maxhub/max-ui';
import '@maxhub/max-ui/dist/styles.css'; // Подключаем стили библиотеки

function App() {
  const [message, setMessage] = useState('');
  const [isMaxEnvironment, setIsMaxEnvironment] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение внутри MAX (объект window.WebApp существует)
    if (window.WebApp) {
      setIsMaxEnvironment(true);
      console.log("Данные пользователя из MAX:", window.WebApp.initDataUnsafe?.user);
    } else {
      console.log("Приложение запущено в обычном браузере. MAX Bridge не найден.");
    }
  }, []);

  const handleStartSurvey = () => {
    setMessage('Опрос начат! (Здесь будет вызов бэкенда)');
  };

  return (
    // MaxUI - это обертка, которая применяет шрифты и цвета
    <MaxUI>
      {/* Простой контейнер с отступами и центрированием */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
        
        <h2>Медведь онлайн</h2>
        
        <p style={{ color: isMaxEnvironment ? 'green' : 'orange' }}>
          {isMaxEnvironment ? '✅ Работаем внутри MAX' : '⚠️ Открыто в браузере (для тестов)'}
        </p>

        <p>Здравствуйте! Я цифровой помощник. Выберите действие:</p>

        <Button onClick={handleStartSurvey}>
          Начать опрос
        </Button>

        {message && (
          <div style={{ padding: '12px', backgroundColor: '#e0f7fa', borderRadius: '8px' }}>
            {message}
          </div>
        )}
      </div>
    </MaxUI>
  );
}

export default App;