CREATE TABLE streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  admission_number VARCHAR(50) NOT NULL UNIQUE,
  stream_id INT NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10),
  FOREIGN KEY (stream_id) REFERENCES streams(id)
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE stream_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stream_id INT NOT NULL,
  subject_id INT NOT NULL,
  FOREIGN KEY (stream_id) REFERENCES streams(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE KEY unique_stream_subject (stream_id, subject_id)
);

CREATE TABLE scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  cat_score DECIMAL(5,2) NOT NULL,
  exam_score DECIMAL(5,2) NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE KEY unique_student_subject (student_id, subject_id)
);

CREATE TABLE grade_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  min_score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,
  grade VARCHAR(5) NOT NULL,
  remarks VARCHAR(255)
);

INSERT INTO grade_config (min_score, max_score, grade, remarks) VALUES
  (80, 100, 'A', 'Excellent'),
  (65, 79.99, 'B', 'Good'),
  (50, 64.99, 'C', 'Average'),
  (40, 49.99, 'D', 'Below Average'),
  (0, 39.99, 'E', 'Fail');

