# PlebCafe Kiosk

A static React-based kiosk application for a snack cart, similar to McDonald's menu kiosks. Customers can browse menu items, add them to a cart, and pay using Bitcoin Lightning Network via the CLINK protocol.

## Features

- **Responsive Design**: Works on tablets (primary), phones, and laptops
- **Menu Display**: Grid layout of menu items with images, descriptions, and prices
- **Shopping Cart**: Add items, adjust quantities, view totals in USD and sats
- **Payment Processing**: Uses @shocknet/clink-sdk for CLINK protocol payments
- **Price Conversion**: Automatically fetches BTC price from Coinbase API and converts USD to satoshis
- **Touch-Friendly**: Large buttons and touch targets optimized for kiosk use

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure menu: Edit `dist/menu.json` to add your menu items and offer string.

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

The built files will be in the `dist/` directory, ready to serve on your tablet or web server.

## Configuration

### Menu Configuration (`dist/menu.json`)

The menu.json file contains:
- `menuItems`: Array of menu items with:
  - `id`: Unique identifier
  - `name`: Item name
  - `description`: Item description
  - `price`: Price in USD
  - `image`: Path to image (should be in `public/images/`)
- `offer`: Offer string for payment processing
  - Can be a noffer string (starts with "noffer1...")
  - Or a JSON string with `{"pubkey": "...", "relay": "...", "offer": "..."}`

## Technology Stack

- **React**: UI framework
- **Vite**: Build tool and dev server
- **@shocknet/clink-sdk**: Payment processing via CLINK protocol
- **react-icons**: Icon library
- **qrcode.react**: QR code generation for invoices
- **Coinbase API**: BTC/USD exchange rate

## Color Scheme

The app uses colors extracted from the PlebCafe logo:
- Primary Yellow: `#E8B923`
- Accent Yellow: `#F5D042`
- Dark Background: `#2c2c2c`
- Light Background: `#ffffff`

## Deployment

1. Build the application: `npm run build`
2. Serve the `dist/` directory using any static file server
3. For tablet deployment, you can use a simple HTTP server or deploy to a web hosting service

## License

MIT
