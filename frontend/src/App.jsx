import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import logoUrl from '../img/logo.png';

// Hook for animating numbers
function useCountUp(endValue, duration = 2000, decimals = 0) {
  // Start the value halfway to its target
  const initialValue = endValue / 2;
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrame;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      // Interpolate from initialValue upwards
      setValue(initialValue + (endValue - initialValue) * easeOut);
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setValue(endValue);
      }
    };
    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [endValue, duration, initialValue]);

  return Number(value.toFixed(decimals));
}

const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  const date = new Date(timeString);
  return `${date.toLocaleDateString('en-GB').replace(/\//g, '.')} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

const t = {
  en: {
    tradingHistory: "Trading history",
    noHistory: "No trading history available yet.",
    viewFullHistory: "View full trading history",
    noMoreTrades: "No more trades in history.",
    profit: "PROFIT",
    loss: "LOSS",
    goodEvening: "Good evening",
    trader: "Trader",
    totalTrades: "You have made total of {count} trades with us already!",
    signalsUsed: "Signals used",
    avgConfidence: "Average confidence",
    currencyPair: "Currency Pair:",
    searchPairs: "Search pairs...",
    noPairs: "No pairs found",
    timeframe: "Timeframe:",
    uploadChart: "Upload a Chart Screenshot",
    maxSize: "Max size: 8MB",
    getSignal: "Get Signal",
    analyzing: "AI is analyzing the chart...",
    pleaseWait: "Please wait a moment",
    signalResult: "Signal Result",
    pair: "Pair",
    direction: "Direction",
    expiration: "Expiration",
    entryTime: "Entry Time",
    min: "min",
    now: "Now",
    confidence: "Confidence",
    aiComment: "AI Comment",
    wasProfitable: "Was this trade profitable?",
    closeAndUpload: "Close & Upload New Chart",
    analysisFailedTitle: "Analysis Failed",
    analysisFailedDesc: "We couldn't recognize a valid trading chart. Please make sure the currency pair and price quotes are clearly visible.",
    retakePhoto: "Retake Photo",
    toastSizeExceeds: "File size exceeds 8MB. Please select a smaller file.",
    toastAnalyzeFail: "Failed to analyze chart. Please try again.",
    toastNetworkError: "Network error. Please try again later.",
    toastInvalidChart: "Analysis failed: Please upload a valid trading chart.",
    toastTradeSaved: "Trade result saved successfully!",
    toastTradeFail: "Failed to save trade result.",
    menuTradingHistory: "Trading History",
    menuGetSignals: "Get Signals",
    loadingDashboard: "Loading dashboard data...",
    lastFewTrades: "Last few trades:",
    viewAllHistory: "View all trading history"
  },
  ru: {
    tradingHistory: "История сделок",
    noHistory: "История сделок пока недоступна.",
    viewFullHistory: "Посмотреть всю историю сделок",
    noMoreTrades: "Больше нет сделок в истории.",
    profit: "PROFIT",
    loss: "LOSS",
    goodEvening: "Добрый вечер",
    trader: "Трейдер",
    totalTrades: "Вы уже совершили {count} сделок с нами!",
    signalsUsed: "Использовано сигналов",
    avgConfidence: "Средняя уверенность",
    currencyPair: "Валютная пара:",
    searchPairs: "Поиск пар...",
    noPairs: "Пары не найдены",
    timeframe: "Таймфрейм:",
    uploadChart: "Загрузить скриншот графика",
    maxSize: "Макс. размер: 8MB",
    getSignal: "Получить сигнал",
    analyzing: "ИИ анализирует график...",
    pleaseWait: "Пожалуйста, подождите",
    signalResult: "Результат сигнала",
    pair: "Пара",
    direction: "Направление",
    expiration: "Экспирация",
    entryTime: "Время входа",
    min: "мин",
    now: "Сейчас",
    confidence: "Уверенность",
    aiComment: "Комментарий ИИ",
    wasProfitable: "Была ли сделка прибыльной?",
    closeAndUpload: "Закрыть и загрузить новый график",
    analysisFailedTitle: "Анализ не удался",
    analysisFailedDesc: "Мы не смогли распознать валидный график. Убедитесь, что валютная пара и котировки четко видны.",
    retakePhoto: "Сделать другое фото",
    toastSizeExceeds: "Размер файла превышает 8MB. Пожалуйста, выберите файл поменьше.",
    toastAnalyzeFail: "Не удалось проанализировать график. Пожалуйста, попробуйте еще раз.",
    toastNetworkError: "Ошибка сети. Пожалуйста, попробуйте позже.",
    toastInvalidChart: "Анализ не удался: Загрузите валидный график.",
    toastTradeSaved: "Результат сделки успешно сохранен!",
    toastTradeFail: "Не удалось сохранить результат сделки.",
    menuTradingHistory: "История сделок",
    menuGetSignals: "Получить сигналы",
    loadingDashboard: "Загрузка данных дашборда...",
    lastFewTrades: "Последние сделки:",
    viewAllHistory: "Посмотреть всю историю сделок"
  }
};

function TradingHistory({ userStats, lang = 'en' }) {
  const [visibleCount, setVisibleCount] = useState(10);
  const l = t[lang];

  if (!userStats || userStats.length === 0) {
    return (
      <div className="page-history" style={{ textAlign: 'center', marginTop: '4rem', minHeight: '50vh' }}>
        <h1 style={{ color: '#fff', fontSize: '2.5rem' }}>{l.tradingHistory}</h1>
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>{l.noHistory}</p>
      </div>
    );
  }

  const tradesData = userStats.map(trade => ({
    id: trade.id,
    asset: trade.currency_pair.length > 6 ? trade.currency_pair : `FOREX/${trade.currency_pair}`,
    time: formatTime(trade.created_at),
    lost: trade.lost
  }));

  const visibleTrades = tradesData.slice(0, visibleCount);

  return (
    <div className="page-history" style={{ textAlign: 'center', marginTop: '4rem', minHeight: '50vh', padding: '0 1rem' }}>
      <h1 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '2rem' }}>{l.tradingHistory}</h1>
      <div className="trades-section" style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
        <div className="trade-list">
          {visibleTrades.map(trade => {
            const isLoss = trade.lost;
            const plClass = isLoss ? "trade-sell" : "trade-buy";

            return (
              <div className="trade-card" key={trade.id}>
                <div className="trade-info">
                  <div className={`trade-icon ${isLoss ? 'loss' : 'profit'}`}>
                    <ion-icon name={isLoss ? 'arrow-down-outline' : 'arrow-up-outline'}></ion-icon>
                  </div>
                  <div>
                    <span className="trade-asset">{trade.asset}</span>
                    <span className="trade-time">{trade.time}</span>
                  </div>
                </div>
                <div className="trade-details">
                  <span className={`trade-pl ${plClass}`}>
                    {isLoss ? l.loss : l.profit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {visibleCount < tradesData.length ? (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <span 
              onClick={() => setVisibleCount(prev => prev + 10)}
              style={{
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.95rem',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#fff'}
              onMouseOut={(e) => e.target.style.color = '#94a3b8'}
            >
              {l.viewFullHistory}
            </span>
          </div>
        ) : (
          tradesData.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
              {l.noMoreTrades}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function App() {
  const [lang, setLang] = useState("en");
  const l = t[lang];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // User and Stats State
  const [userData, setUserData] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const API_BASE_URL = 'https://fffc-91-196-55-126.ngrok-free.app';
  const TG_ID = "123";

  const toggleLanguage = async (newLang) => {
    setIsLangMenuOpen(false);
    if (newLang === lang) return;
    setLang(newLang);
    try {
      await fetch(`${API_BASE_URL}/api/user/change-lang/`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "tgInitData": TG_ID
        },
        body: JSON.stringify({ language: newLang })
      });
    } catch (e) {
      console.error("Failed to update language", e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          "ngrok-skip-browser-warning": "true",
          "tgInitData": TG_ID
        };

        const [verifyRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/user/verify/`, { headers }),
          fetch(`${API_BASE_URL}/api/user/stats/`, { headers })
        ]);

        const verifyData = await verifyRes.json();
        if (verifyData.ok) {
          setUserData(verifyData.user);
          if (verifyData.user.language) {
            setLang(verifyData.user.language);
          }
        }

        const statsData = await statsRes.json();
        if (statsData.ok) {
          setUserStats(statsData.stats.reverse());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // News Ticker Generator
  const generateNewsItems = (lang) => {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD', 'SOL/USD', 'AAPL', 'TSLA', 'GOLD', 'OIL'];
    const templates = [
      { en: "{users} users are online right now", ru: "Сейчас онлайн {users} пользователей" },
      { en: "Traders made ${profit} on {pair} today", ru: "Трейдеры заработали ${profit} на {pair} сегодня" },
      { en: "{pair} breaks new resistance levels this week", ru: "{pair} пробивает новые уровни на этой неделе" },
      { en: "Platform upgrade scheduled for this weekend", ru: "Обновление платформы на этих выходных" },
      { en: "Over {trades} trades executed in the last hour", ru: "Более {trades} сделок за последний час" },
      { en: "AI accuracy reached {accuracy}% yesterday", ru: "Точность ИИ достигла {accuracy}% вчера" },
      { en: "{pair} shows strong bullish momentum", ru: "{pair} показывает сильный бычий импульс" },
      { en: "Market volatility expected to increase at {time} GMT", ru: "Ожидается рост волатильности в {time} GMT" },
      { en: "Top trader just closed a ${profit} profit on {pair}", ru: "Топ-трейдер закрыл профит ${profit} на {pair}" },
      { en: "{users} new accounts opened today", ru: "Сегодня открыто {users} новых счетов" },
      { en: "Average profit margin holding steady at {accuracy}%", ru: "Средняя маржа держится на уровне {accuracy}%" },
      { en: "Watch out for upcoming news impacting {pair}", ru: "Следите за новостями, влияющими на {pair}" },
      { en: "Daily trading volume surpassed ${largeNum}M", ru: "Дневной объем торгов превысил ${largeNum} млн" },
      { en: "Signal success rate currently at {accuracy}%", ru: "Текущая успешность сигналов {accuracy}%" },
      { en: "Many traders are buying {pair} right now", ru: "Многие трейдеры сейчас покупают {pair}" }
    ];

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomItem = (arr) => arr[randomInt(0, arr.length - 1)];

    const newsList = [];
    for (let i = 0; i < 50; i++) {
      const template = templates[i % templates.length];
      const text = template[lang]
        .replace('{users}', randomInt(400, 2500))
        .replace('{profit}', randomInt(500, 15000).toLocaleString())
        .replace('{pair}', randomItem(pairs))
        .replace('{trades}', randomInt(5000, 50000).toLocaleString())
        .replace('{accuracy}', randomInt(82, 98))
        .replace('{time}', `${randomInt(8, 20)}:00`)
        .replace('{largeNum}', randomInt(10, 500));
      newsList.push(text);
    }
    
    return newsList.sort(() => Math.random() - 0.5);
  };

  const [newsItems, setNewsItems] = useState([]);

  useEffect(() => {
    setNewsItems(generateNewsItems(lang));
  }, [lang]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    if (newsItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentNewsIndex(prev => (prev + 1) % newsItems.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [newsItems.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [signalResult, setSignalResult] = useState(null);

  const [selectedTimeframe, setSelectedTimeframe] = useState("30min");
  const [isTimeframeSelectorOpen, setIsTimeframeSelectorOpen] = useState(false);

  const timeframes = [
    "5s", "15s", "30s", "1min", "3min", "5min", "10min", "15min", "30min", "1H", "2H", "4H", "1D"
  ];
  
  // Toast Notification System (Stackable)
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const closeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  // Mobile swipe-to-close logic
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchCurrentY, setTouchCurrentY] = useState(0);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    e.target.value = null; // Clear input to allow re-selection of the same file
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setIsUploadModalOpen(false);
        showToast(l.toastSizeExceeds, "error");
        return;
      }
      setSelectedImage(URL.createObjectURL(file));
      setSelectedImageFile(file);
      setIsUploadModalOpen(false);
    }
  };

  const clearImage = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleGetSignal = async () => {
    if (!selectedImageFile) {
      showToast("Please select a chart screenshot first.", "warning");
      return;
    }
    setIsAnalyzing(true);
    setSignalResult(null);
    
    const formData = new FormData();
    formData.append("photo", selectedImageFile);
    formData.append("timeframe", selectedTimeframe);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/signal/`, {
        method: 'POST',
        headers: {
          "ngrok-skip-browser-warning": "true",
          "tgInitData": TG_ID
        },
        body: formData
      });
      const data = await response.json();
      if (data.ok) {
        data.entry_time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        setSignalResult(data);
        if (data.limit !== undefined) {
          setUserData(prev => ({...prev, limit: data.limit}));
        }
        
        // Show error status if the photo is not a valid graph
        if (!data.direction || data.direction === "None" || data.direction === "WAIT" || (data.comment && (data.comment.includes("не отправил") || data.comment.includes("не распознана")))) {
          showToast(l.toastInvalidChart, "error");
        }
      } else {
        showToast(data.message || l.toastAnalyzeFail, "error");
      }
    } catch (error) {
      console.error("Signal analysis error:", error);
      showToast(l.toastNetworkError, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedback = async (isLoss) => {
    if (!signalResult) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/stats/`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "tgInitData": TG_ID
        },
        body: JSON.stringify({
          currency_pair: signalResult.pair || "Unknown",
          is_lost: isLoss ? "1" : "0"
        })
      });
      const data = await response.json();
      if (data.ok) {
        showToast(l.toastTradeSaved, "success");
        // Construct trade locally if the backend didn't return it (old version)
        const newTrade = data.trade || {
          id: Date.now(),
          currency_pair: signalResult.pair || "Unknown",
          lost: isLoss,
          created_at: new Date().toISOString()
        };
        setUserStats(prev => [newTrade, ...prev]);
        setSignalResult(null);
        clearImage();
      } else {
        showToast(data.message || l.toastTradeFail, "error");
      }
    } catch (error) {
      console.error("Feedback error:", error);
      showToast(l.toastNetworkError, "error");
    }
  };

  const handleCloseSignal = () => {
    setSignalResult(null);
    clearImage();
  };

  const handleTouchStart = (e) => setTouchStartY(e.touches[0].clientY);
  const handleTouchMove = (e) => {
    const y = e.touches[0].clientY;
    if (y > touchStartY) setTouchCurrentY(y - touchStartY);
  };
  const handleTouchEnd = () => {
    if (touchCurrentY > 100) setIsUploadModalOpen(false);
    setTouchCurrentY(0);
  };

  // Animated Dashboard Data
  const activeTrades = useCountUp(userStats.length, 2000, 0);

  const signalsTotal = userData ? 20 : 20; // Default or from userData limit if available, currently limit is remaining signals, let's assume total is always 20
  const targetSignalsUsed = userData ? (20 - userData.limit) : 0;
  const activeSignalsUsedRaw = useCountUp(targetSignalsUsed, 2000, 4);
  const activeSignalsPercentage = Math.min(100, Math.max(0, (activeSignalsUsedRaw / signalsTotal) * 100));
  const activeSignalsHue = Math.max(0, 120 - (activeSignalsPercentage * 1.2));

  // Calculate average confidence based on wins
  const totalTrades = userStats.length;
  const winningTrades = userStats.filter(t => !t.lost).length;
  const targetConfidence = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const activeConfidenceRaw = useCountUp(targetConfidence, 2000, 4);



  const tradesData = userStats.map(trade => ({
    id: trade.id,
    asset: trade.currency_pair.length > 6 ? trade.currency_pair : `FOREX/${trade.currency_pair}`, // simple heuristic
    time: formatTime(trade.created_at),
    side: trade.lost ? "LOSS" : "PROFIT", // backend only tells us if lost, no side/pl available
    pl: trade.lost ? "-$" : "+$" // placeholder for PL
  })).slice(0, 5); // take last 5

  return (
    <div className="app-wrapper">
      {/* Toast Notification System */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-notification toast-${t.type} toast-visible`}>
            <div className="toast-content">
              <ion-icon name={t.type === 'error' ? 'alert-circle-outline' : t.type === 'warning' ? 'warning-outline' : 'checkmark-circle-outline'}></ion-icon>
              <p>{t.message}</p>
            </div>
            <button className="toast-close-btn" onClick={() => closeToast(t.id)}>
              <ion-icon name="close-outline"></ion-icon>
            </button>
          </div>
        ))}
      </div>

      {/* Background aesthetics */}
      <div className="bg-gradients">
        <div className="glow-circle glow-1"></div>
        <div className="glow-circle glow-2"></div>
        <div className="glow-circle glow-3"></div>
        
        {/* Decorative sharp circles */}
        <div className="sharp-circle sharp-1"></div>
        <div className="sharp-circle sharp-2"></div>
        <div className="sharp-circle sharp-3"></div>
      </div>

      <div className="app-content">
        {/* Header */}
        <header className={isSticky ? 'header-scrolled' : ''}>
          {/* News Ticker Bar */}
          <div className="news-ticker">
            <div 
              className="news-ticker-track" 
              style={{ transform: `translateY(-${currentNewsIndex * 24}px)` }}
            >
              {newsItems.map((news, i) => (
                <div key={i} className="news-ticker-item">{news}</div>
              ))}
            </div>
          </div>

          <div className="header-inner">
            <div className="logo" style={{cursor: 'pointer'}}>
              <Link to="/">
                <img src={logoUrl} alt="IronFX" />
              </Link>
            </div>
            <div className="header-icons">
              <div className="lang-container" style={{position: 'relative'}}>
                <ion-icon name="globe-outline" onClick={() => { setIsLangMenuOpen(!isLangMenuOpen); setIsMenuOpen(false); }} style={{ fontSize: '1.4rem', cursor: 'pointer' }}></ion-icon>
                {isLangMenuOpen && (
                  <div className="dropdown-menu" style={{position: 'absolute', top: '100%', right: '0', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: '120px', marginTop: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>
                    <div onClick={() => toggleLanguage('en')} style={{padding: '0.5rem 1rem', color: lang === 'en' ? '#3b82f6' : '#e2e8f0', background: lang === 'en' ? 'rgba(59,130,246,0.1)' : 'transparent', borderRadius: '4px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'}}>English</div>
                    <div onClick={() => toggleLanguage('ru')} style={{padding: '0.5rem 1rem', color: lang === 'ru' ? '#3b82f6' : '#e2e8f0', background: lang === 'ru' ? 'rgba(59,130,246,0.1)' : 'transparent', borderRadius: '4px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'}}>Русский</div>
                  </div>
                )}
              </div>
              <div className="menu-container" style={{position: 'relative'}}>
                <ion-icon name="menu-outline" onClick={() => { setIsMenuOpen(!isMenuOpen); setIsLangMenuOpen(false); }} style={{ cursor: 'pointer' }}></ion-icon>
                {isMenuOpen && (
                  <div className="dropdown-menu" style={{position: 'absolute', top: '100%', right: '0', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '200px', marginTop: '10px'}}>
                    <Link to="/trading-history" onClick={() => setIsMenuOpen(false)} style={{color: '#e2e8f0', padding: '0.5rem', borderRadius: '4px', textDecoration: 'none'}}>{l.menuTradingHistory}</Link>
                    <Link to="/" onClick={() => setIsMenuOpen(false)} style={{color: '#fff', background: '#3b82f6', padding: '0.5rem', borderRadius: '4px', textDecoration: 'none', textAlign: 'center', marginTop: '0.5rem', fontWeight: '500'}}>{l.menuGetSignals}</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/trading-history" element={<TradingHistory userStats={userStats} lang={lang} />} />
          
          <Route path="/" element={
            isLoadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#fff' }}>
                <div className="loader"></div>
                <p style={{ marginLeft: '1rem' }}>{l.loadingDashboard}</p>
              </div>
            ) : (
            <>
        {/* Grouping trades text and stats bar closely */}
        {!selectedImage && (
          <div className="dashboard-stats-group" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Dashboard Top */}
            <div className="dashboard-top">
              <div className="greeting">
                <h1>{l.goodEvening}, <span>{l.trader}</span></h1>
                <p>{l.totalTrades.split('{count}')[0]}<strong><span style={{ display: 'inline-block', minWidth: `${Math.max(1, userStats.length.toString().length)}ch`, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{activeTrades}</span></strong>{l.totalTrades.split('{count}')[1]}</p>
              </div>
            </div>

            {/* Stats Progress */}
            <div className="stats-container">
              <div className="stat-item">
                <p>{l.signalsUsed}: <span style={{ display: 'inline-block', minWidth: '2ch', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(activeSignalsUsedRaw)}</span>/{signalsTotal}</p>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${activeSignalsPercentage}%`,
                      background: `linear-gradient(90deg, hsl(${activeSignalsHue}, 80%, 35%), hsl(${activeSignalsHue}, 80%, 50%))` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="stat-item">
                <p>{l.avgConfidence}: {activeConfidenceRaw.toFixed(1)}%</p>
                <div className="progress-bar-bg">
                  <div className="progress-fill fill-blue" style={{ width: `${activeConfidenceRaw}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls-container" style={{ marginTop: '2rem' }}>
          <div className="control-group" style={{ position: 'relative', width: '100%' }}>
            <label>{l.timeframe}</label>
            <div className="select-box" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setIsTimeframeSelectorOpen(!isTimeframeSelectorOpen)}>
              {selectedTimeframe}
              <ion-icon name="chevron-down-outline"></ion-icon>
            </div>
            {isTimeframeSelectorOpen && (
              <div className="custom-dropdown" style={{position: 'absolute', top: '100%', left: 0, width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 100, marginTop: '8px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)'}}>
                {timeframes.map(tf => (
                  <div key={tf} className="dropdown-item" onClick={() => {setSelectedTimeframe(tf); setIsTimeframeSelectorOpen(false);}} style={{padding: '0.6rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: selectedTimeframe === tf ? '#3b82f6' : '#e2e8f0', background: selectedTimeframe === tf ? 'rgba(59,130,246,0.1)' : 'transparent', textAlign: 'center', transition: 'background 0.2s'}}>
                    {tf}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isAnalyzing ? (
          <div className="upload-area analyzing-state" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem 1rem', marginTop: '0.5rem' }}>
            <div className="loader" style={{ marginBottom: '1rem', width: '40px', height: '40px', borderTopColor: '#3b82f6', borderLeftColor: '#3b82f6' }}></div>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{l.analyzing}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{l.pleaseWait}</p>
          </div>
        ) : signalResult ? (
          (!signalResult.direction || signalResult.direction === "None" || signalResult.direction === "WAIT" || (signalResult.comment && (signalResult.comment.includes("не отправил") || signalResult.comment.includes("не распознана")))) ? (
            <div className="signal-result-card" style={{ background: 'rgba(30,41,59,0.8)', borderRadius: '16px', padding: '2rem 1.5rem', border: '1px solid rgba(239,68,68,0.3)', marginTop: '0.5rem', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>
                <ion-icon name="warning-outline"></ion-icon>
              </div>
              <h3 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{l.analysisFailedTitle}</h3>
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: '1.5' }}>{signalResult.comment || l.analysisFailedDesc}</p>
              <button onClick={handleCloseSignal} style={{ padding: '0.8rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
                {l.retakePhoto}
              </button>
            </div>
          ) : (
            <div className="signal-result-card" style={{ background: 'rgba(30,41,59,0.8)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem' }}>
              <h3 style={{ color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>{l.signalResult}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="signal-detail">
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{l.pair}</span>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{signalResult.pair}</div>
              </div>
              <div className="signal-detail">
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{l.direction}</span>
                <div style={{ color: signalResult.direction === 'UP' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>{signalResult.direction}</div>
              </div>

              <div className="signal-detail">
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{l.expiration}</span>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>
                  {signalResult.expiration && !isNaN(parseInt(signalResult.expiration)) 
                    ? `${Math.max(1, Math.round(parseInt(signalResult.expiration) / 60))} ${l.min}` 
                    : signalResult.expiration || 'N/A'}
                </div>
              </div>
              <div className="signal-detail">
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{l.entryTime}</span>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{signalResult.entry_time || l.now}</div>
              </div>
              <div className="signal-detail">
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{l.timeframe}</span>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{signalResult.timeframe || selectedTimeframe}</div>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{l.confidence}</span>
              <div className="progress-bar-bg" style={{ marginTop: '0.5rem', height: '8px' }}>
                <div className="progress-fill fill-blue" style={{ width: `${signalResult.confidence || 0}%`, background: '#3b82f6' }}></div>
              </div>
              <div style={{ textAlign: 'right', color: '#fff', fontSize: '0.85rem', marginTop: '0.2rem' }}>{signalResult.confidence}%</div>
            </div>
            
            {signalResult.comment && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>{l.aiComment}</span>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.4' }}>{signalResult.comment}</p>
              </div>
            )}
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h4 style={{ color: '#fff', marginBottom: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>{l.wasProfitable}</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleFeedback(false)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{l.profit}</button>
                <button onClick={() => handleFeedback(true)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{l.loss}</button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <span onClick={handleCloseSignal} style={{ color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>{l.closeAndUpload}</span>
              </div>
            </div>
          </div>
          )
        ) : (
          <>
            {/* Upload Area */}
            <div 
              className={`upload-area ${selectedImage ? 'has-image' : ''}`} 
              onClick={() => !selectedImage && setIsUploadModalOpen(true)}
            >
              {selectedImage ? (
                <div className="uploaded-image-container">
                  <img src={selectedImage} alt="Uploaded chart" className="uploaded-image-preview" />
                  <button className="delete-img-btn" onClick={clearImage}>
                    <ion-icon name="close-circle"></ion-icon>
                  </button>
                </div>
              ) : (
                <>
                  <ion-icon name="image-outline" class="upload-icon"></ion-icon>
                  <h3>{l.uploadChart}</h3>
                  <p>{l.maxSize}</p>
                </>
              )}
            </div>

            {/* Action Button */}
            {selectedImage && (
              <button className="btn-action" onClick={handleGetSignal}>{l.getSignal}</button>
            )}
          </>
        )}

        {/* Trades Table */}
        <div className="trades-section">
          <h2>{l.lastFewTrades}</h2>
          <div className="trade-list">
            {tradesData.map(trade => {
              const isLoss = trade.pl.startsWith("-");
              const plClass = isLoss ? "trade-sell" : "trade-buy";

              return (
                <div className="trade-card" key={trade.id}>
                  <div className="trade-info">
                    <div className={`trade-icon ${isLoss ? 'loss' : 'profit'}`}>
                      <ion-icon name={isLoss ? 'arrow-down-outline' : 'arrow-up-outline'}></ion-icon>
                    </div>
                    <div>
                      <span className="trade-asset">{trade.asset}</span>
                      <span className="trade-time">{trade.time}</span>
                    </div>
                  </div>
                  <div className="trade-details">
                    <span className={`trade-pl ${plClass}`}>
                      {isLoss ? l.loss : l.profit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/trading-history" style={{ color: '#94a3b8', fontSize: '0.95rem', textDecoration: 'none', cursor: 'pointer' }}>
              {l.viewAllHistory}
            </Link>
          </div>
        </div>
            </>
          )
          } />
        </Routes>

        {/* Footer */}
        <footer>
          <img src={logoUrl} alt="IronFX" />
          <p>© 2026 IronFX. All rights reserved.</p>
        </footer>
      </div>

      {/* Hidden file inputs */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

      {/* Upload Modal Overlay */}
      {isUploadModalOpen && (
        <div className="upload-modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
          <div 
            className="upload-modal" 
            onClick={e => e.stopPropagation()}
            style={{ transform: `translateY(${touchCurrentY}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="modal-drag-handle" onClick={() => setIsUploadModalOpen(false)}></div>
            <button className="modal-close-desktop" onClick={() => setIsUploadModalOpen(false)}>
              <ion-icon name="close-outline"></ion-icon>
            </button>
            
            <h3 className="modal-title">Upload Image</h3>
            
            <div className="modal-options">
              <button className="modal-option-btn" onClick={() => cameraInputRef.current.click()}>
                <ion-icon name="camera-outline"></ion-icon>
                <span>Take a photo</span>
              </button>
              <button className="modal-option-btn" onClick={() => fileInputRef.current.click()}>
                <ion-icon name="image-outline"></ion-icon>
                <span>Upload an image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
