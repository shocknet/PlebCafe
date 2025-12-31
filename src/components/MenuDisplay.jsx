import { usdToSats, formatSats } from '../utils/priceConversion';
import { FaPlus } from 'react-icons/fa';
import './MenuDisplay.css';

function MenuDisplay({ menuItems, btcPrice, onAddToCart }) {
  return (
    <div className="menu-display">
      <div className="menu-grid">
        {menuItems.map((item) => {
          const sats = btcPrice ? usdToSats(item.price, btcPrice) : 0;
          return (
            <div key={item.id} className="menu-item-card">
              <div className="menu-item-image">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="menu-item-info">
                <h3 className="menu-item-name">{item.name}</h3>
                <p className="menu-item-description">{item.description}</p>
                <div className="menu-item-price">
                  <span className="price-usd">${item.price.toFixed(2)}</span>
                  {btcPrice && sats > 0 && (
                    <span className="price-sats">~{formatSats(sats)} sats</span>
                  )}
                </div>
                <button
                  className="add-to-cart-btn"
                  onClick={() => onAddToCart(item)}
                  aria-label={`Add ${item.name} to cart`}
                >
                  <FaPlus /> Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MenuDisplay;

