# Web Shop API

REST API for an online shop, built as a group project for the Web course at IPL Vinci (Haute École Léonard de Vinci, Brussels), 2025.

## Features

- **Products and categories**: list, create, update and delete products, grouped by category.
- **Users**: client and admin roles, with permission checks on protected actions.
- **Orders**: create orders with several items and follow their status (new, processing, shipped, delivered, cancelled).
- **Support tickets**: open a ticket linked to an order and track it (open, in progress, closed).
- **Error logging**: errors are written to `logs/error.log`.

## Tech stack

- TypeScript
- Node.js, Express
- SQLite (better-sqlite3)

## Project structure

```text
src/
├── controllers/   # Express routes (/products, /categories, /users, /orders, /tickets)
├── services/      # Business logic and database queries
├── models/        # TypeScript types
└── utils/         # Data validation (type guards) and helpers
db/db_install.sql  # Database schema and sample data
http/              # HTTP requests to test the API
```

## Run the project

Use Git Bash on Windows.

```bash
bash install.sh   # creates the SQLite database and installs dependencies
npm run build     # compiles TypeScript (watch mode)
```

In another terminal:

```bash
npm run dev
```

## Team

- Zahra Hajji
- Simon Storme
- Adrian Kajewski
