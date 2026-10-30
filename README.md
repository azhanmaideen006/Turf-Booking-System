# 🏟️ Turf Booking System

A full-stack web application that allows customers to explore sports turfs, check available facilities, and book their preferred time slots online.

## 🚀 Features

### 👤 Customer
- Customer Registration and Login
- Browse available turfs
- Search turfs by name and location
- Filter turfs by sports
- View turf details, facilities, and pricing
- Support for multiple sports per turf (Football, Cricket, Badminton, Basketball)
- Check booking slot availability
- Book turf time slots
- View booking history
- Cancel bookings

### 🔐 Admin
- Admin Login
- Admin Dashboard
- Add, Edit, and Delete Turfs
- Upload Turf Images
- Manage Turf Details and Facilities
- Support multiple sports for a single turf
- Create and Delete Admin Accounts

## 🛠️ Technologies Used

**Frontend**
- React.js
- JavaScript
- HTML5
- CSS3
- Axios
- React Router
- Lucide React

**Backend**
- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- Maven

**Database**
- MySQL

**Tools**
- Git
- GitHub
- VS Code
- MySQL Workbench
- Postman

## 📂 Project Structure

```text
Turf-Booking-System/
│
├── backend/
│   └── turfbooking/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/
│       │   │   └── resources/
│       │   └── test/
│       ├── uploads/
│       └── pom.xml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
│
└── .gitignore
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/azhanmaideen006/Turf-Booking-System.git
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd Turf-Booking-System/backend/turfbooking
```

Create a MySQL database:

```sql
CREATE DATABASE turf_booking_db;
```

Configure your database and admin credentials using environment variables.

Required environment variables:

```text
DB_USERNAME
DB_PASSWORD
ADMIN_EMAIL
ADMIN_PASSWORD
```

Run the Spring Boot application:

```bash
.\mvnw.cmd spring-boot:run
```

Backend runs at:

```text
http://localhost:8080
```

### 3. Frontend Setup

Open another terminal:

```bash
cd Turf-Booking-System/frontend
```

Install dependencies:

```bash
npm install
```

Start the React application:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## 🗄️ Database

MySQL is used to store:
- Customer details
- Turf information
- Booking information

## 🔑 Key Functionality

- Multiple sports can be assigned to a single turf.
- Customers can filter turfs based on available sports.
- Customers can check booked slots before making a reservation.
- Admins can manage turf information through the dashboard.

## 👨‍💻 Developer

**Azhan Maideen**

GitHub: [@azhanmaideen006](https://github.com/azhanmaideen006)

## 📌 Future Improvements

- Online Payment Integration
- Email Notifications
- Advanced Booking Management
- Customer Reviews and Ratings
- Deployment to Cloud Hosting

---

⭐ If you like this project, consider giving it a star!