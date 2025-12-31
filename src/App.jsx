import { useState, useEffect } from 'react';
import MenuDisplay from './components/MenuDisplay';
import Cart from './components/Cart';
import Payment from './components/Payment';
import { usdToSats } from './utils/priceConversion';
import './App.css';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [offerString, setOfferString] = useState(() => {
    // Load offerString from localStorage on init
    const saved = localStorage.getItem('plebcafe_offerString');
    return saved || '';
  });
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on init
    const saved = localStorage.getItem('plebcafe_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [btcPrice, setBtcPrice] = useState(null);
  const [view, setView] = useState(() => {
    // Load view from localStorage on init, but only if we have a cart
    const savedView = localStorage.getItem('plebcafe_view');
    const savedCart = localStorage.getItem('plebcafe_cart');
    if (savedView === 'payment' && savedCart) {
      const cart = JSON.parse(savedCart);
      if (cart && cart.length > 0) {
        return 'payment';
      }
    }
    return 'menu';
  });
  const [savedTotalSats, setSavedTotalSats] = useState(() => {
    // Load saved totalSats from localStorage
    const saved = localStorage.getItem('plebcafe_totalSats');
    return saved ? parseFloat(saved) : null;
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('plebcafe_cart', JSON.stringify(cart));
  }, [cart]);

  // Save view to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('plebcafe_view', view);
  }, [view]);

  // Save offerString to localStorage when it changes
  useEffect(() => {
    if (offerString) {
      localStorage.setItem('plebcafe_offerString', offerString);
    }
  }, [offerString]);

  // Load menu configuration
  useEffect(() => {
    // Use import.meta.env.BASE_URL to get the base path (e.g., '/PlebCafe/')
    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}menu.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load menu');
        return res.json();
      })
      .then((data) => {
        // Fix image paths to use base URL
        const baseUrl = import.meta.env.BASE_URL;
        const fixedMenuItems = (data.menuItems || []).map(item => ({
          ...item,
          image: item.image?.startsWith('/') ? `${baseUrl}${item.image.slice(1)}` : item.image
        }));
        setMenuItems(fixedMenuItems);
        setOfferString(data.offer || '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Fetch BTC price from Coinbase API
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
        const data = await response.json();
        if (data.data && data.data.rates && data.data.rates.USD) {
          setBtcPrice(parseFloat(data.data.rates.USD));
        }
      } catch (err) {
        console.error('Failed to fetch BTC price:', err);
      }
    };

    fetchBtcPrice();
    // Refresh every 60 seconds
    const interval = setInterval(fetchBtcPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const totalUSD = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // If BTC price is missing, try to fetch it before proceeding
    if (!btcPrice) {
      try {
        const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
        const data = await response.json();
        if (data.data && data.data.rates && data.data.rates.USD) {
          const fetchedPrice = parseFloat(data.data.rates.USD);
          setBtcPrice(fetchedPrice);
          // Recalculate with new price
          const totalSats = usdToSats(totalUSD, fetchedPrice);
          if (totalSats > 0 && totalUSD > 0) {
            localStorage.setItem('plebcafe_totalSats', totalSats.toString());
            setSavedTotalSats(totalSats);
            setView('payment');
            setCartOpen(false);
          }
        } else {
          // Price still unavailable, don't proceed
          return;
        }
      } catch (err) {
        console.error('Failed to fetch BTC price:', err);
        // Price unavailable, don't proceed
        return;
      }
      return;
    }
    
    const totalSats = usdToSats(totalUSD, btcPrice);
    
    // Don't proceed to payment if amount is 0
    if (totalSats === 0 || totalUSD === 0) {
      return;
    }
    
    localStorage.setItem('plebcafe_totalSats', totalSats.toString());
    setSavedTotalSats(totalSats);
    setView('payment');
    setCartOpen(false);
  };

  const handlePaymentComplete = () => {
    setCart([]);
    setView('menu');
    localStorage.removeItem('plebcafe_view');
    localStorage.removeItem('plebcafe_cart');
    localStorage.removeItem('plebcafe_totalSats');
    localStorage.removeItem('plebcafe_invoice');
    localStorage.removeItem('plebcafe_invoiceCreatedAt');
    localStorage.removeItem('plebcafe_lockedSats');
    localStorage.removeItem('plebcafe_paymentStatus');
    setSavedTotalSats(null);
    // Could show a success message here
  };

  const totalUSD = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSats = btcPrice ? usdToSats(totalUSD, btcPrice) : (savedTotalSats || 0);
  
  // Update savedTotalSats when btcPrice loads and we're on payment view
  useEffect(() => {
    if (view === 'payment' && btcPrice && cart.length > 0 && !savedTotalSats) {
      const calculatedSats = usdToSats(totalUSD, btcPrice);
      if (calculatedSats > 0) {
        localStorage.setItem('plebcafe_totalSats', calculatedSats.toString());
        setSavedTotalSats(calculatedSats);
      }
    }
  }, [view, btcPrice, totalUSD, cart.length, savedTotalSats]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="PlebCafe" className="logo" />
        </div>
      </header>

      <main className="app-main">
        {view === 'menu' && (
          <>
            <MenuDisplay
              menuItems={menuItems}
              btcPrice={btcPrice}
              onAddToCart={addToCart}
            />
            <Cart
              cart={cart}
              btcPrice={btcPrice}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              onCheckout={handleCheckout}
              isOpen={cartOpen}
              onToggle={() => setCartOpen(!cartOpen)}
            />
          </>
        )}

        {view === 'payment' && (
          <Payment
            cart={cart}
            totalUSD={totalUSD}
            totalSats={totalSats}
            offerString={offerString}
            onBack={() => setView('menu')}
            onComplete={handlePaymentComplete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
