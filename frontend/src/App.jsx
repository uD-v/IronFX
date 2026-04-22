import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
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

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // News Ticker
  const newsItems = [
    "532 users are online right now",
    "Traders made $12,034 on USD/EUR pair today",
    "Bitcoin breaks new resistance levels this week",
    "Platform upgrade scheduled for this weekend"
  ];
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNewsIndex(prev => (prev + 1) % newsItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [selectedPair, setSelectedPair] = useState("NASDAQ/APPL");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30min");
  const [isPairSelectorOpen, setIsPairSelectorOpen] = useState(false);
  const [isTimeframeSelectorOpen, setIsTimeframeSelectorOpen] = useState(false);
  const [pairSearchQuery, setPairSearchQuery] = useState("");

  const currencyPairs = [
    "CRYPTO/BTCUSD", "CRYPTO/ETHUSD", "CRYPTO/SOLUSD",
    "FOREX/EURUSD", "FOREX/GBPUSD", "FOREX/USDJPY",
    "NASDAQ/APPL", "NASDAQ/TSLA", "NASDAQ/NVDA"
  ];

  const timeframes = [
    "1min", "5min", "15min", "30min", "1H", "4H", "1D"
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
        showToast("File size exceeds 8MB. Please select a smaller file.", "error");
        return;
      }
      setSelectedImage(URL.createObjectURL(file));
      setIsUploadModalOpen(false);
      showToast("Chart screenshot uploaded successfully!", "success");
    }
  };

  const clearImage = (e) => {
    e.stopPropagation();
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
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
  const activeTrades = useCountUp(147, 2000, 0);

  const signalsTotal = 20;
  const targetSignalsUsed = 12;
  const activeSignalsUsedRaw = useCountUp(targetSignalsUsed, 2000, 4);
  const activeSignalsPercentage = Math.min(100, Math.max(0, (activeSignalsUsedRaw / signalsTotal) * 100));
  const activeSignalsHue = Math.max(0, 120 - (activeSignalsPercentage * 1.2));

  const targetConfidence = 73.6;
  const activeConfidenceRaw = useCountUp(targetConfidence, 2000, 4);

  const tradesData = [
    { id: 1, asset: "CRYPTO/BTCUSD", time: "22.04.2026 21:05", side: "BUY", pl: "+$112.50 (2.4%)" },
    { id: 2, asset: "FOREX/EURUSD", time: "22.04.2026 18:42", side: "SELL", pl: "-$24.10 (0.4%)" },
    { id: 3, asset: "NASDAQ/TSLA", time: "21.04.2026 15:30", side: "SELL", pl: "+$89.20 (5.1%)" },
    { id: 4, asset: "NASDAQ/NVDA", time: "21.04.2026 10:15", side: "BUY", pl: "-$145.00 (3.2%)" },
    { id: 5, asset: "CRYPTO/ETHUSD", time: "20.04.2026 09:20", side: "BUY", pl: "+$430.15 (12.5%)" }
  ];

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
              <div className="menu-container" style={{position: 'relative'}}>
                <ion-icon name="menu-outline" onClick={() => setIsMenuOpen(!isMenuOpen)}></ion-icon>
                {isMenuOpen && (
                  <div className="dropdown-menu" style={{position: 'absolute', top: '100%', right: '0', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '200px', marginTop: '10px'}}>
                    <Link to="/trading-history" onClick={() => setIsMenuOpen(false)} style={{color: '#e2e8f0', padding: '0.5rem', borderRadius: '4px', textDecoration: 'none'}}>Trading History</Link>
                    <Link to="/" onClick={() => setIsMenuOpen(false)} style={{color: '#fff', background: '#3b82f6', padding: '0.5rem', borderRadius: '4px', textDecoration: 'none', textAlign: 'center', marginTop: '0.5rem', fontWeight: '500'}}>Get Signals</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/trading-history" element={
            <div className="page-history" style={{ textAlign: 'center', marginTop: '4rem', minHeight: '50vh' }}>
              <h1 style={{ color: '#fff', fontSize: '2.5rem' }}>Trading history</h1>
              <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Your past trades and signals will be listed here.</p>
            </div>
          } />
          
          <Route path="/" element={
            <>
        {/* Grouping trades text and stats bar closely */}
        <div className="dashboard-stats-group" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Dashboard Top */}
          <div className="dashboard-top">
            <div className="greeting">
              <h1>Good evening, <span>Andrei</span></h1>
              <p>You have made total of <strong><span style={{ display: 'inline-block', minWidth: '3ch', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{activeTrades}</span></strong> trades with us already!</p>
            </div>
          </div>

          {/* Stats Progress */}
          <div className="stats-container">
            <div className="stat-item">
              <p>Signals used: <span style={{ display: 'inline-block', minWidth: '2ch', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(activeSignalsUsedRaw)}</span>/{signalsTotal}</p>
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
              <p>Average confidence: {activeConfidenceRaw.toFixed(1)}%</p>
              <div className="progress-bar-bg">
                <div className="progress-fill fill-blue" style={{ width: `${activeConfidenceRaw}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="controls-container" style={{ marginTop: '2rem' }}>
          <div className="control-group" style={{ position: 'relative' }}>
            <label>Currency Pair:</label>
            <div className="select-box" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => {setIsPairSelectorOpen(!isPairSelectorOpen); setIsTimeframeSelectorOpen(false); if(isPairSelectorOpen) setPairSearchQuery("");}}>
              {selectedPair}
              <ion-icon name="chevron-down-outline"></ion-icon>
            </div>
            {isPairSelectorOpen && (
              <div className="custom-dropdown" style={{position: 'absolute', top: '100%', left: 0, width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 100, marginTop: '8px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>
                <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <input 
                    type="text" 
                    placeholder="Search pairs..." 
                    value={pairSearchQuery}
                    onChange={(e) => setPairSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', padding: '0.4rem 0.6rem', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {currencyPairs.filter(p => p.toLowerCase().includes(pairSearchQuery.toLowerCase())).map(pair => (
                    <div key={pair} className="dropdown-item" onClick={() => {setSelectedPair(pair); setIsPairSelectorOpen(false); setPairSearchQuery("");}} style={{padding: '0.8rem 1rem', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: selectedPair === pair ? '#3b82f6' : '#e2e8f0', background: selectedPair === pair ? 'rgba(59,130,246,0.1)' : 'transparent', transition: 'background 0.2s'}}>
                      {pair}
                    </div>
                  ))}
                  {currencyPairs.filter(p => p.toLowerCase().includes(pairSearchQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>No pairs found</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="control-group" style={{ position: 'relative' }}>
            <label>Timeframe:</label>
            <div className="select-box" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => {setIsTimeframeSelectorOpen(!isTimeframeSelectorOpen); setIsPairSelectorOpen(false);}}>
              {selectedTimeframe}
              <ion-icon name="chevron-down-outline"></ion-icon>
            </div>
            {isTimeframeSelectorOpen && (
              <div className="custom-dropdown" style={{position: 'absolute', top: '100%', left: 0, width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 100, marginTop: '8px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)'}}>
                {timeframes.map(tf => (
                  <div key={tf} className="dropdown-item" onClick={() => {setSelectedTimeframe(tf); setIsTimeframeSelectorOpen(false);}} style={{padding: '0.8rem 1rem', fontSize: '0.85rem', cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: selectedTimeframe === tf ? '#3b82f6' : '#e2e8f0', background: selectedTimeframe === tf ? 'rgba(59,130,246,0.1)' : 'transparent', textAlign: 'center', transition: 'background 0.2s'}}>
                    {tf}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
              <h3>Upload a Chart Screenshot</h3>
              <p>Max size: 8MB</p>
            </>
          )}
        </div>

        {/* Action Button */}
        <button className="btn-action">Get Signal</button>

        {/* Trades Table */}
        <div className="trades-section">
          <h2>Last few trades:</h2>
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
                    <span className="trade-side">{trade.side}</span>
                    <span className={`trade-pl ${plClass}`}>
                      {isLoss ? 'LOSS' : 'PROFIT'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/trading-history" style={{ color: '#94a3b8', fontSize: '0.95rem', textDecoration: 'none', cursor: 'pointer' }}>
              View all trading history
            </Link>
          </div>
        </div>
          </>
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
