# CampusCare - Campus Complaint & Issue Management System

Spring Boot 3.2 (Java 17) + Spring Security + Spring Data JPA + MySQL, with a plain HTML/CSS/JavaScript
frontend (Fetch API) served by the same application from `src/main/resources/static/`.

## 1. Prerequisites
| Tool | Version |
|------|---------|
| JDK | 17 |
| Maven | 3.9+ (`mvn -v`) |
| MySQL | 8.x running on `localhost:3306` |
| VS Code | with *Extension Pack for Java* and *Spring Boot Extension Pack* |

## 2. Project structure
```
campuscare/
  pom.xml
  docs/setup.sql
  src/main/java/com/example/campuscare/
    CampusCareApplication.java
    config/       DataInitializer (departments + first admin)
    controller/   AuthController, ComplaintController, AdminComplaintController, FileController
    dto/          request/response records
    entity/       User, Department, Complaint, ComplaintUpdate, Role, Category, ComplaintStatus
    exception/    ApiException, GlobalExceptionHandler
    repository/   UserRepository, DepartmentRepository, ComplaintRepository, ComplaintUpdateRepository
    security/     SecurityConfig, CustomUserDetailsService
    service/      AuthService, ComplaintService, AdminComplaintService, ComplaintMapper, FileStorageService
  src/main/resources/
    application.properties
    static/       index, login, register, student-dashboard, raise-complaint, my-complaints,
                  complaint-details, profile, admin-dashboard, admin-complaints (.html)
                  css/style.css   js/api.js auth.js student.js complaints.js admin.js
```

## 3. Configure MySQL
1. Make sure MySQL is running.
2. Nothing else is required: the app creates the `campuscare` database (`createDatabaseIfNotExist=true`)
   and Hibernate creates/updates the four tables (`users`, `departments`, `complaints`, `complaint_updates`).
3. Optionally prepare things by hand with `docs/setup.sql` (also shows how to create a dedicated DB user).
4. Tell the app your MySQL credentials with environment variables (no secrets live in the code):

| Variable | Meaning | Default |
|----------|---------|---------|
| `DB_USERNAME` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | *(empty)* |
| `ADMIN_EMAIL` | email of the first administrator | *(none)* |
| `ADMIN_PASSWORD` | its password, min 8 chars | *(none)* |
| `ADMIN_NAME` | its display name | `CampusCare Admin` |
| `COLLEGE_EMAIL_DOMAIN` | optional, e.g. `college.edu` restricts student sign-ups | *(any email)* |
| `UPLOAD_DIR` | where complaint photos are stored | `uploads` |

## 4. Run in VS Code
Open the `campuscare` folder in VS Code, then in the integrated terminal:

**Windows PowerShell**
```powershell
$env:DB_USERNAME="root"; $env:DB_PASSWORD="your-mysql-password"
$env:ADMIN_EMAIL="admin@college.edu"; $env:ADMIN_PASSWORD="Admin@12345"
mvn spring-boot:run
```
**Windows CMD**
```bat
set DB_PASSWORD=your-mysql-password
set ADMIN_EMAIL=admin@college.edu
set ADMIN_PASSWORD=Admin@12345
mvn spring-boot:run
```
**macOS / Linux**
```bash
export DB_PASSWORD='your-mysql-password' ADMIN_EMAIL='admin@college.edu' ADMIN_PASSWORD='Admin@12345'
mvn spring-boot:run
```
(You can also press the Run button above `CampusCareApplication.main` after setting the variables in a
`.vscode/launch.json` `env` block.)

Open **http://localhost:8080**.

### First administrator
There is no public way to create an admin. On startup, if **no ADMIN exists** and `ADMIN_EMAIL` +
`ADMIN_PASSWORD` are set, that admin is created (BCrypt-hashed). Once it exists the variables are ignored.
Students who register through the website are always `STUDENT`; the role is never read from the request.

## 5. Test the whole application in a browser
1. Open `http://localhost:8080` -> **Get Started** -> register a student (password needs 8+ chars with a letter and a number).
2. Log in -> you land on the **Student Dashboard** (all counts are 0).
3. **Raise Complaint**: fill the form, choose a JPEG/PNG/WebP photo (preview appears), submit -> success message with the ID.
4. **My Complaints**: search, status/category filters, **View Details** shows the history timeline (starts as *Pending*).
5. Log out. Log in with the admin account -> **Admin Dashboard** (cards + three charts).
6. **Pending Complaints** -> *Assign* -> pick a department -> status becomes *Assigned*.
7. **Update Status** -> *Update* -> *In Progress* -> *Resolved* (add remarks). A resolved complaint shows no further actions.
   Rejecting requires a remark.
8. Log in as the student again: the status, department and latest remark are updated, and the timeline lists every change.
9. Security checks: while logged in as a student open `http://localhost:8080/admin-dashboard.html` (you are sent away) and
   `http://localhost:8080/admin/dashboard` (403). A second student cannot open the first student's `/complaints/{id}` (404).

## 6. REST API
All responses are JSON. Errors look like `{"status":400,"message":"...","fieldErrors":{"field":"..."},"timestamp":"..."}`.

| Method | Path | Role | Notes |
|--------|------|------|-------|
| POST | `/auth/signup` | public | JSON `{name,email,password,confirmPassword}` -> 201 |
| POST | `/auth/login` | public | JSON `{email,password}`; starts a session |
| POST | `/auth/logout` | logged in | ends the session |
| GET | `/auth/me` | logged in | current user |
| POST | `/complaints` | STUDENT | `multipart/form-data`: title, category, description, location, image? |
| GET | `/complaints/my` | STUDENT | own complaints |
| GET | `/complaints/stats` | STUDENT | counts for the dashboard |
| GET | `/complaints/{id}` | STUDENT | own complaint + history (404 for other people's) |
| GET | `/admin/complaints?q=&status=&category=&departmentId=` | ADMIN | search / filter |
| GET | `/admin/complaints/{id}` | ADMIN | details + history |
| PUT | `/admin/complaints/{id}/assign` | ADMIN | `{departmentId, remark?}` -> status ASSIGNED |
| PUT | `/admin/complaints/{id}/status` | ADMIN | `{status, remark?}` (validated transitions) |
| GET | `/admin/dashboard` | ADMIN | totals + by status/category/department |
| GET | `/admin/departments` | ADMIN | department list |
| GET | `/admin/updates` | ADMIN | last 50 status changes |
| GET | `/files/{name}` | owner or ADMIN | uploaded photo |

Allowed transitions: `PENDING -> ASSIGNED | REJECTED`, `ASSIGNED -> IN_PROGRESS | REJECTED`,
`IN_PROGRESS -> RESOLVED | REJECTED`. `RESOLVED` and `REJECTED` are final. `ASSIGNED` is reached only through the assign endpoint.

## 7. Test the API with Postman
Authentication is a **session cookie** and state-changing requests need a **CSRF header**, so Postman needs two small steps.

1. **Get a CSRF cookie:** send `GET http://localhost:8080/` once. Postman stores the `XSRF-TOKEN` cookie.
2. **Add the header automatically:** in your Collection -> *Pre-request Script*:
   ```js
   const t = pm.cookies.get('XSRF-TOKEN');
   if (t) pm.request.headers.upsert({ key: 'X-XSRF-TOKEN', value: t });
   ```
3. **Register:** `POST /auth/signup`, body *raw / JSON*:
   `{"name":"Test Student","email":"student@college.edu","password":"Pass1234","confirmPassword":"Pass1234"}` (201).
   (`/auth/signup` and `/auth/login` are exempt from CSRF; everything else requires the header.)
4. **Login:** `POST /auth/login` `{"email":"student@college.edu","password":"Pass1234"}`. Postman keeps the `JSESSIONID` cookie.
5. **Create complaint:** `POST /complaints`, body *form-data*: `title`, `category` (CLASSROOM/HOSTEL/LABORATORY/FACILITIES),
   `description`, `location`, and optionally `image` (type *File*).
6. `GET /complaints/my`, `GET /complaints/1`.
7. Verify authorization: `GET /admin/dashboard` as a student -> **403**; without logging in -> **401**.
8. **Admin flow:** log in as the admin (same `POST /auth/login`), then
   `GET /admin/complaints`, `PUT /admin/complaints/1/assign` `{"departmentId":1,"remark":"Please inspect"}`,
   `PUT /admin/complaints/1/status` `{"status":"IN_PROGRESS","remark":"Technician on site"}`,
   `PUT /admin/complaints/1/status` `{"status":"RESOLVED","remark":"Fixed"}`, and then try
   `{"status":"IN_PROGRESS"}` again -> **409** (a resolved complaint cannot be reopened).

## 8. Security summary
- Passwords are stored only as BCrypt hashes; DTOs never expose them.
- Session login (HttpOnly `JSESSIONID`, SameSite=Lax, session id rotated on login) with CSRF protection (cookie + `X-XSRF-TOKEN`).
- Roles enforced on the server in `SecurityConfig` (`/admin/**` -> ADMIN, `/complaints/**` -> STUDENT); dashboard HTML pages are also role-protected.
- Complaint owner always comes from the session, never from the request; other students' complaints return 404.
- Uploads: max 5 MB, JPEG/PNG/WebP only, verified by magic bytes, stored under random UUID names, served only to the owner or an admin.
- Content-Security-Policy blocks inline scripts; all JavaScript lives in `static/js`.
- Optional `COLLEGE_EMAIL_DOMAIN` restricts registration to your college email domain.

## 9. Troubleshooting
| Problem | Fix |
|---------|-----|
| `Access denied for user 'root'` | set `DB_USERNAME` / `DB_PASSWORD` |
| `Communications link failure` | MySQL is not running or not on port 3306 |
| Log says "No ADMIN account exists" | set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, restart |
| `Port 8080 already in use` | `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081` |
| 403 on a POST/PUT from Postman | add the `X-XSRF-TOKEN` header (step 2 above) |
| Fonts look different offline | Google Fonts need internet; the UI falls back to system fonts |

The footer contact details on the landing page (`index.html`) are sample values; edit them for your college.
