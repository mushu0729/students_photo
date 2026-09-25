# Student Photo Collection (10th A / B / C)

Next.js + MongoDB app to collect student photos section-wise, compress each
to ~50KB, and download everything as a zip (`10th/A`, `10th/B`, `10th/C`).

## 1. MongoDB Atlas (free)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free (M0) cluster.
3. Under **Database Access**, create a user with a password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) so Vercel can connect.
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`

## 2. Push this project to GitHub

1. Create a new empty repo on GitHub.
2. From this folder, run:
   ```
   git init
   git add .
   git commit -m "Student photo collection app"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## 3. Deploy on Vercel (free)

1. Go to https://vercel.com, sign in with GitHub, click **New Project**, import this repo.
2. Under **Environment Variables**, add:
   - `MONGODB_URI` = the connection string from step 1 (add your db user password into it)
   - `MONGODB_DB` = `student_photos`
3. Click **Deploy**. You'll get a live `https://your-app.vercel.app` link.

## Using it

- Open the link on any device (phone camera works best for capturing photos).
- Pick a tab (10th A / B / C), paste student names, click **Add to list**.
- Tap **Add photo** next to a name to open the camera — it auto-compresses to ~50KB and saves.
- Once done, tap **Download all photos (.zip)** — you'll get `10th/A`, `10th/B`, `10th/C` folders inside, each with `StudentName.jpg` files.
- **Clear all** wipes the list and photos from the database.

## Notes

- Storage: 300 students × ~50KB ≈ 15MB — well within MongoDB Atlas's free 512MB.
- Hosting: Vercel's free Hobby plan easily covers a single school's usage.
- Photos are stored as base64 inside MongoDB documents — simplest option at this scale, no extra file storage service needed.
