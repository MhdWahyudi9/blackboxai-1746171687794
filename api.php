<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($method === 'OPTIONS') {
    // CORS preflight
    http_response_code(200);
    exit;
}

switch ($action) {
    case 'login':
        if ($method !== 'POST') {
            respond(['error' => 'Method not allowed'], 405);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $username = $conn->real_escape_string($input['username'] ?? '');
        $password = $input['password'] ?? '';

        if (!$username || !$password) {
            respond(['error' => 'Username and password required'], 400);
        }

        $sql = "SELECT u.id, u.username, u.password, u.full_name, r.role_name, u.parent_of_student_id
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.username = '$username' LIMIT 1";
        $result = $conn->query($sql);

        if ($result && $result->num_rows === 1) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                // Successful login
                respond([
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role_name'],
                    'parent_of_student_id' => $user['parent_of_student_id']
                ]);
            } else {
                respond(['error' => 'Invalid credentials'], 401);
            }
        } else {
            respond(['error' => 'Invalid credentials'], 401);
        }
        break;

    case 'getStudentData':
        if ($method !== 'GET') {
            respond(['error' => 'Method not allowed'], 405);
        }
        $userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;
        $role = isset($_GET['role']) ? $_GET['role'] : '';

        if (!$userId || !$role) {
            respond(['error' => 'Missing parameters'], 400);
        }

        if ($role === 'parent') {
            // Get student data for parent's child
            $sql = "SELECT parent_of_student_id FROM users WHERE id = $userId LIMIT 1";
            $res = $conn->query($sql);
            if ($res && $res->num_rows === 1) {
                $row = $res->fetch_assoc();
                $studentId = $row['parent_of_student_id'];
                if (!$studentId) {
                    respond(['error' => 'No student linked to this parent'], 404);
                }
            } else {
                respond(['error' => 'User not found'], 404);
            }
        } else if ($role === 'teacher' || $role === 'admin') {
            // For simplicity, allow teacher/admin to specify studentId param
            $studentId = isset($_GET['studentId']) ? intval($_GET['studentId']) : 0;
            if (!$studentId) {
                respond(['error' => 'studentId parameter required'], 400);
            }
        } else {
            respond(['error' => 'Invalid role'], 400);
        }

        // Get student info
        $sqlStudent = "SELECT s.id, s.full_name, c.class_name
                       FROM students s
                       JOIN classes c ON s.class_id = c.id
                       WHERE s.id = $studentId LIMIT 1";
        $resStudent = $conn->query($sqlStudent);
        if (!$resStudent || $resStudent->num_rows === 0) {
            respond(['error' => 'Student not found'], 404);
        }
        $student = $resStudent->fetch_assoc();

        // Get grades
        $sqlGrades = "SELECT subject, grade, date_recorded FROM grades WHERE student_id = $studentId";
        $resGrades = $conn->query($sqlGrades);
        $grades = [];
        if ($resGrades) {
            while ($row = $resGrades->fetch_assoc()) {
                $grades[] = $row;
            }
        }

        // Get attendance
        $sqlAttendance = "SELECT date, status FROM attendance WHERE student_id = $studentId ORDER BY date DESC LIMIT 30";
        $resAttendance = $conn->query($sqlAttendance);
        $attendance = [];
        if ($resAttendance) {
            while ($row = $resAttendance->fetch_assoc()) {
                $attendance[] = $row;
            }
        }

        // Get assignments for student's class
        $sqlAssignments = "SELECT a.id, a.title, a.description, a.due_date
                           FROM assignments a
                           JOIN students s ON s.class_id = a.class_id
                           WHERE s.id = $studentId
                           ORDER BY a.due_date DESC";
        $resAssignments = $conn->query($sqlAssignments);
        $assignments = [];
        if ($resAssignments) {
            while ($row = $resAssignments->fetch_assoc()) {
                $assignments[] = $row;
            }
        }

        respond([
            'student' => $student,
            'grades' => $grades,
            'attendance' => $attendance,
            'assignments' => $assignments
        ]);
        break;

    case 'inputGrade':
        if ($method !== 'POST') {
            respond(['error' => 'Method not allowed'], 405);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $teacherId = $input['teacherId'] ?? 0;
        $studentId = $input['studentId'] ?? 0;
        $subject = $conn->real_escape_string($input['subject'] ?? '');
        $grade = floatval($input['grade'] ?? 0);
        $dateRecorded = $input['dateRecorded'] ?? date('Y-m-d');

        if (!$teacherId || !$studentId || !$subject || !$grade) {
            respond(['error' => 'Missing parameters'], 400);
        }

        // TODO: Check if teacher has permission to input grade for this student

        $sql = "INSERT INTO grades (student_id, subject, grade, date_recorded) VALUES ($studentId, '$subject', $grade, '$dateRecorded')";
        if ($conn->query($sql) === TRUE) {
            respond(['success' => true]);
        } else {
            respond(['error' => 'Failed to insert grade'], 500);
        }
        break;

    case 'inputAttendance':
        if ($method !== 'POST') {
            respond(['error' => 'Method not allowed'], 405);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $teacherId = $input['teacherId'] ?? 0;
        $studentId = $input['studentId'] ?? 0;
        $date = $input['date'] ?? date('Y-m-d');
        $status = $conn->real_escape_string($input['status'] ?? '');

        if (!$teacherId || !$studentId || !$status) {
            respond(['error' => 'Missing parameters'], 400);
        }

        // TODO: Check if teacher has permission to input attendance for this student

        $sql = "INSERT INTO attendance (student_id, date, status) VALUES ($studentId, '$date', '$status')";
        if ($conn->query($sql) === TRUE) {
            respond(['success' => true]);
        } else {
            respond(['error' => 'Failed to insert attendance'], 500);
        }
        break;

    case 'addUser':
        if ($method !== 'POST') {
            respond(['error' => 'Method not allowed'], 405);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $username = $conn->real_escape_string($input['username'] ?? '');
        $password = $input['password'] ?? '';
        $fullName = $conn->real_escape_string($input['fullName'] ?? '');
        $role = $conn->real_escape_string($input['role'] ?? '');
        $parentOfStudentId = isset($input['parentOfStudentId']) ? intval($input['parentOfStudentId']) : null;

        if (!$username || !$password || !$fullName || !$role) {
            respond(['error' => 'Missing parameters'], 400);
        }

        // Get role id
        $sqlRole = "SELECT id FROM roles WHERE role_name = '$role' LIMIT 1";
        $resRole = $conn->query($sqlRole);
        if (!$resRole || $resRole->num_rows === 0) {
            respond(['error' => 'Invalid role'], 400);
        }
        $roleRow = $resRole->fetch_assoc();
        $roleId = $roleRow['id'];

        // Hash password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $parentOfStudentIdSql = $parentOfStudentId ? $parentOfStudentId : 'NULL';

        $sql = "INSERT INTO users (username, password, full_name, role_id, parent_of_student_id) VALUES ('$username', '$passwordHash', '$fullName', $roleId, $parentOfStudentIdSql)";
        if ($conn->query($sql) === TRUE) {
            respond(['success' => true]);
        } else {
            respond(['error' => 'Failed to add user'], 500);
        }
        break;

    case 'addStudent':
        if ($method !== 'POST') {
            respond(['error' => 'Method not allowed'], 405);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $fullName = $conn->real_escape_string($input['fullName'] ?? '');
        $classId = intval($input['classId'] ?? 0);

        if (!$fullName || !$classId) {
            respond(['error' => 'Missing parameters'], 400);
        }

        $sql = "INSERT INTO students (full_name, class_id) VALUES ('$fullName', $classId)";
        if ($conn->query($sql) === TRUE) {
            respond(['success' => true]);
        } else {
            respond(['error' => 'Failed to add student'], 500);
        }
        break;

    case 'addClass':
        if ($method !== 'POST') {
            respond(['error' => 'Method not allowed'], 405);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $className = $conn->real_escape_string($input['className'] ?? '');

        if (!$className) {
            respond(['error' => 'Missing parameters'], 400);
        }

        $sql = "INSERT INTO classes (class_name) VALUES ('$className')";
        if ($conn->query($sql) === TRUE) {
            respond(['success' => true]);
        } else {
            respond(['error' => 'Failed to add class'], 500);
        }
        break;

    case 'getNotifications':
        if ($method !== 'GET') {
            respond(['error' => 'Method not allowed'], 405);
        }
        $userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;
        if (!$userId) {
            respond(['error' => 'Missing userId parameter'], 400);
        }

        $sql = "SELECT id, message, is_read, created_at FROM notifications WHERE user_id = $userId ORDER BY created_at DESC";
        $res = $conn->query($sql);
        $notifications = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $notifications[] = $row;
            }
        }
        respond(['notifications' => $notifications]);
        break;

    default:
        respond(['error' => 'Invalid action'], 400);
        break;
}

$conn->close();
?>
