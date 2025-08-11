# Sales Dashboard

This project provides a cloud‑hosted sales calendar similar to the one you mocked up.  It is built with Next.js, Tailwind CSS and Supabase.  Once deployed, it automatically persists your daily revenue data (and optionally last year’s daily values) to a PostgreSQL database managed by Supabase.  It also calculates month‑to‑date (MTD) totals and projects the rest of the month based on your actual performance.

## Features

- **MTD Actual & Projected totals.**  Shows the current month‑to‑date revenue and the projected total for the month based on your average so far.
- **Interactive calendar.**  A Monday‑start calendar layout lets you click any day to enter the current year’s revenue and last year’s revenue.  The calendar automatically shows arrows indicating whether you are up or down versus last year.
- **Weekly totals.**  A running total appears on the right of each week.
- **Supabase integration.**  Data is saved and loaded securely via Supabase.  Each user sees only their own data thanks to row level security.
- **Authentication via magic link.**  Users sign in with their email; Supabase sends them a magic link.  No passwords to remember.
- **Optional multi‑location support.**  If you operate multiple stores or locations, add a location field when inserting data.  The column is created in the database, but left blank by default.

## Setup

1. **Create a Supabase project.**  Go to [https://supabase.com](https://supabase.com) and create a free project.  From the project’s dashboard:
   - Navigate to **SQL Editor** → **New query** and run the following to create a table for sales data:

     ```sql
     create table if not exists sales_daily (
       id uuid primary key default gen_random_uuid(),
       user_id uuid references auth.users(id),
       year integer not null,
       month integer not null,
       day integer not null,
       value integer,      -- current year's sales for the day
       ly_value integer,   -- last year's sales for the same day
       location text,      -- optional store/location identifier
       inserted_at timestamptz default now(),
       updated_at timestamptz default now()
     );

     -- Row level security policies
     alter table sales_daily enable row level security;
     create policy "Users can manage their own records" on sales_daily
       for all
       using (auth.uid() = user_id)
       with check (auth.uid() = user_id);
     ```

   - In **Authentication** → **Settings**, enable **Magic Link** authentication and configure your email provider (Supabase will guide you).  This app uses magic link auth by default.
   - In **API** settings, copy your **Project URL** and **Anon Public Key**.  You will need these values in the next step.

2. **Clone and install the project.**  On your computer run:

   ```bash
   git clone <this repository url>
   cd sales-dashboard
   npm install
   ```

3. **Configure environment variables.**  Duplicate `.env.local.example` as `.env.local` and fill in your Supabase keys:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server.**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.  You should see the login screen.  Enter your email to receive a magic link.  After logging in, you can start entering sales data.

5. **Deploy to Vercel.**  Push this project to a Git provider (e.g. GitHub).  Then go to [https://vercel.com](https://vercel.com) and import your repository.  Set the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project settings.  Choose the default build command (`npm run build`) and output directory (`.next`).  Vercel will handle the rest.  Each time you push to your repository, Vercel redeploys automatically.

## Customising

- **Multi‑location support.**  The `location` column is included in the table.  If you want to differentiate sales by location, uncomment the location field in the `upsertSale` call inside `components/SalesDashboard.js` and provide a `location` string when saving data.  You can also add a dropdown or selector in the UI to choose a location.
- **Projection algorithm.**  The projection logic currently takes the greater of your average per completed day and a static default (the default is `1000`).  Edit `DEFAULT_DAILY_TARGET` in `SalesDashboard.js` to adjust this value or implement your own projection (for example, trailing 7‑day average).
- **Styling.**  All styling is handled via Tailwind CSS.  Adjust classes in the components to change the look and feel.  Tailwind configuration lives in `tailwind.config.js`.

## Questions?

If you hit any issues deploying or extending the dashboard, open a discussion on the repository or email your favourite developer friend.  Enjoy!
