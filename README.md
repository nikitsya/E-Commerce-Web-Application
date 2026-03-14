# Emerald Sip

Full-stack e-commerce web application for reusable bottles and eco-friendly products.

## What This Project Is

Emerald Sip is a learning-oriented production-style web shop with a complete customer and admin workflow:

- Customer catalog browsing, cart management, and checkout
- Guest and authenticated purchase flows
- JWT-based authentication and profile management
- Admin product, stock, customer, and sales management

## Core Stack

- Frontend: React (CRA), React Router v5, Axios
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Payments: PayPal (sandbox)

## System Architecture

```mermaid
flowchart LR
    C[Customer Browser] --> UI[React Client]
    A[Admin Browser] --> UI

    UI -->|REST API| API[Express Server]
    API --> DB[(MongoDB)]
    API --> FS[(Uploads Folder)]

    UI --> PSP[PayPal JS SDK]
    PSP --> PP[PayPal Sandbox API]

    subgraph Client
      UI
    end

    subgraph Server
      API
    end
```

## Checkout Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as React Client
    participant P as PayPal
    participant S as Express API
    participant DB as MongoDB

    U->>C: Add products to cart
    U->>C: Click checkout

    alt Logged-in user
        C->>S: POST /sales (JWT + order payload)
    else Guest user
        C->>S: POST /sales (guest payload)
    end

    C->>P: Start PayPal approval
    P-->>C: Payment confirmed
    C->>S: Finalize order
    S->>DB: Save sale and reduce stock
    DB-->>S: Persisted
    S-->>C: Order success response
    C-->>U: Show confirmation
```

## Access and Authorization Model

```mermaid
flowchart TD
    L[Login/Register] --> T[Issue JWT]
    T --> M[Auth Middleware]
    M --> R{Route Access Level}

    R -->|0| G[Guest]
    R -->|1| CU[Customer]
    R -->|2| AD[Admin]

    G --> GP[Public catalog and guest checkout]
    CU --> CP[Profile, history, authenticated checkout]
    AD --> AP[Product/stock/customer/sales management]
```

## Features

### Customer-facing

- Product catalog with search, filtering, and sorting
- Product details modal with image gallery
- Cart with quantity controls and stock-aware behavior
- Cart icon toggle behavior (click again removes an item)
- PayPal checkout for guest and logged-in users
- Registration and login with JWT authorization
- Profile editing with optional profile photo upload
- Purchase history with search, filtering, and sorting
- Per-item return action in purchase history

### Admin-facing

- Add, edit, and delete products
- Adjust product stock levels
- View customers
- View customer purchase history
- Route-level and role-based access protection

## Tech Details

### Client dependencies

- `react` 16.9
- `react-router-dom` 5.0
- `axios`
- `@paypal/react-paypal-js`

### Server dependencies

- `express` 5
- `mongoose` 8
- `jsonwebtoken`
- `bcryptjs`
- `multer`
- `cors`
- `dotenv`

## Project Structure

```text
.
├── docs
│   └── screenshots
├── client
│   ├── public
│   └── src
│       ├── components
│       ├── hooks
│       ├── config
│       └── css
├── server
│   ├── config
│   ├── models
│   ├── routes
│   ├── seeds/default
│   └── uploads
├── ProjectProgress.md
└── README.md
```

## Screenshots

<details>
  <summary>Click to open screenshots</summary>

**1. Product Catalog (Guest View)**
![Product Catalog (Guest View)](./docs/screenshots/screen-01.png)

**2. Shopping Cart**
![Shopping Cart](./docs/screenshots/screen-02.png)

**3. Guest Checkout Validation**
![Guest Checkout Validation](./docs/screenshots/screen-03.png)

**4. Login Page**
![Login Page](./docs/screenshots/screen-04.png)

**5. Product Catalog (Admin Management View)**
![Product Catalog (Admin Management View)](./docs/screenshots/screen-05.png)

**6. Admin Adjust Stock**
![Admin Adjust Stock](./docs/screenshots/screen-06.png)

**7. Admin View Customers**
![Admin View Customers](./docs/screenshots/screen-07.png)

**8. Admin Customer Purchase History**
![Admin Customer Purchase History](./docs/screenshots/screen-08.png)

**9. Admin Profile Modal**
![Admin Profile Modal](./docs/screenshots/screen-09.png)

**10. Edit Profile Page**
![Edit Profile Page](./docs/screenshots/screen-10.png)

**11. Registration Page**
![Registration Page](./docs/screenshots/screen-11.png)

**12. Product Catalog (Logged-In Customer View)**
![Product Catalog (Logged-In Customer View)](./docs/screenshots/screen-12.png)

**13. Product Catalog with Active Filters**
![Product Catalog with Active Filters](./docs/screenshots/screen-13.png)

**14. Customer Purchase History**
![Customer Purchase History](./docs/screenshots/screen-14.png)

</details>

## Demo Video

<video src="./docs/screencast.mp4" autoplay muted loop playsinline controls preload="metadata" width="100%">
  Your browser does not support embedded video.
</video>

Direct link: [Watch screencast](./docs/screencast.mp4)

## Prerequisites

- Node.js 18+
- npm
- Local MongoDB on default host/port (`mongodb://localhost`)


## Local Setup

1. Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

2. Start MongoDB locally.

3. Start backend (port `4000`):

```bash
cd server
nodemon
```

4. Start frontend (port `3000`):

```bash
cd client
npm start
```

5. Open `http://localhost:3000`


## API Overview

Main route groups:

- `/products`: public reads + admin create/update/delete
- `/users`: register/login, profile actions, admin customer management
- `/sales`: checkout, purchase history, returns, admin purchase history

