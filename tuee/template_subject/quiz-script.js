document.addEventListener('DOMContentLoaded', () => {
    const currentQuestionNumberSpan = document.getElementById('current-question-number');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const scoreSpan = document.getElementById('score');
    const timerSpan = document.getElementById('timer');
    const quizContent = document.getElementById('quiz-content');
    const prevQuestionBtn = document.getElementById('prev-question-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');

    // updating subject throughout dynamically
    const subjectName = "Subject";
    document.title = `TUEE ${subjectName}`;
    const subject = document.getElementById("subject-display-name"); // Renamed for clarity
    subject.textContent = subjectName;

    // Elements for Question Status Modal
    const reviewQuizBtn = document.getElementById('review-quiz-btn');
    const questionStatusModal = document.getElementById('question-status-modal');
    const questionStatusGrid = document.getElementById('question-status-grid');
    const closeStatusModalBtn = document.getElementById('close-status-modal-btn');


    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval;
    const MARKS_PER_QUESTION = 2; // Marks for each correct answer

    let timeElapsed = 0; // Initialize timeElapsed to 0

    // Store user's selected answers and whether they got it right
    // isCorrect will be:
    // - true: Correctly answered
    // - false: Incorrectly answered
    // - null: Skipped or not yet submitted
    let userAnswers = []; // Array of objects: { selectedOption: 'A', isCorrect: true/false/null }

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
            reviewQuizBtn.disabled = true; // Disable review button
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
                reviewQuizBtn.disabled = true; // Disable review button
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
            reviewQuizBtn.disabled = true; // Disable review button
        }
    }

    /**
     * Initializes the quiz state and displays the first question.
     */
    function initializeQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        timeElapsed = 0; // Reset time elapsed for restart
        userAnswers = Array(questions.length).fill(null).map(() => ({ selectedOption: null, isCorrect: null })); // Initialize with null for both
        scoreSpan.textContent = score;
        displayQuestion();
        startGlobalTimer(); // Start the global timer
        updateNavigationButtons();
        updateQuestionStatusDisplay(); // Initialize status display
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

        // Restore previous state if exists
        const previousAnswerState = userAnswers[currentQuestionIndex];

        // If an option was previously selected (even if not submitted)
        if (previousAnswerState && previousAnswerState.selectedOption) {
            const selectedOptionElement = optionsList.querySelector(`[data-option="${previousAnswerState.selectedOption}"]`);
            if (selectedOptionElement) {
                selectedOptionElement.classList.add('option-selected');
            }
        }

        // If the question was already submitted (isCorrect is true or false)
        if (previousAnswerState && previousAnswerState.isCorrect !== null) {
            revealAnswer(question.answer, previousAnswerState.selectedOption);
            submitAnswerBtn.disabled = true;
            optionsList.classList.add('options-disabled');
            feedbackMessage.classList.remove('hidden');
            feedbackMessage.textContent = previousAnswerState.isCorrect ? 'Correct!' : 'Incorrect!';
            feedbackMessage.classList.add(previousAnswerState.isCorrect ? 'text-green-700' : 'text-red-700');
        } else {
            // If not submitted, ensure submit button is enabled and options are clickable
            submitAnswerBtn.disabled = false;
            optionsList.classList.remove('options-disabled');
            feedbackMessage.classList.add('hidden'); // Hide feedback for a fresh or skipped question
        }


        // Add event listeners for options
        optionsList.querySelectorAll('.option-item').forEach(optionElement => {
            optionElement.addEventListener('click', () => {
                // Only allow selection if the question has not been submitted yet
                if (userAnswers[currentQuestionIndex].isCorrect === null) {
                    optionsList.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('option-selected'));
                    optionElement.classList.add('option-selected');
                    // Store the selected option, but mark isCorrect as null until submitted
                    userAnswers[currentQuestionIndex].selectedOption = optionElement.dataset.option;
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
                updateQuestionStatusDisplay(); // Update status after answer submission
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
     * Starts the global timer to display time elapsed.
     */
    function startGlobalTimer() {
        clearInterval(timerInterval); // Clear any existing timer
        timeElapsed = 0; // Reset time elapsed
        updateTimerDisplay(); // Display 00:00:00 initially

        timerInterval = setInterval(() => {
            timeElapsed++; // Increment time elapsed
            updateTimerDisplay();
            // No endQuiz() call here, timer runs indefinitely
        }, 1000);
    }

    /**
     * Updates the timer display to show time elapsed.
     */
    function updateTimerDisplay() {
        const hours = Math.floor(timeElapsed / 3600);
        const minutes = Math.floor((timeElapsed % 3600) / 60);
        const seconds = timeElapsed % 60;
        timerSpan.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * This function is now only called when all questions are navigated through.
     * It no longer handles time-based quiz ending.
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
        // reviewQuizBtn is NOT disabled here, as per new requirement
    }

    /**
     * Updates the enabled/disabled state of navigation buttons.
     */
    function updateNavigationButtons() {
        prevQuestionBtn.disabled = (currentQuestionIndex === 0);
        nextQuestionBtn.disabled = (currentQuestionIndex === questions.length - 1);

        // reviewQuizBtn is NOT disabled here, as per new requirement
    }

    /**
     * Navigates to the previous question.
     */
    prevQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
            updateNavigationButtons();
            updateQuestionStatusDisplay(); // Keep status updated on navigation
        }
    });

    /**
     * Navigates to the next question or "ends" the quiz (by reaching the last question).
     */
    nextQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
            updateNavigationButtons();
            updateQuestionStatusDisplay(); // Keep status updated on navigation
        } else {
            // Quiz "ends" when all questions are navigated through
            endQuiz(); // This will stop the timer and disable navigation buttons
        }
    });

    // --- Question Status Modal Logic ---

    /**
     * Updates the display of question status in the modal grid.
     */
    function updateQuestionStatusDisplay() {
        questionStatusGrid.innerHTML = ''; // Clear previous grid
        questions.forEach((q, index) => {
            const statusItem = document.createElement('div');
            statusItem.classList.add(
                'question-status-item',
                'p-2', 'rounded-md', 'shadow-sm', 'border', 'border-gray-300',
                'transition', 'duration-150', 'ease-in-out'
            );
            statusItem.textContent = index + 1; // Display question number

            // Apply color based on answer status
            const answerState = userAnswers[index];
            if (answerState && answerState.isCorrect === true) {
                statusItem.classList.add('bg-green-200', 'text-green-800'); // Green for correct
            } else if (answerState && answerState.isCorrect === false) {
                statusItem.classList.add('bg-red-200', 'text-red-800'); // Red for incorrect
            } else {
                statusItem.classList.add('bg-white', 'text-gray-800'); // White for not attempted/skipped
            }

            // Highlight current question in the status grid
            if (index === currentQuestionIndex) {
                 statusItem.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
            }

            // Add click listener to navigate to the question
            statusItem.addEventListener('click', () => {
                currentQuestionIndex = index;
                displayQuestion();
                updateNavigationButtons();
                questionStatusModal.classList.add('hidden'); // Close modal after navigating
                updateQuestionStatusDisplay(); // Update highlight for new current question
            });

            questionStatusGrid.appendChild(statusItem);
        });
    }

    // Event listener to open the status modal
    reviewQuizBtn.addEventListener('click', () => {
        updateQuestionStatusDisplay(); // Ensure status is up-to-date before opening
        questionStatusModal.classList.remove('hidden');
    });

    // Event listener to close the status modal
    closeStatusModalBtn.addEventListener('click', () => {
        questionStatusModal.classList.add('hidden');
    });

    // Initial load of questions
    loadQuestions();
});
