# ExcelienSparks Backend API

## Description
Backend API server for ExcelienSparks wholesale e-commerce platform built with Node.js, Express, MongoDB, and Socket.io.

## Features
- RESTful API with Express
- MongoDB database with Mongoose ODM
- JWT authentication
- Real-time updates with Socket.io
- Role-based authorization (User/Admin)
- Request validation with express-validator
- Error handling middleware
- Rate limiting
- CORS enabled

## Prerequisites
- Node.js v14+ installed
- MongoDB instance (local or Atlas)
- MongoDB connection string

## Installation

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file and add your database password:
- Replace `<db_password>` in the `MONGODB_URI` with your actual MongoDB password
- Optionally change the `JWT_SECRET` to a secure random string

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)
- `POST /logout` - Logout user (protected)
- `POST /refresh-token` - Refresh access token

### Products (`/api/products`)
- `GET /` - Get all products (with pagination, search, filters)
- `GET /search` - Search products
- `GET /:id` - Get single product
- `POST /` - Create product (admin only)
- `PUT /:id` - Update product (admin only)
- `DELETE /:id` - Delete product (admin only)

### Cart (`/api/cart`)
- `GET /` - Get user cart (protected)
- `POST /add` - Add item to cart (protected)
- `PUT /update` - Update cart item (protected)
- `DELETE /remove/:cartId` - Remove item from cart (protected)
- `DELETE /clear` - Clear cart (protected)

### Orders (`/api/orders`)
- `POST /` - Create new order (protected)
- `GET /` - Get user orders (protected)
- `GET /:id` - Get order details (protected)
- `DELETE /:id/cancel` - Cancel order (protected)
- `GET /admin/all` - Get all orders (admin only)
- `PATCH /:id/status` - Update order status (admin only)

### Users (`/api/users`)
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update profile (protected)
- `POST /change-password` - Change password (protected)
- `GET /orders` - Get order history (protected)

## Socket.io Events

### Client -> Server
- `authenticate` - Authenticate user connection
- `orderStatusUpdate` - Update order status (admin)
- `stockUpdate` - Update product stock (admin)
- `newOrder` - Notify new order
- `joinAdminRoom` - Join admin notification room

### Server -> Client
- `orderStatusChanged` - Order status updated
- `orderUpdated` - Order updated (admin)
- `productStockUpdated` - Stock updated
- `newOrderReceived` - New order notification (admin)

## Project Structure
```
backend/
├── config/
│   └── database.js
├── controllers/
│   ├── auth.controller.js
│   ├── cart.controller.js
│   ├── order.controller.js
│   ├── product.controller.js
│   └── user.controller.js
├── middleware/
│   ├── admin.middleware.js
│   ├── auth.middleware.js
│   ├── errorHandler.middleware.js
│   └── validator.middleware.js
├── models/
│   ├── Cart.model.js
│   ├── Order.model.js
│   ├── Product.model.js
│   └── User.model.js
├── routes/
│   ├── auth.routes.js
│   ├── cart.routes.js
│   ├── order.routes.js
│   ├── product.routes.js
│   └── user.routes.js
├── socket/
│   └── socket.handler.js
├── utils/
│   ├── jwt.util.js
│   └── password.util.js
├── .env
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Environment Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT expiration time
- `FRONTEND_URL` - Frontend URL for CORS

## Testing
Use Postman, Thunder Client, or curl to test the API endpoints.

Example:
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Test Company"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

## License
ISC
