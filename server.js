// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// LeetCode GraphQL query
const LEETCODE_QUERY = `
    query userSessionProgress($username: String!) {
        allQuestionsCount {
            difficulty
            count
        }
        matchedUser(username: $username) {
            submitStats {
                acSubmissionNum {
                    difficulty
                    count
                    submissions
                }
                totalSubmissionNum {
                    difficulty
                    count
                    submissions
                }
            }
        }
    }
`;

// Validate username function
function validateUsername(username) {
    if (!username || username.trim() === "") {
        return { valid: false, message: "Username should not be empty" };
    }
    const regex = /^[a-zA-Z0-9_-]{1,15}$/;
    const isMatching = regex.test(username);
    if (!isMatching) {
        return { valid: false, message: "Invalid Username format" };
    }
    return { valid: true };
}

// Fetch user details from LeetCode
async function fetchLeetCodeData(username) {
    try {
        const response = await fetch('https://leetcode.com/graphql/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                query: LEETCODE_QUERY,
                variables: { username }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.data || !data.data.matchedUser) {
            throw new Error('User not found');
        }

        return data;
    } catch (error) {
        console.error('Error fetching LeetCode data:', error);
        throw error;
    }
}

// Process and format the data
function processLeetCodeData(rawData) {
    try {
        const allQuestionsCount = rawData.data.allQuestionsCount;
        const userStats = rawData.data.matchedUser.submitStats;

        // Extract totals
        const totalQues = allQuestionsCount[0].count;
        const totalEasyQues = allQuestionsCount[1].count;
        const totalMediumQues = allQuestionsCount[2].count;
        const totalHardQues = allQuestionsCount[3].count;

        // Extract solved counts
        const solvedTotalQues = userStats.acSubmissionNum[0].count;
        const solvedEasyQues = userStats.acSubmissionNum[1].count;
        const solvedMediumQues = userStats.acSubmissionNum[2].count;
        const solvedHardQues = userStats.acSubmissionNum[3].count;

        // Calculate progress percentages
        const easyProgress = Math.round((solvedEasyQues / totalEasyQues) * 100);
        const mediumProgress = Math.round((solvedMediumQues / totalMediumQues) * 100);
        const hardProgress = Math.round((solvedHardQues / totalHardQues) * 100);

        return {
            success: true,
            data: {
                totalQuestions: {
                    all: totalQues,
                    easy: totalEasyQues,
                    medium: totalMediumQues,
                    hard: totalHardQues
                },
                solvedQuestions: {
                    all: solvedTotalQues,
                    easy: solvedEasyQues,
                    medium: solvedMediumQues,
                    hard: solvedHardQues
                },
                progress: {
                    easy: easyProgress,
                    medium: mediumProgress,
                    hard: hardProgress
                },
                submissions: {
                    total: userStats.totalSubmissionNum[0].submissions,
                    easy: userStats.totalSubmissionNum[1].submissions,
                    medium: userStats.totalSubmissionNum[2].submissions,
                    hard: userStats.totalSubmissionNum[3].submissions
                }
            }
        };
    } catch (error) {
        console.error('Error processing data:', error);
        throw new Error('Error processing user data');
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get user stats
app.get('/api/user/:username', async (req, res) => {
    try {
        const username = req.params.username;
        
        // Validate username
        const validation = validateUsername(username);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.message
            });
        }

        // Fetch data from LeetCode
        const rawData = await fetchLeetCodeData(username);
        
        // Process and format data
        const processedData = processLeetCodeData(rawData);
        
        res.json(processedData);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch user data'
        });
    }
});

// POST endpoint for form submissions
app.post('/api/user', async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username is required'
            });
        }

        // Validate username
        const validation = validateUsername(username);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.message
            });
        }

        // Fetch data from LeetCode
        const rawData = await fetchLeetCodeData(username);
        
        // Process and format data
        const processedData = processLeetCodeData(rawData);
        
        res.json(processedData);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch user data'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});

module.exports = app;