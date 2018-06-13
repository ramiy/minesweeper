'use strict';

// Use this function in the console to test level best time
function testFinishGame() {
	var elGameTime = document.querySelector('.game-time');
	elGameTime.innerText = (+getLevelBestTime(gCurrLevelIdx) - 0.1).toFixed(1);
	endGame();
	renderSmiley(IMGNORMAL);
}

// use this function to create a new board with mines around the first click only
function testCustomMines(board, exclude) {
	var row = exclude.row;
	var col = exclude.col;
	for (var i = row - 1; i <= row + 1; i++) {

		// Check if the cell outside the board
		if (i < 0 || i > board.length - 1) continue;

		for (var j = col - 1; j <= col + 1; j++) {

			// Check if the cell outside the board
			if (j < 0 || j > board[0].length - 1) continue;

			// Check if its not the cell itself
			if (i === row && j === col) continue;

			board[i][j].isBomb = true;
			board = setMinesNbrsCount(board, i, j);
		}

	}
	return board;
}