document.addEventListener('DOMContentLoaded', () => {
  const infoDisplay = document.querySelector('#info');
  const socket = io();

  let currPlayer = 'pink';
  let myColor = 'pink';
  let gameOver = false;
  const ROWS = 6;
  const COLS = 7;

  const connect4 = new Connect4('#connect4');

  const allCells = document.
  querySelectorAll(`div[data-col]`);

  const gameBoard = document.querySelector('#connect4');

  for (var i = 0; i < allCells.length; i++) {
    allCells[i].addEventListener("mouseenter", 
    handleMouseEnter);
    allCells[i].addEventListener("mouseleave", 
    handleMouseLeave);
    allCells[i].addEventListener("click", 
    handleClick);
  }

  function findLastEmptyCell(colNum) {
    for(let i = 5; i >=0; i--) {
      let cell = document.querySelector(`
      div[data-col='${colNum}'][data-row='${i}']`);
      if(cell.classList.contains("empty")) return cell;
    }
    return null;
  }

  function handleMouseEnter() {
    if(gameOver || currPlayer !== myColor) {
      this.classList.add("default");
      return;
    }
    const cell = findLastEmptyCell(
      this.getAttribute("data-col"));
    if(cell !== null) {
      cell.classList.add("next-" + currPlayer);
    }
  }

  function handleMouseLeave() {
    if(gameOver || currPlayer !== myColor) {
      this.classList.remove("default");
      return;
    }
    let colNum = this.getAttribute("data-col");
    let cells = document.querySelectorAll(
      `div[data-col='${colNum}']`);
    cells.forEach( (element) => { 
      element.classList.remove("next-" + currPlayer);
     });
  }

  function handleClick() {
    if(currPlayer === myColor && !gameOver) {
      const cell = findLastEmptyCell(this.
        getAttribute("data-col"));
      if(cell !== null) {
        // update div
        cell.classList.remove("empty");
        cell.classList.remove("next-" + currPlayer);
        cell.classList.add(currPlayer);

        let colNum = cell.getAttribute("data-col");
        let rowNum = cell.getAttribute("data-row");
        socket.emit('clicked', { rn: rowNum, cn: colNum } );

        // check winner
        let next = getCell(5, 1)
        console.log(next);
        console.log(next.classList.contains(currPlayer))
        const winner = checkForWinner(rowNum, colNum);
        console.log(winner);
        if (winner) {
          gameOver = true;
          alert(`Game Over! Player ${currPlayer} has won!`);
          socket.emit('gameOver');
        }

        // update player
        currPlayer = (currPlayer === 'pink')
          ? 'blue' : 'pink';
        $('#player').text(capitalizeFirstLetter(currPlayer));
        socket.emit('changeTurn');
      }
    }
  }

  function getCell(i, j) {
    return document.querySelector(`
    div[data-col='${j}'][data-row='${i}']`);
  }

  function checkDirection(direction, row, col) {
    console.log(direction)
    console.log("direction.i: " + direction.i)
    console.log("row: " + row)
    let total = 0;
    let i = Number(row) + Number(direction.i);
    let j = Number(col) + Number(direction.j);
    console.log("i is " + i)
    console.log("j is " +j)
    let next = getCell(i, j);
    console.log("next cel:")
    console.log(next);
    while (i >= 0 &&
      i < ROWS &&
      j >= 0 &&
      j < COLS && 
      next.classList.contains(currPlayer)
    ) {
      total++;
      i += Number(direction.i);
      j += Number(direction.j);
      next = getCell(i, j)
    }
    return total;
  }

  function checkWin(directionA, directionB, row, col) {
    console.log("been here")
    const total = 1 +
      checkDirection(directionA, row, col) +
      checkDirection(directionB, row, col);
      console.log(total);
    if (total >= 4) {
      return 1;
    } else {
      return null;
    }
  }

  function checkDiagonalTLtoBR(row, col) {
    return checkWin({i: -1, j: -1}, {i: 1, j: 1}, row, col);
  }

  function checkDiagonalBLtoTR(row, col){
    return checkWin({i: 1, j: -1}, {i: -1, j: 1}, row, col);
  }

  function checkVerticals(row, col) {
    return checkWin({i: -1, j: 0}, {i: 1, j: 0}, row, col);
  }

  function checkHorizontals(row, col) {
    return checkWin({i: 0, j: -1}, {i: 0, j: 1}, row, col);
  }

  function checkForWinner(row, col) {
    return checkVerticals(row, col) || 
      checkHorizontals(row, col) || 
      checkDiagonalBLtoTR(row, col) ||
      checkDiagonalTLtoBR(row, col);
  }

  function playerConnectedOrDisconnected(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .p_connection`).
      classList.toggle('green')
    restartGame();
    gameOver = false;
    currPlayer = 'pink';
    $('#player').text(capitalizeFirstLetter(currPlayer));
  }

  socket.on('player-number', num => {
    if(num === -1) {
        infoDisplay.innerHTML = `Sorry, 
        the server is full`
    }
    else {
        playerNum = parseInt(num);
        if(playerNum === 1) myColor = 'blue'
    }
  })

  socket.on('player-connection', num => {
      console.log(`Player number ${num} has
      connected or disconnected`)
      playerConnectedOrDisconnected(num);
  })

  socket.on('check-players', players => {
      players.forEach((p, i) => {
        if(p === 1) playerConnectedOrDisconnected(i)
      })
  })

  $('#restart').click(function() {
    restartGame();
    socket.emit('restart')
  })

  socket.on('restart', () => {
    restartGame();
    gameOver = false;
  })

  function restartGame() {
    gameOver = false;
    for (var i = 0; i < allCells.length; i++) {
      if(allCells[i].classList.contains('pink')) {
        allCells[i].classList.remove('pink')
      }
      else if(allCells[i].classList.contains('blue')) {
        allCells[i].classList.remove('blue')
      }
      if(allCells[i].classList.contains('next-pink')) {
        allCells[i].classList.remove('next-pink')
      }
      else if(allCells[i].classList.contains('next-blue')) {
        allCells[i].classList.remove('next-blue')
      }
      allCells[i].classList.add('empty')
    }
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  socket.on('gameOver', () => {
    gameOver = true;
    alert(`Game Over! Player ${currPlayer} has won!`);
  })

  socket.on('changeTurn', () => {
    currPlayer = (currPlayer === 'pink') 
      ? 'blue' : 'pink';
    $('#player').text(capitalizeFirstLetter(currPlayer));
  })

  socket.on('clicked', function(data) {
    var rowNum = data.rn;
    var colNum = data.cn;
    let cell = document.querySelector(`
      div[data-col='${colNum}'][data-row='${rowNum}']`);
    cell.classList.remove("empty");
    cell.classList.add(currPlayer);
  })
})