import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { decodeBech32, SendNofferRequest, SimplePool, generateSecretKey } from '@shocknet/clink-sdk';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import './Payment.css';

// Module-level pool (like the working demos)
const pool = new SimplePool();

// Persistent client key
function getPrivateKey() {
  const stored = localStorage.getItem('plebcafe_client_key');
  if (stored) {
    return new Uint8Array(JSON.parse(stored));
  }
  const key = generateSecretKey();
  localStorage.setItem('plebcafe_client_key', JSON.stringify(Array.from(key)));
  return key;
}

const clientPrivateKey = getPrivateKey();

function Payment({ totalUSD, totalSats, offerString, onBack, onComplete }) {
  const [invoice, setInvoice] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('requesting'); // requesting | pending | paid | failed
  const [error, setError] = useState(null);
  const receiptCallbackRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Clear stale localStorage state on mount to prevent stuck states
  useEffect(() => {
    // Clear any stale payment-related state that might cause issues
    localStorage.removeItem('plebcafe_requestEventId');
    localStorage.removeItem('plebcafe_invoice');
    localStorage.removeItem('plebcafe_invoiceCreatedAt');
    localStorage.removeItem('plebcafe_lockedSats');
    localStorage.removeItem('plebcafe_paymentStatus');
  }, []);

  // Use ref for cancelled state so it persists across re-renders
  const cancelledRef = useRef(false);
  const hasRequestedInvoiceRef = useRef(false);

  useEffect(() => {
    // Only request invoice once when status is 'requesting' and we have an offer string
    if (!offerString || paymentStatus !== 'requesting' || hasRequestedInvoiceRef.current) return;

    cancelledRef.current = false;
    hasRequestedInvoiceRef.current = true;

    const requestInvoice = async () => {
      try {
        const decoded = decodeBech32(offerString);
        if (decoded.type !== 'noffer') throw new Error('Invalid offer string');
        
        const { relay, pubkey, offer } = decoded.data;

        console.log('[Payment] Calling SendNofferRequest with:', { relay, pubkey, offer, amount_sats: totalSats });
        
        // Wrap in Promise.race with manual timeout as fallback
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000);
        });
        
        // Set up receipt callback to detect when payment is received
        // Use refs to access latest state without closure issues
        const onReceipt = (receipt) => {
          console.log('[Payment] Receipt callback invoked with:', receipt);
          console.log('[Payment] Current cancelled state:', cancelledRef.current);
          
          if (cancelledRef.current) {
            console.log('[Payment] Receipt callback cancelled, ignoring');
            return;
          }
          
          try {
            console.log('[Payment] Payment receipt received, updating status to paid');
            setPaymentStatus('paid');
            // Trigger confetti animation
            triggerConfetti();
            // Don't auto-complete - let user click button to go back
          } catch (err) {
            console.error('[Payment] Error in receipt callback:', err);
          }
        };
        
        // Store callback in ref so it persists
        receiptCallbackRef.current = onReceipt;

        // Pass explicit 60 second timeout to SDK and receipt callback
        const requestPromise = SendNofferRequest(
          pool,
          clientPrivateKey,
          [relay],
          pubkey,
          { offer, amount_sats: totalSats },
          60, // 60 second timeout
          onReceipt // Receipt callback - called when payment is received
        );
        
        const response = await Promise.race([requestPromise, timeoutPromise]);
        
        console.log('[Payment] SendNofferRequest returned:', response);

        if (cancelledRef.current) return;

        if ('bolt11' in response) {
          setInvoice(response.bolt11);
          setPaymentStatus('pending');
          // Receipt callback is now active and will be called when payment is received
          // Don't set cancelled = true here - we need to keep listening for receipts
        } else {
          const errorMsg = response.error || 'Failed to get invoice';
          console.error('[Payment] Invoice request failed:', errorMsg);
          setError(errorMsg);
          setPaymentStatus('failed');
        }
      } catch (err) {
        if (cancelledRef.current) return;
        const errorMsg = err.message || 'Failed to get invoice';
        console.error('[Payment] Error requesting invoice:', err);
        setError(errorMsg);
        setPaymentStatus('failed');
      }
    };

    requestInvoice();

    return () => {
      // Only cancel when component unmounts or offerString/totalSats change (new request)
      // Don't cancel when paymentStatus changes - we need to keep listening for receipts
      cancelledRef.current = true;
      hasRequestedInvoiceRef.current = false;
    };
  }, [offerString, totalSats]); // Removed paymentStatus from deps to prevent re-running when status changes

  const handlePaymentComplete = () => {
    setPaymentStatus('paid');
    setTimeout(onComplete, 2000);
  };

  const handleBack = () => {
    onBack();
  };

  // Confetti animation function
  const triggerConfetti = () => {
    const colors = ['#E8B923', '#F5D042', '#28a745', '#dc3545', '#007bff', '#6f42c1'];
    const confettiCount = 50;
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      container.appendChild(confetti);
    }

    // Remove confetti container after animation
    setTimeout(() => {
      document.body.removeChild(container);
    }, 5000);
  };

  if (error) {
    return (
      <div className="payment-container">
        <div className="payment-error">
          <FaTimesCircle className="error-icon" />
          <h2>Payment Error</h2>
          <p>{error}</p>
          <button className="back-btn" onClick={handleBack}>Go Back</button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'requesting') {
    return (
      <div className="payment-container">
        <div className="payment-content">
          <div className="payment-loading">
            <FaSpinner className="spinner" />
            <p>Requesting invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'paid') {
    return (
      <div className="payment-container">
        <div className="payment-content">
          <div className="payment-success">
            <FaCheckCircle className="success-icon" />
            <h2>Payment Successful!</h2>
            <p className="success-message">Thank you for your purchase</p>
            <button 
              className="shop-again-btn" 
              onClick={() => {
                if (onCompleteRef.current) {
                  onCompleteRef.current();
                }
              }}
            >
              Shop Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-content">
        <h2>Awaiting Payment</h2>
        
        <div className="payment-summary">
          <div className="summary-line">
            <span>Total:</span>
            <span className="summary-amount">${totalUSD.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Amount:</span>
            <span className="summary-sats">~{totalSats.toLocaleString()} sats</span>
          </div>
        </div>

        {invoice && (
          <div className="qr-section">
            <p className="qr-instructions">Scan with a Lightning wallet to pay</p>
            <div className="qr-code-wrapper">
              <QRCodeSVG value={invoice.toUpperCase()} size={256} level="M" />
            </div>
            <button 
              className="copy-invoice-btn" 
              onClick={() => navigator.clipboard.writeText(invoice)}
              aria-label="Copy invoice"
              title="Copy invoice"
            >
              📋
            </button>
          </div>
        )}

        <div className="payment-status">
          {paymentStatus === 'pending' && (
            <div className="status-pending">
              <FaSpinner className="spinner" />
              <span>Waiting for payment...</span>
            </div>
          )}
        </div>

        <div className="payment-actions">
          <button className="back-btn" onClick={handleBack}>Cancel</button>
        </div>

        <div className="powered-by">
          <span>Powered by</span>
          <a href="https://clinkme.dev" target="_blank" rel="noopener noreferrer">
            <img src="/images/clink-logo.png" alt="CLINK" className="clink-logo" />
            <span className="clink-text">CLINK</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Payment;
