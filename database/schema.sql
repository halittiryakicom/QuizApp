-- ==========================================
-- QUIZ APP - MSSQL DATABASE SCHEMA
-- ==========================================

-- Eğer veritabanı varsa sil (Dikkatli kullanın!)
-- DROP DATABASE IF EXISTS QuizAppDB;
-- GO

-- Veritabanını oluştur
-- CREATE DATABASE QuizAppDB;
-- GO

-- USE QuizAppDB;
-- GO

-- ==========================================
-- 1. USERS (Kullanıcılar) Tablosu
-- ==========================================
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL, -- bcrypt hash
    role NVARCHAR(20) NOT NULL DEFAULT 'student', -- 'student', 'teacher', 'admin'
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_Users_Username ON Users(username);
CREATE INDEX IX_Users_Role ON Users(role);
GO

-- ==========================================
-- 2. CATEGORIES (Kategoriler) Tablosu
-- ==========================================
IF OBJECT_ID('Categories', 'U') IS NOT NULL DROP TABLE Categories;
GO

CREATE TABLE Categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    icon NVARCHAR(50), -- emoji veya icon class
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Categories_Name ON Categories(name);
GO

-- ==========================================
-- 3. QUESTIONS (Sorular) Tablosu
-- ==========================================
IF OBJECT_ID('Questions', 'U') IS NOT NULL DROP TABLE Questions;
GO

CREATE TABLE Questions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    categoryId INT NOT NULL,
    question NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(20) NOT NULL DEFAULT 'multiple', -- 'multiple', 'truefalse', 'fillblank', 'matching'
    difficulty NVARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    imageUrl NVARCHAR(MAX), -- Soru görseli (base64 veya URL)
    explanation NVARCHAR(MAX), -- Açıklama
    isActive BIT NOT NULL DEFAULT 1,
    createdBy INT, -- User ID
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Questions_Categories FOREIGN KEY (categoryId) REFERENCES Categories(id) ON DELETE CASCADE,
    CONSTRAINT FK_Questions_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_Questions_CategoryId ON Questions(categoryId);
CREATE INDEX IX_Questions_Type ON Questions(type);
CREATE INDEX IX_Questions_Difficulty ON Questions(difficulty);
GO

-- ==========================================
-- 4. QUESTION_OPTIONS (Soru Seçenekleri) Tablosu
-- ==========================================
IF OBJECT_ID('QuestionOptions', 'U') IS NOT NULL DROP TABLE QuestionOptions;
GO

CREATE TABLE QuestionOptions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    questionId INT NOT NULL,
    optionText NVARCHAR(MAX) NOT NULL,
    isCorrect BIT NOT NULL DEFAULT 0,
    orderIndex INT NOT NULL DEFAULT 0, -- Sıralama için
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_QuestionOptions_Questions FOREIGN KEY (questionId) REFERENCES Questions(id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_QuestionOptions_QuestionId ON QuestionOptions(questionId);
GO

-- ==========================================
-- 5. TESTS (Testler) Tablosu
-- ==========================================
IF OBJECT_ID('Tests', 'U') IS NOT NULL DROP TABLE Tests;
GO

CREATE TABLE Tests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    testId NVARCHAR(100) NOT NULL UNIQUE, -- Örn: test_1234567890_abc123
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    categoryId INT,
    timePerQuestion INT NOT NULL DEFAULT 30, -- saniye
    createdBy INT, -- Teacher User ID
    totalPlays INT NOT NULL DEFAULT 0,
    totalStudents INT NOT NULL DEFAULT 0,
    averageScore DECIMAL(5,2) DEFAULT 0.00,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Tests_Categories FOREIGN KEY (categoryId) REFERENCES Categories(id) ON DELETE SET NULL,
    CONSTRAINT FK_Tests_CreatedBy FOREIGN KEY (createdBy) REFERENCES Users(id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_Tests_TestId ON Tests(testId);
CREATE INDEX IX_Tests_CategoryId ON Tests(categoryId);
CREATE INDEX IX_Tests_CreatedBy ON Tests(createdBy);
GO

-- ==========================================
-- 6. TEST_QUESTIONS (Test-Soru İlişkisi) Tablosu
-- ==========================================
IF OBJECT_ID('TestQuestions', 'U') IS NOT NULL DROP TABLE TestQuestions;
GO

CREATE TABLE TestQuestions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    testId INT NOT NULL,
    questionId INT NOT NULL,
    orderIndex INT NOT NULL DEFAULT 0, -- Sorunun testteki sırası
    CONSTRAINT FK_TestQuestions_Tests FOREIGN KEY (testId) REFERENCES Tests(id) ON DELETE CASCADE,
    CONSTRAINT FK_TestQuestions_Questions FOREIGN KEY (questionId) REFERENCES Questions(id) ON DELETE CASCADE,
    CONSTRAINT UQ_TestQuestions UNIQUE (testId, questionId)
);
GO

CREATE INDEX IX_TestQuestions_TestId ON TestQuestions(testId);
CREATE INDEX IX_TestQuestions_QuestionId ON TestQuestions(questionId);
GO

-- ==========================================
-- 7. QUIZ_SESSIONS (Quiz Oturumları) Tablosu
-- ==========================================
IF OBJECT_ID('QuizSessions', 'U') IS NOT NULL DROP TABLE QuizSessions;
GO

CREATE TABLE QuizSessions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    roomCode NVARCHAR(10) NOT NULL UNIQUE,
    testId INT NOT NULL,
    teacherId INT, -- Odayı oluşturan öğretmen (NULL ise anonim)
    teacherName NVARCHAR(100),
    status NVARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'finished'
    currentQuestionIndex INT NOT NULL DEFAULT 0,
    startedAt DATETIME2,
    finishedAt DATETIME2,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_QuizSessions_Tests FOREIGN KEY (testId) REFERENCES Tests(id) ON DELETE CASCADE,
    CONSTRAINT FK_QuizSessions_Teacher FOREIGN KEY (teacherId) REFERENCES Users(id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_QuizSessions_RoomCode ON QuizSessions(roomCode);
CREATE INDEX IX_QuizSessions_TestId ON QuizSessions(testId);
CREATE INDEX IX_QuizSessions_Status ON QuizSessions(status);
GO

-- ==========================================
-- 8. QUIZ_PARTICIPANTS (Quiz Katılımcıları) Tablosu
-- ==========================================
IF OBJECT_ID('QuizParticipants', 'U') IS NOT NULL DROP TABLE QuizParticipants;
GO

CREATE TABLE QuizParticipants (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sessionId INT NOT NULL,
    userId INT, -- Kayıtlı kullanıcı için (NULL ise anonim)
    studentName NVARCHAR(100) NOT NULL,
    socketId NVARCHAR(100), -- Real-time tracking
    score INT NOT NULL DEFAULT 0,
    correctCount INT NOT NULL DEFAULT 0,
    wrongCount INT NOT NULL DEFAULT 0,
    joinedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    finishedAt DATETIME2,
    CONSTRAINT FK_QuizParticipants_Sessions FOREIGN KEY (sessionId) REFERENCES QuizSessions(id) ON DELETE CASCADE,
    CONSTRAINT FK_QuizParticipants_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_QuizParticipants_SessionId ON QuizParticipants(sessionId);
CREATE INDEX IX_QuizParticipants_UserId ON QuizParticipants(userId);
GO

-- ==========================================
-- 9. QUIZ_ANSWERS (Quiz Cevapları) Tablosu
-- ==========================================
IF OBJECT_ID('QuizAnswers', 'U') IS NOT NULL DROP TABLE QuizAnswers;
GO

CREATE TABLE QuizAnswers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    participantId INT NOT NULL,
    questionId INT NOT NULL,
    selectedAnswer NVARCHAR(MAX), -- Verilen cevap
    isCorrect BIT NOT NULL DEFAULT 0,
    answeredAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_QuizAnswers_Participants FOREIGN KEY (participantId) REFERENCES QuizParticipants(id) ON DELETE CASCADE,
    CONSTRAINT FK_QuizAnswers_Questions FOREIGN KEY (questionId) REFERENCES Questions(id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_QuizAnswers_ParticipantId ON QuizAnswers(participantId);
CREATE INDEX IX_QuizAnswers_QuestionId ON QuizAnswers(questionId);
GO

-- ==========================================
-- 10. QUESTION_STATISTICS (Soru İstatistikleri) Tablosu
-- ==========================================
IF OBJECT_ID('QuestionStatistics', 'U') IS NOT NULL DROP TABLE QuestionStatistics;
GO

CREATE TABLE QuestionStatistics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    questionId INT NOT NULL,
    userId INT, -- NULL ise tüm kullanıcılar için genel istatistik
    attemptCount INT NOT NULL DEFAULT 0,
    correctCount INT NOT NULL DEFAULT 0,
    wrongCount INT NOT NULL DEFAULT 0,
    lastAttemptAt DATETIME2,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_QuestionStats_Questions FOREIGN KEY (questionId) REFERENCES Questions(id) ON DELETE CASCADE,
    CONSTRAINT FK_QuestionStats_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_QuestionStats UNIQUE (questionId, userId)
);
GO

CREATE INDEX IX_QuestionStats_QuestionId ON QuestionStatistics(questionId);
CREATE INDEX IX_QuestionStats_UserId ON QuestionStatistics(userId);
GO

-- ==========================================
-- VİEWS (Görünümler)
-- ==========================================

-- Test istatistikleri görünümü
CREATE OR ALTER VIEW vw_TestStatistics AS
SELECT 
    t.id,
    t.testId,
    t.title,
    t.totalPlays,
    t.totalStudents,
    t.averageScore,
    c.name as categoryName,
    u.username as createdByName,
    COUNT(DISTINCT tq.questionId) as questionCount,
    t.createdAt
FROM Tests t
LEFT JOIN Categories c ON t.categoryId = c.id
LEFT JOIN Users u ON t.createdBy = u.id
LEFT JOIN TestQuestions tq ON t.id = tq.testId
GROUP BY t.id, t.testId, t.title, t.totalPlays, t.totalStudents, 
         t.averageScore, c.name, u.username, t.createdAt;
GO

-- Kullanıcı performans görünümü
CREATE OR ALTER VIEW vw_UserPerformance AS
SELECT 
    u.id as userId,
    u.username,
    u.email,
    COUNT(DISTINCT qp.sessionId) as totalSessions,
    SUM(qp.score) as totalScore,
    SUM(qp.correctCount) as totalCorrect,
    SUM(qp.wrongCount) as totalWrong,
    CASE 
        WHEN (SUM(qp.correctCount) + SUM(qp.wrongCount)) > 0 
        THEN CAST(SUM(qp.correctCount) * 100.0 / (SUM(qp.correctCount) + SUM(qp.wrongCount)) AS DECIMAL(5,2))
        ELSE 0 
    END as successRate
FROM Users u
LEFT JOIN QuizParticipants qp ON u.id = qp.userId
GROUP BY u.id, u.username, u.email;
GO

-- ==========================================
-- STORED PROCEDURES (Saklı Yordamlar)
-- ==========================================

-- Test istatistiklerini güncelle
CREATE OR ALTER PROCEDURE sp_UpdateTestStatistics
    @testId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Tests
    SET 
        totalPlays = (
            SELECT COUNT(DISTINCT sessionId)
            FROM QuizParticipants qp
            INNER JOIN QuizSessions qs ON qp.sessionId = qs.id
            WHERE qs.testId = @testId
        ),
        totalStudents = (
            SELECT COUNT(DISTINCT CASE WHEN userId IS NOT NULL THEN userId ELSE studentName END)
            FROM QuizParticipants qp
            INNER JOIN QuizSessions qs ON qp.sessionId = qs.id
            WHERE qs.testId = @testId
        ),
        averageScore = (
            SELECT AVG(CAST(qp.score AS DECIMAL(10,2)))
            FROM QuizParticipants qp
            INNER JOIN QuizSessions qs ON qp.sessionId = qs.id
            WHERE qs.testId = @testId AND qp.finishedAt IS NOT NULL
        ),
        updatedAt = GETDATE()
    WHERE id = @testId;
END;
GO

-- Soru istatistiklerini güncelle
CREATE OR ALTER PROCEDURE sp_UpdateQuestionStatistics
    @questionId INT,
    @userId INT = NULL,
    @isCorrect BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM QuestionStatistics WHERE questionId = @questionId AND userId = @userId)
    BEGIN
        UPDATE QuestionStatistics
        SET 
            attemptCount = attemptCount + 1,
            correctCount = correctCount + CASE WHEN @isCorrect = 1 THEN 1 ELSE 0 END,
            wrongCount = wrongCount + CASE WHEN @isCorrect = 0 THEN 1 ELSE 0 END,
            lastAttemptAt = GETDATE(),
            updatedAt = GETDATE()
        WHERE questionId = @questionId AND userId = @userId;
    END
    ELSE
    BEGIN
        INSERT INTO QuestionStatistics (questionId, userId, attemptCount, correctCount, wrongCount, lastAttemptAt)
        VALUES (
            @questionId, 
            @userId, 
            1, 
            CASE WHEN @isCorrect = 1 THEN 1 ELSE 0 END,
            CASE WHEN @isCorrect = 0 THEN 1 ELSE 0 END,
            GETDATE()
        );
    END
END;
GO

-- ==========================================
-- ÖRNEK VERI EKLEME
-- ==========================================

-- Admin kullanıcı ekle (Şifre: admin123)
INSERT INTO Users (username, email, password, role)
VALUES ('admin', 'admin@quizapp.com', '$2b$10$YourHashedPasswordHere', 'admin');
GO

-- Kategoriler ekle
INSERT INTO Categories (name, description, icon)
VALUES 
    ('Genel Kültür', 'Genel kültür soruları', '🌍'),
    ('Bilim', 'Bilim ve teknoloji soruları', '🔬'),
    ('Tarih', 'Tarih soruları', '📜'),
    ('Spor', 'Spor soruları', '⚽'),
    ('Sanat', 'Sanat ve edebiyat soruları', '🎨'),
    ('Coğrafya', 'Coğrafya soruları', '🗺️'),
    ('Matematik', 'Matematik soruları', '🔢'),
    ('C# Programlama', 'C# programlama dili soruları', '💻');
GO

PRINT '✅ Database schema başarıyla oluşturuldu!';
PRINT '📊 Tablolar: Users, Categories, Questions, QuestionOptions, Tests, TestQuestions, QuizSessions, QuizParticipants, QuizAnswers, QuestionStatistics';
PRINT '📈 Views: vw_TestStatistics, vw_UserPerformance';
PRINT '⚙️ Stored Procedures: sp_UpdateTestStatistics, sp_UpdateQuestionStatistics';
GO
