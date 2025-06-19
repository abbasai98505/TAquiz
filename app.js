// Quiz Game Application
class QuizGame {
    constructor() {
        this.gameState = {
            currentPlayer: 1,
            player1: { name: '', score: 0, correctAnswers: 0, wrongAnswers: [] },
            player2: { name: '', score: 0, correctAnswers: 0, wrongAnswers: [] },
            currentQuestionIndex: 0,
            totalQuestions: 20,
            isGameComplete: false,
            timeRemaining: 30,
            hasAnswered: false,
            isSinglePlayer: true
        };
        
        this.questions = [];
        this.timer = null;
        this.timerInterval = null;
        this.aiTimeout = null;
        
        this.initializeEventListeners();
        this.initializeTheme();
        this.hideLoading();
    }
    
    initializeEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // Game mode selection
        document.querySelectorAll('.game-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectGameMode(e.target.closest('.game-mode-btn')));
        });
        
        // Player inputs
        document.getElementById('player1-name').addEventListener('input', () => this.validateInputs());
        document.getElementById('player2-name').addEventListener('input', () => this.validateInputs());
        
        // Start game
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        
        // Next question
        document.getElementById('next-question').addEventListener('click', () => this.nextQuestion());
        
        // Play again
        document.getElementById('play-again').addEventListener('click', () => this.resetGame());
        
        // Share result
        document.getElementById('share-result').addEventListener('click', () => this.shareResult());
    }
    
    initializeTheme() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    toggleTheme() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('darkMode', isDark);
        document.getElementById('theme-toggle').innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('start-screen').classList.remove('hidden');
        }, 1000);
    }
    
    selectGameMode(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.game-mode-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        button.classList.add('active');
        
        // Update game state and UI
        const mode = button.dataset.mode;
        this.gameState.isSinglePlayer = mode === 'single';
        
        // Update UI elements
        document.getElementById('input-title').textContent = 
            this.gameState.isSinglePlayer ? 'Enter Your Name' : 'Enter Player Names';
        
        document.getElementById('player2-input').style.display = 
            this.gameState.isSinglePlayer ? 'none' : 'block';
        
        // Update feature icon
        const featureIcon = document.querySelector('.feature-icon i');
        featureIcon.className = this.gameState.isSinglePlayer ? 'fas fa-robot' : 'fas fa-users';
        
        const featureText = document.querySelector('.feature p');
        featureText.textContent = this.gameState.isSinglePlayer ? 'vs AI' : '2 Players';
        
        this.validateInputs();
    }
    
    validateInputs() {
        const player1Name = document.getElementById('player1-name').value.trim();
        const player2Name = document.getElementById('player2-name').value.trim();
        const startBtn = document.getElementById('start-game');
        
        if (this.gameState.isSinglePlayer) {
            startBtn.disabled = !player1Name;
        } else {
            startBtn.disabled = !player1Name || !player2Name;
        }
    }
    
    startGame() {
        const player1Name = document.getElementById('player1-name').value.trim();
        const player2Name = this.gameState.isSinglePlayer ? 'Computer' : document.getElementById('player2-name').value.trim();
        
        // Initialize game state
        this.gameState = {
            currentPlayer: 1,
            player1: { name: player1Name, score: 0, correctAnswers: 0, wrongAnswers: [] },
            player2: { name: player2Name, score: 0, correctAnswers: 0, wrongAnswers: [] },
            currentQuestionIndex: 0,
            totalQuestions: 20,
            isGameComplete: false,
            timeRemaining: 30,
            hasAnswered: false,
            isSinglePlayer: this.gameState.isSinglePlayer
        };
        
        // Get random questions
        this.questions = getRandomQuestions(20);
        
        // Switch to game screen
        this.showScreen('game-screen');
        this.initializeGameScreen();
        this.displayQuestion();
        this.startTimer();
    }
    
    initializeGameScreen() {
        // Update player names
        document.getElementById('player1-display').textContent = this.gameState.player1.name;
        document.getElementById('player2-display').textContent = this.gameState.player2.name;
        
        // Update VS indicator for single player
        document.getElementById('vs-text').textContent = this.gameState.isSinglePlayer ? 'AI' : 'VS';
        
        // Update question counter
        document.getElementById('total-questions').textContent = this.gameState.totalQuestions;
        
        // Reset scores
        this.updateScores();
        this.updateProgress();
    }
    
    displayQuestion() {
        const question = this.questions[this.gameState.currentQuestionIndex];
        
        // Update question text
        document.getElementById('question-text').textContent = question.q;
        
        // Update question counter
        document.getElementById('current-question').textContent = this.gameState.currentQuestionIndex + 1;
        
        // Update current player indicator
        const currentPlayerName = this.gameState.currentPlayer === 1 ? 
            this.gameState.player1.name : this.gameState.player2.name;
        document.getElementById('current-player-indicator').textContent = `${currentPlayerName}'s Turn`;
        
        // Create choice buttons
        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = '';
        
        question.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice';
            button.textContent = choice;
            button.addEventListener('click', () => this.answerQuestion(index));
            choicesContainer.appendChild(button);
        });
        
        // Reset timer
        this.gameState.timeRemaining = 30;
        this.gameState.hasAnswered = false;
        document.getElementById('next-question').classList.add('hidden');
    }
    
    startTimer() {
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.gameState.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.gameState.timeRemaining <= 0) {
                this.timeUp();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const timerText = document.getElementById('timer-text');
        const timerProgress = document.getElementById('timer-progress');
        
        timerText.textContent = this.gameState.timeRemaining;
        
        // Calculate progress (283 is the circumference of the circle)
        const progress = (this.gameState.timeRemaining / 30) * 283;
        timerProgress.style.strokeDashoffset = 283 - progress;
        
        // Change color based on time remaining
        if (this.gameState.timeRemaining <= 5) {
            timerProgress.style.stroke = '#DC2626'; // Red
        } else if (this.gameState.timeRemaining <= 10) {
            timerProgress.style.stroke = '#EA580C'; // Orange
        } else {
            timerProgress.style.stroke = '#DC2626'; // Primary red
        }
    }
    
    answerQuestion(answerIndex) {
        if (this.gameState.hasAnswered) return;
        
        this.gameState.hasAnswered = true;
        clearInterval(this.timerInterval);
        clearTimeout(this.aiTimeout);
        
        const question = this.questions[this.gameState.currentQuestionIndex];
        const isCorrect = answerIndex === question.answer;
        const currentPlayer = this.gameState.currentPlayer === 1 ? 'player1' : 'player2';
        
        // Update player stats
        if (isCorrect) {
            this.gameState[currentPlayer].score++;
            this.gameState[currentPlayer].correctAnswers++;
        } else {
            this.gameState[currentPlayer].wrongAnswers.push({
                question: question.q,
                userAnswer: question.choices[answerIndex],
                correctAnswer: question.choices[question.answer]
            });
        }
        
        // Show correct/wrong answers
        const choices = document.querySelectorAll('.choice');
        choices.forEach((choice, index) => {
            choice.classList.add('disabled');
            if (index === question.answer) {
                choice.classList.add('correct');
            } else if (index === answerIndex && !isCorrect) {
                choice.classList.add('wrong');
            }
        });
        
        // Update scores and show next button
        this.updateScores();
        document.getElementById('next-question').classList.remove('hidden');
        
        // Play sound feedback
        this.playFeedbackSound(isCorrect);
    }
    
    timeUp() {
        if (this.gameState.hasAnswered) return;
        
        this.gameState.hasAnswered = true;
        clearInterval(this.timerInterval);
        clearTimeout(this.aiTimeout);
        
        const question = this.questions[this.gameState.currentQuestionIndex];
        const currentPlayer = this.gameState.currentPlayer === 1 ? 'player1' : 'player2';
        
        // Add as wrong answer
        this.gameState[currentPlayer].wrongAnswers.push({
            question: question.q,
            userAnswer: "Time ran out",
            correctAnswer: question.choices[question.answer]
        });
        
        // Show correct answer
        const choices = document.querySelectorAll('.choice');
        choices.forEach((choice, index) => {
            choice.classList.add('disabled');
            if (index === question.answer) {
                choice.classList.add('correct');
            }
        });
        
        document.getElementById('next-question').classList.remove('hidden');
        this.playFeedbackSound(false);
    }
    
    nextQuestion() {
        this.gameState.currentQuestionIndex++;
        
        if (this.gameState.currentQuestionIndex >= this.gameState.totalQuestions) {
            this.endGame();
            return;
        }
        
        // Switch player
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        
        this.updateProgress();
        this.displayQuestion();
        this.startTimer();
        
        // Handle AI turn for single player
        if (this.gameState.isSinglePlayer && this.gameState.currentPlayer === 2) {
            this.handleAITurn();
        }
    }
    
    handleAITurn() {
        // AI takes 2-5 seconds to answer
        const delay = Math.random() * 3000 + 2000;
        
        this.aiTimeout = setTimeout(() => {
            if (this.gameState.hasAnswered) return;
            
            const question = this.questions[this.gameState.currentQuestionIndex];
            
            // AI has 75% chance to get it right
            const isAICorrect = Math.random() < 0.75;
            let aiAnswer;
            
            if (isAICorrect) {
                aiAnswer = question.answer;
            } else {
                // Choose a random wrong answer
                const wrongAnswers = [0, 1, 2, 3].filter(i => i !== question.answer);
                aiAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
            }
            
            this.answerQuestion(aiAnswer);
        }, delay);
    }
    
    updateScores() {
        // Update score displays
        document.getElementById('player1-score').textContent = this.gameState.player1.score;
        document.getElementById('player2-score').textContent = this.gameState.player2.score;
        
        // Update progress rings
        const player1Progress = (this.gameState.player1.score / this.gameState.totalQuestions) * 176;
        const player2Progress = (this.gameState.player2.score / this.gameState.totalQuestions) * 176;
        
        document.getElementById('player1-progress').style.strokeDashoffset = 176 - player1Progress;
        document.getElementById('player2-progress').style.strokeDashoffset = 176 - player2Progress;
    }
    
    updateProgress() {
        const progressPercentage = ((this.gameState.currentQuestionIndex + 1) / this.gameState.totalQuestions) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercentage}%`;
    }
    
    endGame() {
        this.gameState.isGameComplete = true;
        this.showScreen('result-screen');
        this.displayResults();
    }
    
    displayResults() {
        const winner = this.getWinner();
        
        // Update result title
        if (winner) {
            document.getElementById('result-title').textContent = `${winner.name} Wins!`;
            document.getElementById('result-subtitle').textContent = 'Congratulations!';
        } else {
            document.getElementById('result-title').textContent = "It's a Tie!";
            document.getElementById('result-subtitle').textContent = 'Great game!';
        }
        
        // Update final scores
        document.getElementById('final-player1-name').textContent = this.gameState.player1.name;
        document.getElementById('final-player1-score').textContent = this.gameState.player1.score;
        document.getElementById('final-player1-accuracy').textContent = 
            `${this.calculateAccuracy(this.gameState.player1)}% Accuracy`;
        
        document.getElementById('final-player2-name').textContent = this.gameState.player2.name;
        document.getElementById('final-player2-score').textContent = this.gameState.player2.score;
        document.getElementById('final-player2-accuracy').textContent = 
            `${this.calculateAccuracy(this.gameState.player2)}% Accuracy`;
        
        // Save to local storage
        this.saveGameToLocalStorage();
    }
    
    getWinner() {
        if (this.gameState.player1.score > this.gameState.player2.score) return this.gameState.player1;
        if (this.gameState.player2.score > this.gameState.player1.score) return this.gameState.player2;
        return null; // Tie
    }
    
    calculateAccuracy(player) {
        const totalAnswered = player.correctAnswers + player.wrongAnswers.length;
        return totalAnswered === 0 ? 0 : Math.round((player.correctAnswers / totalAnswered) * 100);
    }
    
    resetGame() {
        // Clear any running timers
        clearInterval(this.timerInterval);
        clearTimeout(this.aiTimeout);
        
        // Reset form
        document.getElementById('player1-name').value = '';
        document.getElementById('player2-name').value = '';
        
        // Show start screen
        this.showScreen('start-screen');
        this.validateInputs();
    }
    
    shareResult() {
        const winner = this.getWinner();
        const resultText = winner ? 
            `🏆 ${winner.name} won the Knowledge Challenge quiz with ${winner.score}/${this.gameState.totalQuestions} points!` :
            `🤝 Tie game in Knowledge Challenge quiz! Both players scored ${this.gameState.player1.score}/${this.gameState.totalQuestions} points!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Knowledge Challenge Quiz Result',
                text: resultText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(resultText).then(() => {
                alert('Result copied to clipboard!');
            });
        }
    }
    
    saveGameToLocalStorage() {
        const gameHistory = JSON.parse(localStorage.getItem('quizGameHistory') || '[]');
        const gameRecord = {
            id: Date.now(),
            date: new Date().toISOString(),
            player1: this.gameState.player1,
            player2: this.gameState.player2,
            winner: this.getWinner(),
            isSinglePlayer: this.gameState.isSinglePlayer
        };
        gameHistory.unshift(gameRecord);
        
        // Keep only last 10 games
        if (gameHistory.length > 10) {
            gameHistory.splice(10);
        }
        
        localStorage.setItem('quizGameHistory', JSON.stringify(gameHistory));
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
        
        // Show target screen
        document.getElementById(screenId).classList.remove('hidden');
    }
    
    playFeedbackSound(isCorrect) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (isCorrect) {
                // Success sound
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
            } else {
                // Error sound
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1);
            }
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Silently fail if audio context is not available
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizGame();
});