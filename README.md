# TechProject Frontend

Next.js (React, TypeScript, Bootstrap) + Firebase Auth. Runs on **http://localhost:3000**.

Backend alag project hai (`techproject-backend`, port 3001). Frontend sirf backend ki API call karta hai, Firestore direct use nahi karta.

---

## Pages

| Page | Kaun dekh sakta hai | Kaam |
|---|---|---|
| `/login` | Sab | Email / password se login |
| `/super-admin` | `super_admin` | Organizations create (details + user limit) / list / edit / delete (soft delete, organization ke saath uska admin bhi banta hai). "View users" se us organization ke users ki read-only list. "Deleted organizations" tab mein deleted organizations aur unka **Activate** button |
| `/admin` | `admin` | Apni organization ke users create / list / delete (soft delete). User limit poori hone par notice dikhta hai aur create form band ho jata hai. "Deleted users" tab mein deleted users aur unka **Activate** button |
| `/profile` | `user` | User apna naam, email, tasveer aur password khud badal sakta hai |
| `/dashboard` | `user` | Apna profile dekhna |

Login ke baad user apne role ke page par chala jata hai. Galat role wala page khole to redirect ho jata hai.

---

## Setup

```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
npm run dev
```

`.env.local` mein yeh bharo:

- `NEXT_PUBLIC_API_URL` : backend ka URL (default `http://localhost:3001`)
- `NEXT_PUBLIC_FIREBASE_*` : Firebase Console → Project settings → General → Your apps → Web app

Pehle **backend** chalao aur uska super admin seed karo (backend ka README dekho), phir yahan us email/password se login karo.

| Command | Kaam |
|---|---|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Production server (port 3000) |
| `npm run typecheck` | TypeScript errors check |

---

## Login / JWT kaise kaam karta hai

```
Login page ── Firebase Auth (email + password) ──► ID token (JWT)
     │
     ▼
apiFetch()  ── Authorization: Bearer <token> ──► Backend verify karta hai
     │                                              │
     ▼                                              ▼
AuthContext ◄──────────── GET /api/me ───────── role, naam, organization
```

- Token Firebase khud refresh karta hai, alag se kuch nahi karna.
- Role check UI mein sirf convenience ke liye hai. Asli security backend karta hai har request par.

---

## Folder structure

```
src/
├── app/
│   ├── layout.tsx            # Common layout (Bootstrap + theme + AuthProvider + Navbar)
│   ├── theme.css             # Dark theme (Electric Blue + Violet), sir ki theme table ke colors
│   ├── page.tsx              # Home: role ke hisaab se redirect
│   ├── login/page.tsx
│   ├── super-admin/page.tsx
│   ├── admin/page.tsx
│   └── dashboard/page.tsx
├── components/
│   ├── Navbar.tsx
│   └── RequireRole.tsx       # Page ko role se protect karta hai
├── context/
│   └── AuthContext.tsx       # useAuth(): profile, login, logout
├── lib/
│   ├── api.ts                # apiFetch(): backend call + JWT automatically
│   ├── firebase.ts           # Firebase web config
│   ├── orgTypes.ts           # Organization types ki list
│   └── roles.ts              # Har role ka home page
└── types/
    └── index.ts              # Shared types (Role, Profile, Organization, ...)
```

---

## Rules

- `.env.local` kabhi GitHub par push nahi karna.
- Naya page protect karna ho to `<RequireRole roles={["admin"]}>` se wrap karo.
- Backend ko call karne ke liye hamesha `apiFetch()` use karo (token khud lag jata hai).
