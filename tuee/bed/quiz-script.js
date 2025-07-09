document.addEventListener('DOMContentLoaded', () => {
    const currentQuestionNumberSpan = document.getElementById('current-question-number');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const scoreSpan = document.getElementById('score');
    const timerSpan = document.getElementById('timer');
    const quizContent = document.getElementById('quiz-content');
    const prevQuestionBtn = document.getElementById('prev-question-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizEndModal = document.getElementById('quiz-end-modal');
    const finalScoreSpan = document.getElementById('final-score');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const backToSelectionBtn = document.getElementById('back-to-selection-btn');

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval;
    // Changed from TIME_PER_QUESTION_SECONDS to TOTAL_QUIZ_TIME_SECONDS
    const TOTAL_QUIZ_TIME_SECONDS = 2 * 60 * 60; // 2 hours in seconds
    const MARKS_PER_QUESTION = 2; // Marks for each correct answer

    let timeLeft = TOTAL_QUIZ_TIME_SECONDS; // Initialize with total quiz time

    // Store user's selected answers and whether they got it right
    let userAnswers = []; // Array of objects: { selectedOption: 'A', isCorrect: true/false }

    /**
     * Parses URL parameters to get the selected year and medium.
     * @returns {Object} An object containing year and medium.
     */
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            year: params.get('year'),
            medium: params.get('medium')
        };
    }

    /**
     * Loads questions from the appropriate JSON file based on year and medium.
     */
    async function loadQuestions() {
        const { year, medium } = getUrlParams();
        if (!year || !medium) {
            quizContent.innerHTML = `
                <div class="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                    <p class="font-semibold mb-2">Error: Year and Medium not selected.</p>
                    <p>Please go back to the <a href="./index.html" class="text-indigo-600 hover:underline">selection page</a>.</p>
                </div>
            `;
            // Disable buttons if no questions are loaded
            prevQuestionBtn.disabled = true;
            nextQuestionBtn.disabled = true;
            return;
        }

        const fileName = `${year}${medium}.json`;
        const filePath = `./questions/${fileName}`; // Assuming JSON files are now in 'questions/'

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            questions = data.questions || [];
            if (questions.length === 0) {
                quizContent.innerHTML = `
                    <div class="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                        <p class="font-semibold">No questions found for ${year} (${medium}).</p>
                        <p>Please check the JSON file: <code>${fileName}</code> in the <code>questions/</code> directory.</p>
                    </div>
                `;
                // Disable buttons if no questions are loaded
                prevQuestionBtn.disabled = true;
                nextQuestionBtn.disabled = true;
                return;
            }
            console.log(`Loaded ${questions.length} questions from ${filePath}.`);
            totalQuestionsSpan.textContent = questions.length;
            initializeQuiz();
        } catch (error) {
            console.error('Error loading questions:', error);
            quizContent.innerHTML = `
                <div class="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                    <p class="font-semibold mb-2">Error loading questions:</p>
                    <p>${error.message}</p>
                    <p>Could not load questions from <code>${filePath}</code>. Please ensure the file exists and is correctly formatted.</p>
                </div>
            `;
            // Disable buttons on error
            prevQuestionBtn.disabled = true;
            nextQuestionBtn.disabled = true;
        }
    }

    /**
     * Initializes the quiz state and displays the first question.
     */
    function initializeQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = Array(questions.length).fill(null); // Initialize user answers array
        scoreSpan.textContent = score;
        displayQuestion();
        // Start the global timer only once when the quiz initializes
        startGlobalTimer();
        updateNavigationButtons();
    }

    /**
     * Displays the current question.
     */
    function displayQuestion() {
        if (questions.length === 0) {
            return;
        }

        const question = questions[currentQuestionIndex];
        currentQuestionNumberSpan.textContent = currentQuestionIndex + 1;

        quizContent.innerHTML = `
            <div class="question-card bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-4 leading-relaxed">
                    ${question.questionNumber ? `Q${question.questionNumber}. ` : ''}${question.questionContent}
                </h3>
                <ul class="space-y-3 text-gray-700" id="options-list">
                    <li class="option-item p-3 border border-gray-200 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out" data-option="A">
                        <strong>A)</strong> ${question.optionA}
                    </li>
                    <li class="option-item p-3 border border-gray-200 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out" data-option="B">
                        <strong>B)</strong> ${question.optionB}
                    </li>
                    <li class="option-item p-3 border border-gray-200 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out" data-option="C">
                        <strong>C)</strong> ${question.optionC}
                    </li>
                    <li class="option-item p-3 border border-gray-200 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out" data-option="D">
                        <strong>D)</strong> ${question.optionD}
                    </li>
                </ul>
                <div class="mt-6 text-center">
                    <button class="submit-answer-btn bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-5 rounded-lg shadow-sm transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75">
                        Submit Answer
                    </button>
                    <p class="feedback-message mt-3 text-lg font-bold hidden"></p>
                </div>
            </div>
        `;

        const optionsList = document.getElementById('options-list');
        const submitAnswerBtn = quizContent.querySelector('.submit-answer-btn');
        const feedbackMessage = quizContent.querySelector('.feedback-message');

        // Restore previous selection if exists
        const previousAnswer = userAnswers[currentQuestionIndex];
        if (previousAnswer) {
            const selectedOptionElement = optionsList.querySelector(`[data-option="${previousAnswer.selectedOption}"]`);
            if (selectedOptionElement) {
                selectedOptionElement.classList.add('option-selected');
            }
            // If already answered, show feedback and disable options
            if (previousAnswer.isCorrect !== null) { // Means it was submitted
                revealAnswer(question.answer, previousAnswer.selectedOption);
                submitAnswerBtn.disabled = true;
                optionsList.classList.add('options-disabled');
                feedbackMessage.classList.remove('hidden');
                feedbackMessage.textContent = previousAnswer.isCorrect ? 'Correct!' : 'Incorrect!';
                feedbackMessage.classList.add(previousAnswer.isCorrect ? 'text-green-700' : 'text-red-700');
            }
        }

        // Add event listeners for options
        optionsList.querySelectorAll('.option-item').forEach(optionElement => {
            optionElement.addEventListener('click', () => {
                // Only allow selection if not already answered
                // Check if the current question's answer has NOT been submitted yet (isCorrect is null)
                if (!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].isCorrect === null) {
                    optionsList.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('option-selected'));
                    optionElement.classList.add('option-selected');
                    // Store the selected option, but mark isCorrect as null until submitted
                    userAnswers[currentQuestionIndex] = { selectedOption: optionElement.dataset.option, isCorrect: null };
                }
            });
        });

        // Add event listener for submit button
        submitAnswerBtn.addEventListener('click', () => {
            const selectedOption = userAnswers[currentQuestionIndex]?.selectedOption;
            if (selectedOption) {
                checkAnswer(question.answer, selectedOption);
                submitAnswerBtn.disabled = true; // Disable after submission
                optionsList.classList.add('options-disabled'); // Disable further clicks on options
            } else {
                feedbackMessage.classList.remove('hidden');
                feedbackMessage.textContent = 'Please select an option first!';
                feedbackMessage.classList.remove('text-green-700', 'text-red-700');
                feedbackMessage.classList.add('text-yellow-700');
            }
        });
    }

    /**
     * Checks the selected answer against the correct answer.
     * @param {string} correctAnswer - The correct answer (A, B, C, D).
     * @param {string} selectedOption - The user's selected option.
     */
    function checkAnswer(correctAnswer, selectedOption) {
        const isCorrect = (selectedOption === correctAnswer);
        const feedbackMessage = quizContent.querySelector('.feedback-message');

        if (isCorrect) {
            score += MARKS_PER_QUESTION; // Increment score by MARKS_PER_QUESTION
            scoreSpan.textContent = score;
            feedbackMessage.textContent = 'Correct!';
            feedbackMessage.classList.remove('text-red-700', 'text-yellow-700');
            feedbackMessage.classList.add('text-green-700');
        } else {
            feedbackMessage.textContent = 'Incorrect!';
            feedbackMessage.classList.remove('text-green-700', 'text-yellow-700');
            feedbackMessage.classList.add('text-red-700');
        }
        feedbackMessage.classList.remove('hidden');

        // Update userAnswers with correctness
        userAnswers[currentQuestionIndex].isCorrect = isCorrect;

        revealAnswer(correctAnswer, selectedOption);
    }

    /**
     * Highlights the correct and selected answers.
     * @param {string} correctAnswer - The correct answer.
     * @param {string} selectedOption - The user's selected option.
     */
    function revealAnswer(correctAnswer, selectedOption) {
        const optionsList = document.getElementById('options-list');
        optionsList.querySelectorAll('.option-item').forEach(optionElement => {
            // Ensure any previous selection highlighting is removed before showing correct/incorrect
            optionElement.classList.remove('option-selected');

            if (optionElement.dataset.option === correctAnswer) {
                optionElement.classList.add('option-correct');
            } else if (optionElement.dataset.option === selectedOption) {
                optionElement.classList.add('option-incorrect');
            }
        });
    }

    /**
     * Starts the global timer for the entire quiz.
     */
    function startGlobalTimer() {
        clearInterval(timerInterval); // Clear any existing timer
        // timeLeft is already initialized with TOTAL_QUIZ_TIME_SECONDS
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endQuiz(); // Call endQuiz when time runs out
            }
        }, 1000);
    }

    /**
     * Updates the timer display.
     */
    function updateTimerDisplay() {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        timerSpan.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * Ends the quiz and shows the final score modal.
     */
    function endQuiz() {
        clearInterval(timerInterval); // Ensure timer stops
        // Disable all interactive elements
        if (quizContent) {
            quizContent.classList.add('options-disabled'); // Disable options for current question
            const submitBtn = quizContent.querySelector('.submit-answer-btn');
            if (submitBtn) submitBtn.disabled = true;
        }
        prevQuestionBtn.disabled = true;
        nextQuestionBtn.disabled = true;

        showQuizEndModal();
    }

    /**
     * Updates the enabled/disabled state of navigation buttons.
     */
    function updateNavigationButtons() {
        // Navigation buttons are primarily for moving between questions.
        // Their state depends on currentQuestionIndex, not the global timer.
        prevQuestionBtn.disabled = (currentQuestionIndex === 0);
        nextQuestionBtn.disabled = (currentQuestionIndex === questions.length - 1);

        // If quiz has ended due to time, all buttons should be disabled.
        if (timeLeft <= 0) {
            prevQuestionBtn.disabled = true;
            nextQuestionBtn.disabled = true;
        }
    }

    /**
     * Navigates to the previous question.
     */
    prevQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
            updateNavigationButtons();
        }
    });

    /**
     * Navigates to the next question or ends the quiz.
     */
    nextQuestionBtn.addEventListener('click', () => {
        // Ensure current question is marked as answered (even if time ran out or skipped)
        if (!userAnswers[currentQuestionIndex]) {
            userAnswers[currentQuestionIndex] = { selectedOption: null, isCorrect: false }; // Mark as unanswered/incorrect
        } else if (userAnswers[currentQuestionIndex].isCorrect === null) {
            userAnswers[currentQuestionIndex].isCorrect = false; // Mark as incorrect if not submitted
        }

        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
            updateNavigationButtons();
        } else {
            // Quiz ends when all questions are navigated through
            endQuiz();
        }
    });

    /**
     * Displays the quiz end modal with the final score.
     */
    function showQuizEndModal() {
        finalScoreSpan.textContent = score;
        quizEndModal.classList.remove('hidden');
    }

    /**
     * Restarts the quiz from the beginning.
     */
    restartQuizBtn.addEventListener('click', () => {
        quizEndModal.classList.add('hidden');
        timeLeft = TOTAL_QUIZ_TIME_SECONDS; // Reset timer for restart
        initializeQuiz();
    });

    /**
     * Navigates back to the programme selection page.
     */
    backToSelectionBtn.addEventListener('click', () => {
        window.location.href = './index.html'; // Go back to TUEE/bed/index.html
    });

    // Initial load of questions
    loadQuestions();
});
