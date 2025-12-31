import { usdToSats, formatSats } from '../utils/priceConversion';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart } from 'react-icons/fa';
import './Cart.css';

function Cart({ cart, btcPrice, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout, isOpen, onToggle }) {
  const totalUSD = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalSats = btcPrice ? usdToSats(totalUSD, btcPrice) : 0;

  if (cart.length === 0) {
    return (
      <div className={`cart ${isOpen ? 'cart-open' : ''}`}>
        <button className="cart-toggle" onClick={onToggle} aria-label="Toggle cart">
          <FaShoppingCart />
          <span className="cart-count">0</span>
        </button>
        <div className="cart-content">
          <div className="cart-empty">
            <p>Your cart is empty</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cart ${isOpen ? 'cart-open' : ''}`}>
      <button className="cart-toggle" onClick={onToggle} aria-label="Toggle cart">
        <FaShoppingCart />
        <span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
      </button>
      <div className="cart-content">
        <div className="cart-header">
          <h2>Your Cart</h2>
          <div className="cart-header-actions">
            <button className="clear-cart-btn" onClick={onClearCart} aria-label="Clear cart">
              Clear
            </button>
            <button className="cart-close" onClick={onToggle} aria-label="Close cart">×</button>
          </div>
        </div>
        <div className="cart-items">
          {cart.map((item) => {
            const itemSats = btcPrice ? usdToSats(item.price, btcPrice) : 0;
            return (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p className="cart-item-price">
                    ${item.price.toFixed(2)}
                    {btcPrice && itemSats > 0 && (
                      <span> (~{formatSats(itemSats)} sats)</span>
                    )}
                  </p>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <FaMinus />
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label="Remove item"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cart-footer">
          <div className="cart-total">
            <div className="total-line">
              <span>Total:</span>
              <span className="total-usd">${totalUSD.toFixed(2)}</span>
            </div>
            {btcPrice && totalSats > 0 && (
              <div className="total-line">
                <span>Total:</span>
                <span className="total-sats">~{formatSats(totalSats)} sats</span>
              </div>
            )}
          </div>
          <button className="checkout-btn" onClick={onCheckout}>
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;

