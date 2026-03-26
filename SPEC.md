# ResGuard Mobile - Specification Document

## 1. Project Overview

**Project Name**: ResGuard Mobile  
**Type**: React Native Mobile Application (Expo)  
**Core Functionality**: Residential management app for residents to manage payments, reservations, intercom calls, and participate in assembly voting.  
**Target Users**: Residential building residents (apartments/townhouses)

---

## 2. Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native + Expo SDK 55 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| UI Library | React Native Paper (Material Design 3) |
| Icons | React Native Vector Icons |
| State | React useState/useContext |
| Backend | Supabase (PostgreSQL) |
| Auth | Clerk or Supabase Auth |
| Encryption | expo-crypto (SHA-256) |
| Storage | expo-secure-store |

---

## 3. App Structure

```
ResGuardMobile/
├── app/                      # Expo Router screens
│   ├── _layout.tsx           # Root layout with providers
│   └── (tabs)/               # Bottom tab navigation
│       ├── _layout.tsx       # Tab navigator config
│       ├── index.tsx         # Home/Dashboard
│       ├── citofono.tsx      # Intercom calls
│       ├── pagos.tsx         # Payments
│       ├── reservas.tsx      # Common area reservations
│       └── asambleas.tsx     # Assembly voting
├── src/
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Theme & utilities
│   ├── services/             # API & business logic
│   └── types/                # TypeScript types
└── supabase/
    └── migrations/           # Database migrations
```

---

## 4. Features

### 4.1 Home Dashboard
- Welcome message with user info and unit
- Quick stats (balance, reservations, notifications)
- Quick action buttons
- Recent communications preview
- Quick links to Marketplace, Rental, Settings

### 4.2 Citofono (Intercom)
- **Quick Call Buttons**: Call vigilante or administrator
- **Contact List**: View and call building staff
- **Call History**: View past intercom calls
- **Incoming Call Modal**: Simulated call UI with timer

### 4.3 Pagos (Payments)
- Account balance summary
- Pending payments alert
- Payment history list
- Pay now functionality
- Payment methods info

### 4.4 Reservas (Reservations)
- Available common areas display
- Create new reservation form
- My reservations list with status
- Cancel reservation option
- Reservation rules

### 4.5 Asambleas (Assembly Voting) - NEW FEATURE
- Assembly list with status (upcoming/active/closed)
- Agenda items to vote on
- **Secure encrypted voting**:
  - Vote encrypted client-side before sending
  - Hash-based verification without revealing choice
  - One vote per user per item (immutable)
- View results after voting/closing

---

## 5. Security - Encrypted Voting

### 5.1 Voting Process
1. User selects vote option
2. Vote + timestamp + user ID are combined
3. SHA-256 hash generated
4. Combined string base64 encoded (encrypted)
5. Both encrypted vote and hash stored in database

### 5.2 Vote Privacy
- Encrypted votes cannot be decrypted by anyone
- Hash allows verification that vote was cast
- No way to link vote hash to specific user choice
- One vote per user per agenda item (UNIQUE constraint)

### 5.3 Database Schema
```sql
votes (
  id UUID PRIMARY KEY,
  agenda_item_id UUID,
  user_id UUID,
  encrypted_vote TEXT,   -- Base64 encoded encrypted vote
  vote_hash VARCHAR(64), -- SHA-256 hash for verification
  created_at TIMESTAMPTZ,
  UNIQUE(agenda_item_id, user_id)
)
```

---

## 6. Database Migrations

The project includes migration files in `supabase/migrations/`:

- `001_init.sql` - Original schema (from web project)
- `002_citofono_asambleas.sql` - New features:
  - Intercom calls table
  - Device tokens for push notifications
  - Assemblies and agenda items
  - Encrypted votes with RLS policies

---

## 7. UI Design

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #F59E0B | Main actions, headers |
| Secondary | #3B82F6 | Secondary actions |
| Success | #10B981 | Confirmed, paid |
| Warning | #F59E0B | Pending |
| Error | #EF4444 | Alerts, errors |
| Background | #F9FAFB | Screen backgrounds |
| Surface | #FFFFFF | Cards, surfaces |

### Components
- Material Design 3 via React Native Paper
- Bottom tab navigation with icons
- Cards for content grouping
- Chips for status badges
- Modals for forms and confirmations

---

## 8. Running the App

```bash
# Install dependencies
cd ResGuardMobile
npm install

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

---

## 9. Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 10. Next Steps

1. Connect to real Supabase backend
2. Implement real authentication (Clerk/Supabase Auth)
3. Add push notifications for intercom calls
4. Implement WebRTC for real video/audio calls
5. Add the remaining tabs (Marketplace, Rental, Settings)
6. Build and deploy to App Store / Play Store
