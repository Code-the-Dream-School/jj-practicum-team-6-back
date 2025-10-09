# Back-End Repo for Node/React Practicum -Team 6

Backend for the **[Retrieve](https://jj-practicum-team-6-back.onrender.com/api/v1)** – a simple, safe, community-driven platform to quickly report, find, and recover lost items in public spaces.

Lost or Found Something? → USE **[RETRIEVE](https://jj-practicum-team-6-back.onrender.com/api/v1)**

Built with **Node.js, Express, PostgreSQL, and Prisma**, this API provides authentication, secure item posting, messaging, and map integration.

👉 [**Front end**](https://github.com/Code-the-Dream-School/jj-practicum-team-6-front)

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 5 (or 4)
- **Database:** PostgreSQL + Prisma Client (JS) + Neon (DB hosting)
- **Validation:** Zod
- **Auth & Security:** JWT (HS256), helmet
- **Logging:** pino
- **Environment Variables:** dotenv
- **Code Quality:** ESLint + Prettier
- **Testing:** Postman

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
   We used [Neon](https://neon.com/) for serverless PostgreSQL hosting.
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

To customize seed data, edit `prisma/seed.js` and re-run `npx prisma migrate reset --force && npx prisma db s`

## Database Schema Overview
The Retrieve backend uses **PostgreSQL** with **Prisma ORM**.

### Data Model Summary Table

| Model | Purpose | Key Relationships                                                                                          |
| :--- | :--- |:-----------------------------------------------------------------------------------------------------------|
| **User** | Registered users, authentication, and item ownership. | **1:Many** with `Item`, `SeenMark`, `Comment`, `Message`                                                   |
| **Item** | A single lost or found post with details and status. | **1:1** with `Location`; **Many:1** with `User` (owner), `Category`; **1:Many** with `SeenMark`, `Comment` |
| **Category** | Defines the type of item (e.g., Electronics, Keys). | **1:Many** with `Item`                                                                                     |
| **Location** | Geographic coordinates for where the item was lost/found. | **1:1** with `Item`                                                                                        |
| **SeenMark** | Logs when a user marks an item as potentially sighted ("Seen It"). | **Many:1** with `User` (marker) and `Item`                                                                 |
| **MessageThread** | A private chat room/thread for communication between two users (e.g., item owner and a finder). | **Many:Many** (Implicitly via `MessageThreadOnUsers`)                                                      |
| **Comment** | Public communication thread on an item's page. | **Many:1** with `User` (commenter) and `Item`                                                              |
| **Message** | Private, direct communication between two users (e.g., owner and finder). | **Many:Many** (Implicitly via a message thread/room)                                                       |
| **PasswordResetToken** | Stores the secure, temporary token used for password reset requests. | **Many:1** with `User`                                                                                     |

### **Prisma Schema Excerpt (Conceptual)**

This conceptual excerpt shows the key models, fields, and relationships. For the complete, definitive schema, please view the source file: **[prisma/schema.prisma](https://github.com/Code-the-Dream-School/jj-practicum-team-6-back/blob/main/prisma/schema.prisma)**

>In the Prisma schema, field types may include a `?` suffix. This indicates whether the field is required or optional when creating or updating records. This applies to all types (String?, Int?, DateTime?, etc.) and affects both validation and database constraints.


## Detailed Database Schema

### Enums

The application uses a single enumeration for item status:

```typescript
enum ItemStatus {
    LOST     @map("lost")
    FOUND    @map("found")
    RESOLVED @map("resolved")
}
```

### Models (Tables)

#### `User` (`users` table)

| Field Name | Data Type (Prisma/SQL) | Nullable? | Key/Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (`UUID`) | No | Primary Key | Unique ID for the user. |
| `firstName` | `String` | No | | User's first name. |
| `lastName` | `String` | No | | User's last name. |
| `email` | `String` | No | **Unique** | User's unique email address. |
| `password` | `String` | No | | Hashed password. |
| `phoneNumber` | `String?` | Yes | | User's phone number. |
| `zipCode` | `String` | No | | User's current ZIP code. |
| `avatarUrl` | `String?` | Yes | | URL to the user's profile picture. |
| `avatarPublicId` | `String?` | Yes | | Public ID for image storage. |
| `createdAt` | `DateTime` | No | | Timestamp of creation. |
| `updatedAt` | `DateTime` | No | | Last update timestamp. |
| **Relationships**|  Comments, Items, Messages, Threads, Reset Tokens. |

#### `Category` (`categories` table)

| Field Name | Data Type (Prisma/SQL) | Nullable? | Key/Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | No | **Primary Key**, **Unique** | Unique name of the category (e.g., 'Keys'). |
| `createdAt` | `DateTime` | No | | Timestamp of creation. |
| `updatedAt` | `DateTime` | No | | Last update timestamp. |
| **Relationships**|  Items (`Item[]`). |

#### `Item` (`items` table)

| Field Name | Data Type (Prisma/SQL)                                  | Nullable? | Key/Constraint | Description |
| :--- |:--------------------------------------------------------| :--- | :--- | :--- |
| `id` | `String` (`UUID`)                                       | No | Primary Key | Unique ID for the item post. |
| `ownerId` | `String` (`UUID`)                                       | No | Foreign Key (`User`) | ID of the user who posted the item. |
| `categoryName` | `String`                                                | No | Foreign Key (`Category`) | Name of the item's category. |
| `title` | `String`                                                | No | | Concise title. |
| `description` | `String?`                                               | Yes | | Detailed description. |
| `status` | `ItemStatus` (Enum)                                     | No | | Current status. |
| `isResolved` | `Boolean`                                               | No | | Flag for final resolution status. |
| `dateReported` | `DateTime`                                              | No | | Date the item was reported. |
| `updatedAt` | `DateTime`                                              | No | | Last update timestamp. |
| `zipCode` | `String`                                                | No | | ZIP code where item was lost/found. |
| `latitude` | `Float?`                                                | Yes | | Geographic latitude. |
| `longitude` | `Float?`                                                | Yes | | Geographic longitude. |
| **Relationships**|  Owner, Category, Comments, Photos, Seen Marks, Threads.|

#### `ItemPhoto` (`item_photos` table)

| Field Name | Data Type (Prisma/SQL) | Nullable? | Key/Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (`UUID`) | No | Primary Key | Unique ID for the photo record. |
| `itemId` | `String` (`UUID`) | No | Foreign Key (`Item`) | ID of the item this photo belongs to. |
| `url` | `String` | No | | Public URL of the hosted photo. |
| `createdAt` | `DateTime` | No | | Timestamp of creation. |

#### `ItemComment` (`item_comments` table)

| Field Name | Data Type (Prisma/SQL) | Nullable? | Key/Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (`UUID`) | No | Primary Key | Unique ID for the comment. |
| `itemId` | `String` (`UUID`) | No | Foreign Key (`Item`) | ID of the item the comment is on. |
| `authorId` | `String` (`UUID`) | No | Foreign Key (`User`) | ID of the user who wrote the comment. |
| `body` | `String` | No | | The content of the comment. |
| `createdAt` | `DateTime` | No | | Timestamp of creation. |

#### `SeenMark` (`seen_marks` table)

| Field Name | Data Type (Prisma/SQL) | Nullable? | Key/Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (`UUID`) | No | Primary Key | Unique ID for the seen mark. |
| `itemId` | `String` (`UUID`) | No | Foreign Key (`Item`) | ID of the item marked as seen. |
| `userId` | `String` (`UUID`) | No | Foreign Key (`User`) | ID of the user who marked the item as seen. |
| `createdAt` | `DateTime` | No | | Timestamp of creation. |
| **(Composite)** | | | **Unique** (`itemId` + `userId`) | Ensures a user can only mark an item as seen once. |

#### `Thread` (`threads` table)

| Field Name | Data Type (Prisma/SQL) | Nullable? | Key/Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (`UUID`) | No | Primary Key | Unique ID for the private message thread. |
| `itemId` | `String` (`UUID`) | No | Foreign Key (`Item`) | The item this thread is about. |
| `ownerId` | `String` (`UUID`) | No | Foreign Key (`User`) | The item's owner. |
| `participantId` | `String` (`UUID`) | No | Foreign Key (`User`) | The second user in the chat. |
| `createdAt` | `DateTime` | No | | Timestamp of creation. |
| `updatedAt` | `DateTime` | No | | Last update timestamp. |
| `ownerLastReadMessageId`| `String?` (`UUID`) | Yes | | ID of the last message the owner read. |
| `participantLastReadMessageId`| `String?` (`UUID`) | Yes | | ID of the last message the participant read. |
| **(Composite)** | | | **Unique** (`itemId` + `participantId`) | Enforces only one thread per item and participant. |

#### `Message` (`messages` table)

| Field Name | Data Type (Prisma/SQL) | Nullable? | Key/Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (`UUID`) | No | Primary Key | Unique ID for the message. |
| `threadId` | `String` (`UUID`) | No | Foreign Key (`Thread`) | ID of the thread this message belongs to. |
| `senderId` | `String` (`UUID`) | No | Foreign Key (`User`) | ID of the user who sent the message. |
| `body` | `String` | No | | The content of the message. |
| `attachmentUrl` | `String?` | Yes | | URL for an optional attachment. |
| `createdAt` | `DateTime` | No | | Timestamp of creation. |

#### `PasswordResetToken` (`password_reset_tokens` table)

| Field Name | Data Type (Prisma/SQL) | Nullable? | Key/Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (`UUID`) | No | Primary Key | Unique ID for the token record. |
| `userId` | `String` (`UUID`) | No | Foreign Key (`User`) | ID of the user requesting the reset (**On Delete: Cascade**). |
| `tokenHash` | `String` | No | **Unique** | Secure hash of the temporary reset token. |
| `expiresAt` | `DateTime` | No | | Timestamp when the token becomes invalid. |
| `usedAt` | `DateTime?` | Yes | | Timestamp when the token was successfully used. |
| `createdAt` | `DateTime` | No | | Timestamp of creation. |

## Schema Versioning & Sync
To ensure all teams stay in sync with the latest database schema:

### Keep Prisma Schema Consistent
- Always run `npx prisma format` before committing changes to schema.prisma to enforce consistent formatting.
- Use `npx prisma validate` to confirm schema integrity before pushing.

### Sync Migrations Across Repos
- Commit all migration files in prisma/migrations/ to version control.
- When pulling schema changes from another team:
```
  git pull origin main
  npx prisma generate
  npx prisma migrate dev
```

### Compare Schema Versions
To compare your local schema with another branch or repo:
```
npx prisma diff --from-schema-datamodel prisma/schema.prisma --to-schema-datamodel ../other-repo/prisma/schema.prisma
```

> This helps identify model, field, or relation differences before merging or deploying.

### Validate Before Deploy
Before pushing to production or syncing across teams:
```
npx prisma validate
npx prisma migrate status
```

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
To test the Retrieve backend locally or against the deployed API, follow these steps:

### Import Postman Collection & Environment
- Open Postman.
- Click Import (top left).
- Select the following files from the /postman folder:
    - Retrieve.postman_collection.json
    - Retrieve.postman_environment.json

These files contain all available routes and environment variables for local and deployed testing.

### Run the Full Collection
- In Postman, go to Collections and select Retrieve.
- Click `Run Collection`.
- Choose the environment:
    - **Retrieve** Local → for testing http://localhost:8000/api/v1
    - **Retrieve** Production → for testing use deployed link **[Retrieve](https://jj-practicum-team-6-back.onrender.com/api/v1)**
- Click `Run Retrieve API`.

This will test all major endpoints including auth, item posting, comments, and seen marks.

https://github.com/user-attachments/assets/58ee9843-eda1-430a-9973-389e72c72ccb

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

PowerPoint presentation: [**Retrieve Slides**](https://docs.google.com/presentation/d/1kmkmQmopy_FSHxKi34KFXDexV-gsfafNM_O4dGANZxg/edit?slide=id.g37fb6f1c553_0_105#slide=id.g37fb6f1c553_0_105)

## Acknowledgments
This journey wouldn’t have been possible without the incredible people who made it happen:

**Mentors**: John McGarvey and KJ Loving, for their invaluable guidance and encouragement.

And a hard-working team that turned vision into reality:

**Development Back End Team**: Aida Burlutckaia, Vera Fesianava
**Development Front End Team**: Alina Dalantaeva, Hemang Limbachiya, Masouma Ahmadi Jay

Thank you for exploring **Retrieve**. Together, let's make acts of kindness easier, more accessible, and more impactful! 
