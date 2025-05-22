// public/js/client.js
document.addEventListener("DOMContentLoaded", function() {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");

    // Show loading state
    function showLoading() {
        searchButton.textContent = "Searching...";
        searchButton.disabled = true;
        statsContainer.style.opacity = "0.6";
    }

    // Hide loading state
    function hideLoading() {
        searchButton.textContent = "Search";
        searchButton.disabled = false;
        statsContainer.style.opacity = "1";
    }

    // Fetch user details from our backend API
    async function fetchUserDetails(username) {
        try {
            showLoading();

            const response = await fetch(`/api/user/${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch user data');
            }

            console.log("User data received:", result.data);
            displayUserData(result.data);

        } catch (error) {
            console.error("Fetch error:", error);
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    // Update progress circles
    function updateProgress(solved, total, label, circle) {
        const progressDegree = (solved / total) * 100;
        circle.style.setProperty("--progress-degree", `${progressDegree}%`);
        label.textContent = `${solved}/${total}`;
    }

    // Display user data
    function displayUserData(data) {
        try {
            // Update progress circles
            updateProgress(
                data.solvedQuestions.easy,
                data.totalQuestions.easy,
                easyLabel,
                easyProgressCircle
            );
            updateProgress(
                data.solvedQuestions.medium,
                data.totalQuestions.medium,
                mediumLabel,
                mediumProgressCircle
            );
            updateProgress(
                data.solvedQuestions.hard,
                data.totalQuestions.hard,
                hardLabel,
                hardProgressCircle
            );

            // Update stats cards
            const cardsData = [
                {
                    label: "Total Problems Solved",
                    value: data.solvedQuestions.all,
                    description: `out of ${data.totalQuestions.all} problems`
                },
                {
                    label: "Easy Problems",
                    value: data.solvedQuestions.easy,
                    description: `${data.progress.easy}% completed`
                },
                {
                    label: "Medium Problems",
                    value: data.solvedQuestions.medium,
                    description: `${data.progress.medium}% completed`
                },
                {
                    label: "Hard Problems",
                    value: data.solvedQuestions.hard,
                    description: `${data.progress.hard}% completed`
                },
                {
                    label: "Total Submissions",
                    value: data.submissions.total,
                    description: "All time submissions"
                },
                {
                    label: "Easy Submissions",
                    value: data.submissions.easy,
                    description: "Easy problem submissions"
                },
                {
                    label: "Medium Submissions",
                    value: data.submissions.medium,
                    description: "Medium problem submissions"
                },
                {
                    label: "Hard Submissions",
                    value: data.submissions.hard,
                    description: "Hard problem submissions"
                }
            ];

            cardStatsContainer.innerHTML = cardsData.map(card => `
                <div class="card">
                    <h4>${card.label}</h4>
                    <p class="card-value">${card.value}</p>
                    <p class="card-description">${card.description}</p>
                </div>
            `).join("");

            // Show stats container
            statsContainer.style.display = "block";

        } catch (error) {
            console.error("Error displaying data:", error);
            showError("Error displaying user data. Please try again.");
        }
    }

    // Show error message
    function showError(message) {
        statsContainer.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <p>Please check the username and try again.</p>
            </div>
        `;
        statsContainer.style.display = "block";
    }

    // Validate username
    function validateUsername(username) {
        if (username.trim() === "") {
            showError("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if (!isMatching) {
            showError("Invalid Username format. Use only letters, numbers, hyphens, and underscores (1-15 characters)");
        }
        return isMatching;
    }

    // Event listeners
    searchButton.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        console.log("Searching for username:", username);
        
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });

    // Allow Enter key to trigger search
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchButton.click();
        }
    });

    // Clear stats when input is cleared
    usernameInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            statsContainer.style.display = "none";
        }
    });
});