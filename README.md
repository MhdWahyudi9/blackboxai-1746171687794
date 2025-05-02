
Built by https://www.blackbox.ai

---

```markdown
# SDN 1 Bangunharjo Academic Progress Monitoring

## Project Overview
The SDN 1 Bangunharjo Academic Progress Monitoring is a web application designed to facilitate the management and tracking of student academic progress and attendance. The system allows users (parents, teachers, and administrators) to log in and view relevant student data, including grades, attendance records, and assignments. Teachers can also input grades and attendance records, while parents can view information related to their children.

## Installation
To install and run this project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd project-directory
   ```

2. **Set up the database:**
   - Create a MySQL database named `sdn1_bangunharjo`.
   - Import the necessary database schemas and data (Ensure you have the corresponding SQL scripts).

3. **Configure database settings:**
   - Open `db.php` and set the appropriate database configuration values for your MySQL server:
     ```php
     $host = 'localhost';
     $dbname = 'sdn1_bangunharjo';
     $user = 'root'; // change if needed
     $password = '';  // change if needed
     ```

4. **Start a local server:**
   - Use a local server setup like XAMPP, WAMP, or use PHP's built-in server:
     ```bash
     php -S localhost:8000
     ```

5. **Access the application:**
   - Open a web browser and navigate to `http://localhost:8000/login.html`.

## Usage
1. On the login page (`login.html`), enter your username and password, then click the "Login" button.
2. Depending on your role (parent, teacher, or admin), you will be directed to the dashboard with access to various functions:
   - View student grades, assignments, and attendance.
   - Input grades and attendance (available for teachers and admin).
3. Logout using the logout button available on the dashboard.

## Features
- User authentication via username and password.
- Dynamic dashboard displaying student-related information.
- Role-based access to features:
  - Parents can view their child's information.
  - Teachers and administrators can input grades and attendance.
- API endpoint for fetching and updating data using JSON.

## Dependencies
This project is primarily based on PHP for backend operations. The frontend does not have an explicit dependencies JSON file but uses the following resources:
- **Tailwind CSS** for styling.
- **Font Awesome** for icons.
- **jQuery** or native JavaScript for DOM manipulation and AJAX requests (via fetch).

Ensure that your environment supports PHP and a MySQL database.

## Project Structure
```plaintext
.
├── api.php                  # API endpoints for handling data requests and responses
├── db.php                   # Database connection settings
├── login.html               # Login page for user authentication
├── dashboard.html           # Dashboard page for displaying user-specific data
├── style.css                # Custom styles for the application
└── script.js                # Frontend JavaScript for handling user interactions
```

## License
Feel free to use and modify this project as per your requirements. If you intend to use it commercially, please consider appropriate licensing.
```