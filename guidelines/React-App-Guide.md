# React App Guide

This guide explains how this project is structured, how the React app works, how to add or change pages, how to update menu items, how routing works, and how to get the app running after pulling it from Git for the first time.

## 1. What this project uses

- React for the UI
- Vite for development and production builds
- React Router for page routing
- Tailwind CSS v4 for styling
- Reusable UI components in `src/app/components/ui`

## 2. Project structure

The main app structure is:

```text
src/
  main.tsx
  styles/
    index.css
    tailwind.css
    theme.css
  app/
    App.tsx
    routes.tsx
    components/
      Layout.tsx
      ui/
      images/
    screens/
      Dashboard.tsx
      PublicLanding.tsx
      Login.tsx
      Register.tsx
      PowerGeneration.tsx
      ChickenCoop.tsx
      CropFarm.tsx
      WaterDistribution.tsx
      NotFound.tsx
```

What each part does:

- `src/main.tsx` starts the React app and loads global CSS.
- `src/app/App.tsx` renders the router.
- `src/app/routes.tsx` defines all app routes.
- `src/app/components/Layout.tsx` is the shared dashboard layout with the top menu and `Outlet`.
- `src/app/screens/` contains full-page screens.
- `src/app/components/ui/` contains reusable UI building blocks.
- `src/styles/` contains the global Tailwind and theme files.

## 3. How the app starts

The app boot flow is:

1. `src/main.tsx` mounts React into the root HTML element.
2. `src/app/App.tsx` renders `RouterProvider`.
3. `src/app/routes.tsx` decides which screen to render based on the URL.
4. If the route is under `/dashboard`, `Layout.tsx` renders first and then shows the selected screen inside `<Outlet />`.

In simple terms:

- Public pages like `/`, `/login`, and `/register` render directly.
- Dashboard pages render inside the shared dashboard shell.

## 4. First-time setup after pulling from Git

Use these steps when running the project on a machine for the first time.

### Prerequisites

- Install Node.js LTS
- Install Git
- Use a terminal such as PowerShell

### Setup steps

```powershell
git clone <your-repository-url>
cd "PSU Project Website (1)"
npm install
npm run dev
```

What each command does:

- `git clone` downloads the project
- `cd` moves into the project folder
- `npm install` installs dependencies from `package.json`
- `npm run dev` starts the Vite development server

After `npm run dev`, open the local URL shown in the terminal. It is usually:

```text
http://localhost:5173
```

### Production build check

To make sure the app builds correctly:

```powershell
npm run build
```

This creates the production output in the `dist/` folder.

## 5. Common day-to-day commands

```powershell
npm install
npm run dev
npm run build
```

- `npm install`: install or update dependencies
- `npm run dev`: run the app locally
- `npm run build`: create a production build

## 6. How React is used in this project

This codebase mainly uses function components.

Example pattern:

```tsx
export function Dashboard() {
  return <div>Dashboard page</div>;
}
```

The main React ideas used here are:

- Components: each screen or UI block is a component
- Props: values passed into a component
- State: values that change while the page is in use
- Hooks: functions like `useState`, `useNavigate`, and `useLocation`
- Routing: React Router switches pages without reloading the browser

### Common hooks used here

- `useState`: local component state
- `useNavigate`: send the user to another route
- `useLocation`: check the current URL to highlight the active menu item

Example:

```tsx
const navigate = useNavigate();

const handleLogout = () => {
  navigate("/login");
};
```

## 7. How routing works in this project

All routes live in `src/app/routes.tsx`.

Current pattern:

```tsx
export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLanding,
  },
  {
    path: "/dashboard",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "power-generation", Component: PowerGeneration },
    ],
  },
]);
```

What this means:

- `/` loads `PublicLanding`
- `/dashboard` loads `Layout` and shows `Dashboard` inside it
- `/dashboard/power-generation` loads `Layout` and shows `PowerGeneration` inside it

### Important rule

If a page must use the dashboard menu and shared header/footer, it should be a child of the `/dashboard` route.

## 8. How to add a new dashboard page

Example: add a new page called `Reports`.

### Step 1: Create the screen file

Create a new file:

```text
src/app/screens/Reports.tsx
```

Example content:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function Reports() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
      <Card>
        <CardHeader>
          <CardTitle>Reports Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Add your reports content here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 2: Import it into routes

In `src/app/routes.tsx` add:

```tsx
import { Reports } from "./screens/Reports";
```

### Step 3: Add the route

Inside the `/dashboard` children array add:

```tsx
{ path: "reports", Component: Reports },
```

The page URL will then be:

```text
/dashboard/reports
```

### Step 4: Add it to the menu

In `src/app/components/Layout.tsx`, add a new entry to `navItems`.

Example:

```tsx
{ path: "/dashboard/reports", label: "Reports", icon: BarChart3 },
```

Also import the icon you want from `lucide-react`.

## 9. How to add a new public page

Public pages are pages that do not use the dashboard layout.

Example: add an `About` page.

### Step 1: Create the file

```text
src/app/screens/About.tsx
```

### Step 2: Import it into `routes.tsx`

```tsx
import { About } from "./screens/About";
```

### Step 3: Add the route at the top level

```tsx
{
  path: "/about",
  Component: About,
},
```

This page will render without the dashboard layout unless you place it under `/dashboard`.

## 10. How to change menu options

Menu items are controlled in `src/app/components/Layout.tsx`.

This array is the source of truth:

```tsx
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/dashboard/power-generation", label: "Power Generation", icon: Zap },
];
```

To change the menu:

- change `label` to update the text shown in the menu
- change `path` to update where the menu goes
- change `icon` to update the icon
- add a new object to create a new menu item
- remove an object to remove a menu item

### Important rule

If you change a menu item path, make sure the same path exists in `src/app/routes.tsx`.

## 11. How to rename or reroute a page

There are a few common kinds of route changes.

### Change the displayed menu label only

Change the `label` in `Layout.tsx`. No route changes are required.

### Change the URL path

Update both places:

1. the route entry in `src/app/routes.tsx`
2. the matching `path` in `src/app/components/Layout.tsx`

Example:

From:

```tsx
{ path: "power-generation", Component: PowerGeneration }
```

To:

```tsx
{ path: "energy", Component: PowerGeneration }
```

And in `Layout.tsx`:

```tsx
{ path: "/dashboard/energy", label: "Power Generation", icon: Zap }
```

### Programmatically send the user somewhere else

Use `useNavigate`:

```tsx
const navigate = useNavigate();
navigate("/dashboard");
```

This is useful after form submit, login, logout, or button clicks.

### Link to another page from JSX

Use `Link`:

```tsx
<Link to="/dashboard">Go to Dashboard</Link>
```

## 12. How dashboard layout and nested routes work

The dashboard uses nested routes.

`Layout.tsx` contains:

```tsx
<Outlet />
```

That means:

- the header is shared
- the navigation is shared
- the footer is shared
- the active child screen is swapped into the `Outlet`

This is why all dashboard pages should usually be added as children of `/dashboard`.

## 13. How imports work in this project

This project supports the `@` alias for `src` through `vite.config.ts`.

Example alias import:

```tsx
import { Button } from "@/app/components/ui/button";
```

Current files also use relative imports such as:

```tsx
import { Button } from "../components/ui/button";
```

Both styles can work, but be consistent within a file.

## 14. Styling guide for this repo

- Use Tailwind utility classes for most styling
- Use the shared UI components in `src/app/components/ui`
- Use `src/styles/theme.css` and `src/styles/tailwind.css` for global theme behavior
- Prefer reusing existing card, button, badge, input, and form primitives before creating new ones

### Important Tailwind note

This repo uses Tailwind CSS v4. Some CSS diagnostics in VS Code may show warnings in `tailwind.css` and `theme.css` because the editor treats Tailwind directives as plain CSS. If `npm run build` succeeds, the Tailwind setup is still working.

## 15. Recommended process when adding a new page

Use this checklist:

1. Create the new screen in `src/app/screens/`
2. Import it in `src/app/routes.tsx`
3. Add the route
4. If it is a dashboard page, add a matching menu item in `src/app/components/Layout.tsx`
5. Run `npm run dev` and test the page manually
6. Run `npm run build` to confirm the app still compiles

## 16. Troubleshooting

### The app does not start after pulling from Git

Try:

```powershell
npm install
npm run dev
```

Make sure you are inside the project folder before running commands.

### A page exists but does not show in the dashboard menu

The route may exist, but the `navItems` array in `src/app/components/Layout.tsx` was not updated.

### A menu link shows but opens a blank or wrong page

The `path` in `Layout.tsx` and the `path` in `routes.tsx` likely do not match.

### Imports break after moving files

When moving screen files, update relative imports like:

```tsx
../components/ui/button
```

You can also switch to the `@` alias to make imports easier to maintain.

### Tailwind CSS shows editor errors

This can be a false warning from the CSS language service. Use `npm run build` as the real check.

## 17. Quick reference

### Add a dashboard page

1. Create a component in `src/app/screens/`
2. Import it in `src/app/routes.tsx`
3. Add it as a child under `/dashboard`
4. Add a matching item to `navItems` in `src/app/components/Layout.tsx`

### Add a public page

1. Create a component in `src/app/screens/`
2. Import it in `src/app/routes.tsx`
3. Add it as a top-level route

### Change a menu option

1. Open `src/app/components/Layout.tsx`
2. Edit the `navItems` array
3. Make sure the path exists in `src/app/routes.tsx`

### Get the app running from Git

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. Open the local Vite URL
5. Run `npm run build` before committing major changes