'use strict'

var gState = {
	isGameOn: false,
	shownCellsCount: 0,
	markedCellsCount: 0,
	clockStarted: false,
	secsPassed: 0.0,
	timeInterval: null
};
var gLevels = [
	{ name: 'Beginner', size: 4, mines: 2 },
	{ name: 'Medium', size: 6, mines: 5 },
	{ name: 'Expert', size: 8, mines: 15 },
];
var gCurrLevelIdx = 1;
var gBoard = [];


var IMGNORMAL = 'img/smiley-normal.png';
var IMGLOST = 'img/smiley-sad.png';
var IMGWIN = 'img/smiley-happy.png';



// Initialize the game
function init() {
	renderLevels();
	setLevel(2);
	renderBestScores();
}

/****************************** LEVELS ******************************/

// Print available levels on screen
function renderLevels() {
	var strHTML = '';
	for (var i = 0; i < gLevels.length; i++) {
		strHTML += '<button class="btn btn-level" onmousedown="setLevel(' + i + ')">' + gLevels[i].name + '</button>\n';
	}

	var elLevels = document.querySelector('#levels');
	elLevels.innerHTML = strHTML;
}

// Update the current level and render the new board
function setLevel(level) {
	gCurrLevelIdx = level;

	gBoard = buildBoard();
	renderBoard(gBoard);

	stopClock();
	resetClock();
	restartGame();
	renderMarkedCellCount();
}

/****************************** BEST TIME ******************************/

// Get level best time
function getLevelBestTime(level) {
	var levelBestTime = localStorage.getItem('Level[' + level + ']BestTime')
	return (levelBestTime) ? levelBestTime : 99.9;
}

// Set level best time
function setLevelBestTime(level, time) {
	localStorage.setItem('Level[' + level + ']BestTime', time);
}

// Print the current level best time on screen
function renderLevelBestTime(level) {
	var elLevelBestScores = document.querySelector('#scores .level-' + level + ' span');
	elLevelBestScores.innerText = getLevelBestTime(level);;
}

// Check Whether the game finished faster than the current level best time
function checkBestTime() {
	var elGameTime = document.querySelector('.game-time');
	var levelBestTime = getLevelBestTime(gCurrLevelIdx);
	var gameTime = elGameTime.innerText;

	// If the game was finished faster then the current level best time
	if (levelBestTime > gameTime) {

		// Set new level best time
		setLevelBestTime(gCurrLevelIdx, gameTime);

		// Update level best time on screen
		renderLevelBestTime(gCurrLevelIdx);
	}
}

// Print the best scores for each level
function renderBestScores() {
	var strHTML = '';
	for (var i = 0; i < gLevels.length; i++) {
		strHTML += '<li class="level-' + i + '"><strong>' + gLevels[i].name + '</strong>\t<span>' + getLevelBestTime(i) + '</span></button>\n';
	}

	var elLevelBestScores = document.querySelector('#scores ul');
	elLevelBestScores.innerHTML = strHTML;
}

/****************************** BOARD ******************************/

// Create a blank board based on level size
function buildBoard() {
	var board = [];
	var size = gLevels[gCurrLevelIdx].size;
	for (var i = 0; i < size; i++) {
		board.push([]);
		for (var j = 0; j < size; j++) {
			board[i][j] = { bombsAroundCount: 0, isShown: false, isBomb: false, isMarked: false };
		}
	}
	return board;
}

// Set random mines
function setRandomMines(board, exclude) {
	var level = gLevels[gCurrLevelIdx];
	var availableMines = level.mines;
	while (availableMines > 0) {
		var randRow = getRandomNumber(level.size);
		var randCol = getRandomNumber(level.size);

		// Check whether the cell is excluded
		if (board[randRow][randCol] === board[exclude.row][exclude.col]) continue;

		// Check whether the cell doesn't already have a mine
		if (board[randRow][randCol].isBomb === true) continue;

		// Set the cell as a mine
		board[randRow][randCol].isBomb = true;
		availableMines--;

		// Update mines-count for neighboring cells
		board = setMinesNbrsCount(board, randRow, randCol);
	}
	return board;
}

// Update mines-count for the neighboring of a specific cell
function setMinesNbrsCount(board, row, col) {
	for (var i = row - 1; i <= row + 1; i++) {

		// Check if the cell outside the board
		if (i < 0 || i > board.length - 1) continue;

		for (var j = col - 1; j <= col + 1; j++) {

			// Check if the cell outside the board
			if (j < 0 || j > board[0].length - 1) continue;

			// Check if its not the cell itself
			if (i === row && j === col) continue;

			// Check if the cell is not a mine
			if (board[i][j].isBomb) continue;

			// Update cell neighboring mines count
			board[i][j].bombsAroundCount++;
		}

	}
	return board;
}

// Print the table on screen
function renderBoard(board) {
	var strHTML = '';
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>\n';
		for (var j = 0; j < board[0].length; j++) {

			// Cell defaults
			var imgName = 'cell.png';

			if (board[i][j].isShown) { // Display shown cells

				if (board[i][j].isBomb) {
					// If selected a cell with mines display the mine with a red bg
					imgName = 'lost.png';
				} else if (board[i][j].bombsAroundCount > 0) {
					// if selected an empty cell display cell's neighboring mines count
					imgName = board[i][j].bombsAroundCount + '.png';
				} else {
					// Otherwise display an empty cell without any neighboring mines
					imgName = '0.png';
				}

			} else if (board[i][j].isMarked) { // Display marked cells

				if (isGameOver() && !board[i][j].isBomb) {
					// If game over display wrong marked cells
					imgName = 'wrong-mark.png';
				} else {
					// If game is on display marked cells
					imgName = 'marked.png';
				}

			} else if (isGameOver()) { // Display not shown cells

				if (board[i][j].isBomb) {
					// If game over display wrong marked cells
					imgName = 'mine.png';
				}

			}

			strHTML += '\t<td onmousedown="cellClicked(event, this, ' + i + ', ' + j + ')"><img src="img/' + imgName + '"></td>\n';
		}
		strHTML += '</tr>\n';
	}

	var elBoard = document.querySelector('#board tbody');
	elBoard.innerHTML = strHTML;
}

/****************************** CELLS ******************************/

// Set cell as shown
function setCellAsShown(row, col) {
	if (gBoard[row][col].isShown) return;
	gBoard[row][col].isShown = true;
	gState.shownCellsCount++;
}

// Set cell as suspected to have a mine
function setCellAsMarked(elCell, row, col) {
	gState.markedCellsCount = (gBoard[row][col].isMarked) ? gState.markedCellsCount - 1 : gState.markedCellsCount + 1;
	gBoard[row][col].isMarked = !gBoard[row][col].isMarked;
	renderMarkedCellCount();
}

// Set cell as suspected to have a mine
function renderMarkedCellCount() {
	var elLevelBestScores = document.querySelector('.flags-left');
	elLevelBestScores.innerHTML = gLevels[ gCurrLevelIdx ].mines - gState.markedCellsCount;
}

// Process clicked cell

// CR: to much comments. the code is written in simple manner and readable, 
// most of the comment only make the code dirty and harder to read. 
function cellClicked(ev, elCell, row, col) {

	// If the clock is not started, set random mines
	if (!gState.clockStarted) {
		gBoard = setRandomMines(gBoard, { row: row, col: col });
		gState.clockStarted = true;
		startClock()
	}

	// Bail if the game is over
	if (isGameOver()) return;

	// Bail if the cell is already shown
	if (gBoard[row][col].isShown) return;

	if (ev.which === 3) {

		// Mark the cell
		setCellAsMarked(elCell, row, col);

	} else if (ev.which === 1) {

		// Bail if the cell is marked
		if (gBoard[row][col].isMarked) return;

		// If a mine was selected end the game
		if (gBoard[row][col].isBomb) endGame();

		// Mark cell as shown
		setCellAsShown(row, col);

		// Check if cell is empty to expand his other empty neighbors
		if (gBoard[row][col].bombsAroundCount === 0) expandEmptyNbrs(row, col, []);

	}

	// End game if no more cells left
	if (gState.shownCellsCount + gState.markedCellsCount === gLevels[gCurrLevelIdx].size ** 2) endGame();

	renderBoard(gBoard);
}

// CR: like the checkedCells parameter.
// Expand neighboring cells when clicking an empty cell using a recursive function
function expandEmptyNbrs(row, col, checkedCells) {

	// Bail if cell already tested ()
	if (checkedCells.includes(row + '-' + col)) return;

	// Add this cell to the list of checked cells
	checkedCells.push(row + '-' + col)

	// Start checking the neighbors
	for (var i = row - 1; i <= row + 1; i++) {

		// Check if the cell outside the board
		if (i < 0 || i >= gBoard.length) continue;

		for (var j = col - 1; j <= col + 1; j++) {

			// Check if the cell outside the board
			if (j < 0 || j >= gBoard[0].length) continue;

			// Check if its not the cell itself
			if (i === row && j === col) continue;

			// Check if the cell is not a mine
			if (gBoard[i][j].isBomb) continue;

			// Check if the cell is not marked
			if (gBoard[i][j].isMarked) continue;

			// Mark cell as shown
			setCellAsShown(i, j);

			if (isCellValidForNbrsCheck(i, j, checkedCells)) expandEmptyNbrs(i, j, checkedCells);
		}

	}
}

function isCellValidForNbrsCheck(row, col) {
	// Check if the cell outside the board
	if (row < 0 || row >= gBoard.length) return false;
	if (col < 0 || col >= gBoard[0].length) return false;

	// Check if the cell is not a mine
	if (gBoard[row][col].isBomb) return false;

	// Check if the cell is not marked
	if (gBoard[row][col].isMarked) return false;

	// Check if the cell is not marked
	if (gBoard[row][col].bombsAroundCount > 0) return false;

	return true;
}

/****************************** CLOCK ******************************/

// Start the clock
function startClock() {
	gState.secsPassed = Date.now();
	gState.timeInterval = setInterval(updateClock, 100);
}

// Stop the clock
function stopClock() {
	clearInterval(gState.timeInterval);
}

// Print updated clock on screen
function updateClock() {
	var elGameTime = document.querySelector('.game-time');
	elGameTime.innerText = ((Date.now() - gState.secsPassed) / 1000).toFixed(1);
}

// Reset the clock
function resetClock() {
	gState.secsPassed = 0.0;
	var elGameTime = document.querySelector('.game-time');
	elGameTime.innerText = gState.secsPassed;
}

/****************************** GAME UTILS ******************************/

// Start the game and reset the state
function restartGame() {
	gState = {
		isGameOn: true,
		shownCellsCount: 0,
		markedCellsCount: 0,
		clockStarted: false,
		secsPassed: 0.0,
		timeInterval: null
	}
	renderSmiley(IMGNORMAL);
}

// End the game
function endGame() {
	stopClock();
	gState.isGameOn = false;

	if (isVictory()) {
		checkBestTime();
		renderSmiley(IMGWIN);
	} else {
		renderSmiley(IMGLOST);
	}
}

// Check whether the game is over
function isGameOver() {
	return !gState.isGameOn;
}

// Check whether the user won the game
function isVictory() {
	var isVictory = true;
	for (var i = 0; isVictory && i < gBoard.length; i++) {
		for (var j = 0; isVictory && j < gBoard[0].length; j++) {
			if (gBoard[i][j].isMarked !== gBoard[i][j].isBomb) isVictory = false;
		}
	}
	return isVictory;
}

// Print smiley on screen
function renderSmiley(imgSrc) {
	var elImg = document.querySelector('.smiley img');
	elImg.src = imgSrc;
}

/****************************** GENERAL UTILS ******************************/

// Retrieve a random number
function getRandomNumber(max) {
	return Math.floor(Math.random() * max);
}