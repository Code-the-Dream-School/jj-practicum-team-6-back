# Back-End Repo for Node/React Practicum -Team 6

Backend for the **[Retrieve](https://jj-practicum-team-6-back.onrender.com/api/v1)** – a simple, safe, community-driven platform to quickly report, find, and recover lost items in public spaces.

Lost or Found Something? -→ USE **[RETRIEVE](https://jj-practicum-team-6-back.onrender.com/api/v1)}}

Built with **Node.js, Express, PostgreSQL, and Prisma**, this API provides authentication, secure item posting, messaging, and map integration.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 5 (or 4)
- **Database:** PostgreSQL + Prisma Client (JS)
- **Validation:** Zod
- **Auth & Security:** JWT (HS256), helmet
- **Logging:** pino
- **Environment Variables:** dotenv
- **Code Quality:** ESLint + Prettier
- **Testing:** Jest + Supertest

### Setting up local development environment

1. Create a folder to contain both the front-end and back-end repos 
2. Clone this repository to that folder
3. Run `npm install` to install dependencies
4. Pull the latest version of the `main` branch (when needed)
5. Run `npm run dev` to start the development server
6. Open http://localhost:8000/api/v1/ with your browser to test.
7. Your back-end server is now running. You can now run the front-end app.
8. Copy .env.example file in the project root :  `cp .env.example .env`

## DB setup (dev)

1) Put the private `DATABASE_URL` (Neon) into your local `.env` (ask a maintainer).

2) Generate Prisma client and apply migrations:
```bash
npx prisma generate
npx prisma migrate dev --name erd_full_init
```
3) Start the API: `npm run dev`
4) Verify Postgres is reachable: `curl http://localhost:8000/healthz/db`

Expected:
`{"success":true,"data":{"db":true}}`

>Notes: keep real secrets only in local .env / deployment env vars; don’t commit them.

## Seeding (Demo Data)

This project includes a Prisma seed script to create:
- base **categories** (Electronics, Clothing, Keys, Documents, Other)
- one **demo user**
- 3–4 **demo items** linked to that user and categories

## Scripts
```bash
`nodemon src/server.js` – start in dev mode (nodemon)
`node src/server.js` – start in production
`eslint . --fix` – check code style with ESLint
`prettier --write .` – format with Prettier
```
## API Features (MVP)
- **Auth & Security** - JWT sessions, password hashing
- **Item Posts** - photo, description, map pin
= **Seen It** - mark items as seen, notify owner
- **Comments & Messages** - user communication
- **Map Integration** - location browsing (Leaflet + Zippopotam.us API)
- **Radius Filter** – use current location and adjust a slider to show items within a chosen radius
- **Responsive API** - mobile-first, clean UI

## Security Notes
- **JWT** (HS256) for authentication
- **Helmet** middleware for basic security headers
- Input validation with **Zod**
- Logging with **Pino**

## API Documentation
All endpoints are documented in the included Postman collection: `/postman`

Import it into Postman to explore available routes and test requests.

### Teardown & Reset
To reset your local database and reseed demo data:

```bash
npx prisma migrate reset --force
npx prisma db seed
```

## Deployment
API is deployed on Render: **[Retrieve](https://jj-practicum-team-6-back.onrender.com/api/v1)**

## Next Steps
- **Admin & User Reports** – introduce admin role with tooling to review, flag, and action user reports
- **Seen Marks → Contact Flow** – show the list of users who marked “Seen it” and let the owner start a message thread
- **User Ratings** – enable community ratings to build trust and reputation
- **Push & Email Notifications** – automatic alerts for new messages, comments, or matching items

Thank you for exploring **Retrieve**. Together, let's make acts of kindness easier, more accessible, and more impactful! 
