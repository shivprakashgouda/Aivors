# Elite Render Engine - Backend Setup

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Stripe keys:
```bash
cp .env.example .env
```

Get your Stripe keys from: https://dashboard.stripe.com/test/apikeys

### 3. Start the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3001`

## 📡 API Endpoints

### `POST /api/create-checkout-session`
Create a Stripe checkout session for subscription

**Request Body:**
```json
{
  "priceId": "price_pro_monthly",
  "planName": "Pro",
  "credits": 500
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### `POST /api/webhook`
Handle Stripe webhook events (subscription created, cancelled, etc.)

### `GET /api/subscription/:customerId`
Get active subscription details for a customer

### `POST /api/cancel-subscription`
Cancel a subscription at the end of the billing period

**Request Body:**
```json
{
  "subscriptionId": "sub_xxxxx"
}
```

## 🔧 Testing with Stripe CLI

Install Stripe CLI: https://stripe.com/docs/stripe-cli

Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3001/api/webhook
```

Use test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

## 📝 TODO for Production

- [ ] Add database integration (MongoDB/PostgreSQL)
- [ ] Implement user authentication
- [ ] Store subscription data in database
- [ ] Add email notifications
- [ ] Implement rate limiting
- [ ] Add logging system
- [ ] Deploy to production server
- [ ] Set up production Stripe keys
