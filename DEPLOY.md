# Deploy CampusCare on Render (no database setup)

The app uses an embedded database, so Render needs only one Web Service.
1. Upload the project files to GitHub (pom.xml and Dockerfile at the top level).
2. Render -> New -> Web Service -> select the repo. Name: campuscare. Language: Docker. Plan: Free.
3. Environment variables:  ADMIN_EMAIL = admin@college.edu,  ADMIN_PASSWORD = (your password),  COOKIE_SECURE = true
4. Create Web Service. When it says Live, open https://campuscare.onrender.com (or the link Render shows).
Note: on the free plan the data and uploaded photos reset whenever Render restarts or redeploys the service.
