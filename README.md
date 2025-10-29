## 🧱 Recommended Folder Structure (Server Side)
`
server/
├── src/
│   ├── app.ts                     # Express app setup (middleware, routes)
│   ├── server.ts                  # Entry point (starts the server)
│   │
│   ├── config/                    # ⚙️ Configuration files
│   │   ├── db.ts                  # MongoDB connection setup
│   │   ├── env.ts                 # Environment variable loader
│   │   └── corsOptions.ts         # CORS config
│   │
│   ├── routes/                    # 🚏 All route definitions (connects to controllers)
│   │   ├── authRoutes.ts
│   │   ├── healthRoutes.ts
│   │   ├── journalRoutes.ts
│   │   ├── triggersRoutes.ts
│   │   ├── mlRoutes.ts
│   │   ├── trichBotRoutes.ts
│   │   ├── gameRoutes.ts
│   │   ├── loggerRoutes.ts
│   │   └── index.ts               # Exports all routes for app.ts
│   │
│   ├── controllers/               # 🧠 Handle HTTP req/res and use services
│   │   ├── authController.ts
│   │   ├── healthController.ts
│   │   ├── journalController.ts
│   │   ├── triggersController.ts
│   │   ├── mlController.ts
│   │   ├── trichBotController.ts
│   │   ├── gameController.ts
│   │   ├── loggerController.ts
│   │   └── summaryController.ts
│   │
│   ├── services/                  # ⚙️ Business logic and reusable helpers
│   │   ├── authService.ts
│   │   ├── healthService.ts
│   │   ├── journalService.ts
│   │   ├── triggersService.ts
│   │   ├── mlService.ts
│   │   ├── trichBotService.ts
│   │   ├── gameService.ts
│   │   ├── summaryService.ts
│   │   ├── alertService.ts
│   │   ├── loggerService.ts       # ← The one you just created
│   │   └── index.ts
│   │
│   ├── models/                    # 🧬 Mongoose models (DB structure)
│   │   ├── User.ts
│   │   ├── HealthLog.ts
│   │   ├── JournalEntry.ts
│   │   ├── TriggersInsights.ts
│   │   ├── TrichGame.ts
│   │   ├── TrichBot.ts
│   │   ├── Predict.ts
│   │   ├── AlertLog.ts
│   │   ├── SummaryLog.ts
│   │   ├── LogModel.ts            # ← New logging model
│   │   └── index.ts
│   │
│   ├── schemas/                   # ✅ Zod validation schemas (request validation)
│   │   ├── userSchema.ts
│   │   ├── healthSchema.ts
│   │   ├── journalSchema.ts
│   │   ├── triggersInsightsSchema.ts
│   │   ├── trichGameSchema.ts
│   │   ├── trichBotSchema.ts
│   │   ├── predictSchema.ts
│   │   └── index.ts
│   │
│   ├── utils/                     # 🧰 Helper utilities
│   │   ├── email.ts               # Email/notification logic
│   │   ├── jwt.ts                 # Token utilities
│   │   ├── logger.ts              # Simple console logging if needed
│   │   ├── errorHandler.ts        # Express error wrapper
│   │   ├── asyncHandler.ts        # Async route wrapper
│   │   └── index.ts
│   │
│   ├── middlewares/               # 🔐 Middleware for auth, logging, etc.
│   │   ├── authMiddleware.ts
│   │   ├── errorMiddleware.ts
│   │   └── logMiddleware.ts
│   │
│   ├── jobs/                      # 🕐 Scheduled jobs / background tasks
│   │   ├── alertJob.ts
│   │   ├── summaryJob.ts
│   │   ├── syncJob.ts
│   │   └── index.ts
│   │
│   └── tests/                     # 🧪 Unit & integration tests
│       ├── auth.test.ts
│       ├── ml.test.ts
│       ├── logger.test.ts
|       ├── health.test.ts
│       └── user.test.ts
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env
├── .dockerignore                       # Need to create
├── .eslintignore
├── .eslintrc.json
├── .prettierrc.json
├── nodemon.json
├── .gitignore
├── Dockerfile
└── docker-compose.yml                  # Need to create
`