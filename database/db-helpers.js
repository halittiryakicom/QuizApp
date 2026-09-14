const { sql, getPool } = require('../config/database');

// ==========================================
// CATEGORIES (Kategoriler)
// ==========================================

const getAllCategories = async () => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM Categories WHERE isActive = 1 ORDER BY name');
        return result.recordset;
    } catch (error) {
        console.error('Get categories error:', error);
        throw error;
    }
};

const getCategoryById = async (id) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Categories WHERE id = @id');
        return result.recordset[0];
    } catch (error) {
        console.error('Get category error:', error);
        throw error;
    }
};

const createCategory = async (name, description, icon) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('name', sql.NVarChar(100), name)
            .input('description', sql.NVarChar(500), description)
            .input('icon', sql.NVarChar(50), icon)
            .query(`
                INSERT INTO Categories (name, description, icon)
                OUTPUT INSERTED.*
                VALUES (@name, @description, @icon)
            `);
        return result.recordset[0];
    } catch (error) {
        console.error('Create category error:', error);
        throw error;
    }
};

// ==========================================
// QUESTIONS (Sorular)
// ==========================================

const getAllQuestions = async (categoryId = null) => {
    try {
        const pool = await getPool();
        let query = `
            SELECT q.*, c.name as categoryName 
            FROM Questions q
            LEFT JOIN Categories c ON q.categoryId = c.id
            WHERE q.isActive = 1
        `;

        const request = pool.request();
        if (categoryId) {
            query += ' AND q.categoryId = @categoryId';
            request.input('categoryId', sql.Int, categoryId);
        }

        query += ' ORDER BY q.createdAt DESC';
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Get questions error:', error);
        throw error;
    }
};

const getQuestionById = async (id) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT q.*, c.name as categoryName 
                FROM Questions q
                LEFT JOIN Categories c ON q.categoryId = c.id
                WHERE q.id = @id
            `);
        return result.recordset[0];
    } catch (error) {
        console.error('Get question error:', error);
        throw error;
    }
};

const getQuestionOptions = async (questionId) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('questionId', sql.Int, questionId)
            .query('SELECT * FROM QuestionOptions WHERE questionId = @questionId ORDER BY orderIndex');
        return result.recordset;
    } catch (error) {
        console.error('Get question options error:', error);
        throw error;
    }
};

const createQuestion = async (questionData) => {
    const { categoryId, question, type, difficulty, imageUrl, explanation, createdBy, options } = questionData;

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Soru ekle
        const questionResult = await transaction.request()
            .input('categoryId', sql.Int, categoryId)
            .input('question', sql.NVarChar(sql.MAX), question)
            .input('type', sql.NVarChar(20), type)
            .input('difficulty', sql.NVarChar(20), difficulty || 'medium')
            .input('imageUrl', sql.NVarChar(sql.MAX), imageUrl || null)
            .input('explanation', sql.NVarChar(sql.MAX), explanation || null)
            .input('createdBy', sql.Int, createdBy || null)
            .query(`
                INSERT INTO Questions (categoryId, question, type, difficulty, imageUrl, explanation, createdBy)
                OUTPUT INSERTED.*
                VALUES (@categoryId, @question, @type, @difficulty, @imageUrl, @explanation, @createdBy)
            `);

        const newQuestion = questionResult.recordset[0];

        // Seçenekleri ekle
        if (options && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                await transaction.request()
                    .input('questionId', sql.Int, newQuestion.id)
                    .input('optionText', sql.NVarChar(sql.MAX), options[i].text)
                    .input('isCorrect', sql.Bit, options[i].isCorrect ? 1 : 0)
                    .input('orderIndex', sql.Int, i)
                    .query(`
                        INSERT INTO QuestionOptions (questionId, optionText, isCorrect, orderIndex)
                        VALUES (@questionId, @optionText, @isCorrect, @orderIndex)
                    `);
            }
        }

        await transaction.commit();
        return newQuestion;
    } catch (error) {
        await transaction.rollback();
        console.error('Create question error:', error);
        throw error;
    }
};

const deleteQuestion = async (id) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE Questions SET isActive = 0, updatedAt = GETDATE() WHERE id = @id');
        return true;
    } catch (error) {
        console.error('Delete question error:', error);
        throw error;
    }
};

// ==========================================
// TESTS (Testler)
// ==========================================

const getAllTests = async () => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM vw_TestStatistics WHERE isActive = 1 ORDER BY createdAt DESC');
        return result.recordset;
    } catch (error) {
        console.error('Get tests error:', error);
        throw error;
    }
};

const getTestById = async (id) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Tests WHERE id = @id');
        return result.recordset[0];
    } catch (error) {
        console.error('Get test error:', error);
        throw error;
    }
};

const getTestByTestId = async (testId) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('testId', sql.NVarChar(100), testId)
            .query('SELECT * FROM Tests WHERE testId = @testId');
        return result.recordset[0];
    } catch (error) {
        console.error('Get test by testId error:', error);
        throw error;
    }
};

const getTestQuestions = async (testId) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('testId', sql.Int, testId)
            .query(`
                SELECT q.*, tq.orderIndex
                FROM Questions q
                INNER JOIN TestQuestions tq ON q.id = tq.questionId
                WHERE tq.testId = @testId
                ORDER BY tq.orderIndex
            `);

        // Her soru için seçenekleri getir
        const questions = result.recordset;
        for (let question of questions) {
            const options = await getQuestionOptions(question.id);
            question.options = options;
        }

        return questions;
    } catch (error) {
        console.error('Get test questions error:', error);
        throw error;
    }
};

const createTest = async (testData) => {
    const { testId, title, description, categoryId, timePerQuestion, createdBy, questions } = testData;

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Test oluştur
        const testResult = await transaction.request()
            .input('testId', sql.NVarChar(100), testId)
            .input('title', sql.NVarChar(200), title)
            .input('description', sql.NVarChar(sql.MAX), description || null)
            .input('categoryId', sql.Int, categoryId || null)
            .input('timePerQuestion', sql.Int, timePerQuestion || 30)
            .input('createdBy', sql.Int, createdBy || null)
            .query(`
                INSERT INTO Tests (testId, title, description, categoryId, timePerQuestion, createdBy)
                OUTPUT INSERTED.*
                VALUES (@testId, @title, @description, @categoryId, @timePerQuestion, @createdBy)
            `);

        const newTest = testResult.recordset[0];

        // Soruları ekle
        if (questions && questions.length > 0) {
            for (let i = 0; i < questions.length; i++) {
                await transaction.request()
                    .input('testId', sql.Int, newTest.id)
                    .input('questionId', sql.Int, questions[i].id || questions[i].questionId)
                    .input('orderIndex', sql.Int, i)
                    .query(`
                        INSERT INTO TestQuestions (testId, questionId, orderIndex)
                        VALUES (@testId, @questionId, @orderIndex)
                    `);
            }
        }

        await transaction.commit();
        return newTest;
    } catch (error) {
        await transaction.rollback();
        console.error('Create test error:', error);
        throw error;
    }
};

const updateTestStatistics = async (testId) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('testId', sql.Int, testId)
            .execute('sp_UpdateTestStatistics');
        return true;
    } catch (error) {
        console.error('Update test statistics error:', error);
        throw error;
    }
};

// ==========================================
// QUIZ SESSIONS (Quiz Oturumları)
// ==========================================

const createQuizSession = async (roomCode, testId, teacherId, teacherName) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('roomCode', sql.NVarChar(10), roomCode)
            .input('testId', sql.Int, testId)
            .input('teacherId', sql.Int, teacherId || null)
            .input('teacherName', sql.NVarChar(100), teacherName)
            .query(`
                INSERT INTO QuizSessions (roomCode, testId, teacherId, teacherName, status)
                OUTPUT INSERTED.*
                VALUES (@roomCode, @testId, @teacherId, @teacherName, 'waiting')
            `);
        return result.recordset[0];
    } catch (error) {
        console.error('Create quiz session error:', error);
        throw error;
    }
};

const getQuizSessionByCode = async (roomCode) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('roomCode', sql.NVarChar(10), roomCode)
            .query('SELECT * FROM QuizSessions WHERE roomCode = @roomCode');
        return result.recordset[0];
    } catch (error) {
        console.error('Get quiz session error:', error);
        throw error;
    }
};

const updateQuizSessionStatus = async (sessionId, status, currentQuestionIndex = null) => {
    try {
        const pool = await getPool();
        const request = pool.request()
            .input('sessionId', sql.Int, sessionId)
            .input('status', sql.NVarChar(20), status);

        let query = 'UPDATE QuizSessions SET status = @status';

        if (status === 'active' && !currentQuestionIndex) {
            query += ', startedAt = GETDATE()';
        } else if (status === 'finished') {
            query += ', finishedAt = GETDATE()';
        }

        if (currentQuestionIndex !== null) {
            request.input('currentQuestionIndex', sql.Int, currentQuestionIndex);
            query += ', currentQuestionIndex = @currentQuestionIndex';
        }

        query += ' WHERE id = @sessionId';
        await request.query(query);
        return true;
    } catch (error) {
        console.error('Update quiz session status error:', error);
        throw error;
    }
};

// ==========================================
// QUIZ PARTICIPANTS (Katılımcılar)
// ==========================================

const createParticipant = async (sessionId, userId, studentName, socketId) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('sessionId', sql.Int, sessionId)
            .input('userId', sql.Int, userId || null)
            .input('studentName', sql.NVarChar(100), studentName)
            .input('socketId', sql.NVarChar(100), socketId)
            .query(`
                INSERT INTO QuizParticipants (sessionId, userId, studentName, socketId)
                OUTPUT INSERTED.*
                VALUES (@sessionId, @userId, @studentName, @socketId)
            `);
        return result.recordset[0];
    } catch (error) {
        console.error('Create participant error:', error);
        throw error;
    }
};

const getSessionParticipants = async (sessionId) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('sessionId', sql.Int, sessionId)
            .query('SELECT * FROM QuizParticipants WHERE sessionId = @sessionId ORDER BY score DESC, correctCount DESC');
        return result.recordset;
    } catch (error) {
        console.error('Get session participants error:', error);
        throw error;
    }
};

const updateParticipantScore = async (participantId, isCorrect) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('participantId', sql.Int, participantId)
            .input('scoreIncrement', sql.Int, isCorrect ? 100 : 0)
            .input('correctIncrement', sql.Int, isCorrect ? 1 : 0)
            .input('wrongIncrement', sql.Int, isCorrect ? 0 : 1)
            .query(`
                UPDATE QuizParticipants
                SET 
                    score = score + @scoreIncrement,
                    correctCount = correctCount + @correctIncrement,
                    wrongCount = wrongCount + @wrongIncrement
                WHERE id = @participantId
            `);
        return true;
    } catch (error) {
        console.error('Update participant score error:', error);
        throw error;
    }
};

// ==========================================
// QUIZ ANSWERS (Cevaplar)
// ==========================================

const saveQuizAnswer = async (participantId, questionId, selectedAnswer, isCorrect) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('participantId', sql.Int, participantId)
            .input('questionId', sql.Int, questionId)
            .input('selectedAnswer', sql.NVarChar(sql.MAX), selectedAnswer)
            .input('isCorrect', sql.Bit, isCorrect ? 1 : 0)
            .query(`
                INSERT INTO QuizAnswers (participantId, questionId, selectedAnswer, isCorrect)
                VALUES (@participantId, @questionId, @selectedAnswer, @isCorrect)
            `);
        return true;
    } catch (error) {
        console.error('Save quiz answer error:', error);
        throw error;
    }
};

// ==========================================
// USERS (Kullanıcılar)
// ==========================================

const getUserByEmail = async (email) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar(255), email)
            .query('SELECT * FROM Users WHERE email = @email AND isActive = 1');
        return result.recordset[0];
    } catch (error) {
        console.error('Get user by email error:', error);
        throw error;
    }
};

const getUserByUsername = async (username) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar(100), username)
            .query('SELECT * FROM Users WHERE username = @username AND isActive = 1');
        return result.recordset[0];
    } catch (error) {
        console.error('Get user by username error:', error);
        throw error;
    }
};

const createUser = async (username, email, hashedPassword, role = 'student') => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar(100), username)
            .input('email', sql.NVarChar(255), email)
            .input('password', sql.NVarChar(255), hashedPassword)
            .input('role', sql.NVarChar(20), role)
            .query(`
                INSERT INTO Users (username, email, password, role)
                OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.role, INSERTED.createdAt
                VALUES (@username, @email, @password, @role)
            `);
        return result.recordset[0];
    } catch (error) {
        console.error('Create user error:', error);
        throw error;
    }
};

module.exports = {
    // Categories
    getAllCategories,
    getCategoryById,
    createCategory,

    // Questions
    getAllQuestions,
    getQuestionById,
    getQuestionOptions,
    createQuestion,
    deleteQuestion,

    // Tests
    getAllTests,
    getTestById,
    getTestByTestId,
    getTestQuestions,
    createTest,
    updateTestStatistics,

    // Quiz Sessions
    createQuizSession,
    getQuizSessionByCode,
    updateQuizSessionStatus,

    // Participants
    createParticipant,
    getSessionParticipants,
    updateParticipantScore,

    // Answers
    saveQuizAnswer,

    // Users
    getUserByEmail,
    getUserByUsername,
    createUser
};
