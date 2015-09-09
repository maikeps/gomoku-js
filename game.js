var GRID_SIZE = 15;
var SEQUENCE_SIZE = 5;
var CELL_SIZE = 50;
var BOARD_HEIGHT = GRID_SIZE * CELL_SIZE;
var BOARD_WIDTH = GRID_SIZE * CELL_SIZE;
var SCREEN_HEIGHT = BOARD_HEIGHT + CELL_SIZE;
var SCREEN_WIDTH = BOARD_WIDTH + CELL_SIZE;
var INFINITY = 4294967295;


/*
 * CLASS SEQUENCE
 */
function Sequence(pieces, obstacles){
	this.pieces = pieces;
	this.obstacles = obstacles;
	this.direction = findDirection(); //ENUM
	this.size = getSize();
	this.weight = getWeight();
}

Sequence.prototype.findDirection = function(){
	
}

Sequence.prototype.getSize = function(){
	
}

Sequence.prototype.getWeight = function(){
	
}

/*
 * CLASS NODE
 */

function Node(info){
	this.info = info;
	this.weight = 0;
	this.neighbours = {};
	this.x = -1;
	this.y = -1;
}

Node.prototype.setWeight = function(weight){
	this.weight = weight;
}

Node.prototype.setPos = function(x, y){
	this.x = x;
	this.y = y;
}

Node.prototype.addNeighbour = function(node, distance){
	this.neighbours[node.id] = {
		node: node, 
		distance: distance
	};
}


/*
 * CLASS GRAPH
 */
function Graph(){
	this.nodes = {};
	this.nodeCount = 0;
}

Graph.prototype.addNode = function(node){
	node.id = this.nodeCount++;
	this.nodes[node.id] = node;
}

Graph.prototype.connect = function(node1, node2, distance){
	node1.addNeighbour(node2, distance || 1);
}

Graph.prototype.getNodeByWeight = function(weight){
	for(var key in this.nodes){
		var node = this.nodes[key];

		if(node.getWeight() == weight){
			return node;
		}
	}
}


/*
 * CLASS GomokuAI
 */
function GomokuAI(player_number, color){
	this.player_number = player_number;
	this.color = color;
}

GomokuAI.prototype.play = function(){
	// var grid_x = Math.floor(Math.random() * (GRID_SIZE));
	// var grid_y = Math.floor(Math.random() * (GRID_SIZE));
	
	// while(this.game.grid[grid_y][grid_x] != 0){
	// 	var grid_x = Math.floor(Math.random() * (GRID_SIZE));
	// 	var grid_y = Math.floor(Math.random() * (GRID_SIZE));		
	// }

	// var graph = this.buildPossibilitiesGraph(game.grid);
	// var node = graph.getNodeByWeight(this.minMax(this.game.grid))
	var choice = this.minMax(game.grid, 2, true);
	console.log(choice);
	var x = choice[1][0];
	var y = choice[1][1];
	this.game.play(x, y);
}

GomokuAI.prototype.copyGrid = function(grid){
	var copy = [];
	for(var i = 0; i < grid.length; i++){
		copy.push(grid[i].slice());
		// var line = [];
		// for(var j = 0; j < grid[i].length; j++){
		// 	line.push(grid[i][j]);
		// }
		// copy.push(line);
	}
	return copy;
}

GomokuAI.prototype.minMax = function(grid_state, depth, max){
	if(depth == 0){//TODO
		return [this.utility(grid_state), [-1,-1]];
	}
	graph = this.buildPossibilitiesGraph(grid_state);
	
	root = graph.nodes[0];
	if(max){
		var maxValue = -INFINITY;
		var x = -1;
		var y = -1;
		for(var key in root.neighbours){
			var node = root.neighbours[key].node;
			var value = this.minMax(node.info, depth-1, false)[0];
			
			//node.setWeight(value)
			if(value > maxValue){
				maxValue = value;
				x = node.x;
				y = node.y;
			}
		}
		return [maxValue, [x, y]];
	}else{
		var minValue = INFINITY;
		var x = -1;
		var y = -1;
		for(var key in root.neighbours){
			var node = root.neighbours[key].node;
			var value = this.minMax(node.info, depth-1, true)[0];
			
		//	node.setWeight(value)
			if(value < minValue){
				minValue = value;
				x = node.x;
				y = node.y;
			}
		}
		console.log(x, y);
		return [maxValue, [x, y]];
	}
}

GomokuAI.prototype.utility = function(grid_state){
	/*
	 *
	 * This should determine how close to victory the AI is
	 *
	 * Points to note:
	 *
	 * -Amount of possible sequences, including sequential and sparse stones
	 * -Amount of rounds played
	 * 
	 * It is important also that the AI thinks not only in winning
	 * but in not losing
	 * e.g. try to break the oponent's sequence after getting close to the objective sequence
	 * 
	 * Also, it is important that the AI tries not to play next to the border of the board
	 * to make more difficult for the opponent to make a counter play and to give more
	 * possibilities to make asequence
	 *
	 */
	
	var playerSeq = this.findSequences(grid_state, this.player_number);
	var playerValue = this.evaluateSequences(playerSeq);

	var oponentSeq = this.findSequences(grid_state, (this.player_number % 2) + 1);
	var oponentValue = this.evaluateSequences(oponentSeq);

	return playerValue - oponentValue;

}

GomokuAI.prototype.findSequences = function(grid_state, player_number, oponent_number){
	var sequences = [];	

	var visited_grid = function(){
		var visited = [];
		
		for(var i = 0; i < grid_state.length; i++){
			var line = [];
			for(var j = 0; j < grid_state[i].length; j++){
				line.push(0);;
			}
			visited.push(line);
		}
		return visited;
	}

	// getCell(x, y)
	// J = X
	// I = Y

	//  -
	for(var i = 0; i < grid_state.length; i++){
		for(var j = 0; j < grid_state[i].length; j++){
			if(grid_state[i][j] == player_number){
				var sequence = [[i, j]];
				for(var k = 1; k < SEQUENCE_SIZE; k++){
					var next = this.game.getCell(j+k, i);
					if(next != player_number){
						j = j+k;
						break;
					}
					sequence.push([i,j+k]);
				}
				sequences.push(sequence);
				j = j+sequence.length-1;
			}
		}
	}	

	// |
	var visited = visited_grid();
	for(var i = 0; i < grid_state.length; i++){
		for(var j = 0; j < grid_state[i].length; j++){
			if(grid_state[i][j] == player_number && visited[i][j] == 0){
				var sequence = [[i, j]];
				visited[i][j] = 1;
				for(var k = 1; k < SEQUENCE_SIZE; k++){
					var next = this.game.getCell(j, i+k);
					if(next != player_number){
						// i = i+k;
						break;
					}
					sequence.push([i+k, j]);
					visited[i+k][j] = 1;
				}
				sequences.push(sequence);
			}
		}
	}	

	// /
	var visited = visited_grid();
	for(var i = 0; i < grid_state.length; i++){
		for(var j = 0; j < grid_state[i].length; j++){
			if(grid_state[i][j] == player_number && visited[i][j] == 0){
				var sequence = [[i, j]];
				visited[i][j] = 1;
				for(var k = 1; k < SEQUENCE_SIZE; k++){
					var next = this.game.getCell(j-k, i+k);
					if(next != player_number){
						break;
					}
					sequence.push([i+k, j-k]);
					visited[i+k][j-k] = 1;
				}
				sequences.push(sequence);
			}
		}
	}

	// \
	var visited = visited_grid();
	for(var i = 0; i < grid_state.length; i++){
		for(var j = 0; j < grid_state[i].length; j++){
			if(grid_state[i][j] == player_number && visited[i][j] == 0){
				var sequence = [[i, j]];
				visited[i][j] = 1;
				for(var k = 1; k < SEQUENCE_SIZE; k++){
					var next = this.game.getCell(j+k, i+k);
					if(next != player_number){
						break;
					}
					sequence.push([i+k, j+k]);
					visited[i+k][j+k] = 1;
				}
				sequences.push(sequence);
			}
		}
	}

	return sequences;
}

GomokuAI.prototype.evaluateSequences = function(sequences){
	var sum = 0;
	for(var i = 0; i < sequences.length; i++){
		var sequence = sequences[i];
		var value = Math.pow(2, sequence.length*2);
		sum += value;
	}
	return sum;
}

GomokuAI.prototype.buildPossibilitiesGraph = function(grid_state){	
	var graph = new Graph();
	var root = new Node(this.copyGrid(grid_state));
	graph.addNode(root);

	var grid_aux = this.copyGrid(grid_state);
	for(var i = 0; i < grid_state.length; i++){
		for(var j = 0; j < grid_state[i].length; j++){
			if(grid_state[i][j] == 0){
				grid_aux[i][j] = this.player_number;
				var node = new Node(grid_aux);
				node.setPos(j, i);
				graph.addNode(node);
				graph.connect(root, node);
			}
			grid_aux = this.copyGrid(grid_state);
		}
	}

	return graph;
}

GomokuAI.prototype.setGame = function(game){
	this.game = game;
}


/*
 * CLASS GomokuPlayer
 */
function GomokuPlayer(player_number, color){
	this.player_number = player_number;
	this.color = color;
}

GomokuPlayer.prototype.play = function(grid_x, grid_y){
	this.game.play(grid_x, grid_y);
}

GomokuPlayer.prototype.setGame = function(game){
	this.game = game;
}



/*
 * CLASS Game
 */
function Game(grid_size, sequence_size, player1, player2){
	this.grid_size = grid_size;
	this.grid = this.buildGrid();
	this.turn = "white";
	this.sequence_size = sequence_size;
	// this.ai = new GomokuAI(this, 2);
	this.player1 = player1;
	this.player2 = player2;

	this.currentPlayer = player1;

	this.gameover = false;
}

Game.prototype.debug = function(){
	var debug = ""
	for(var i = 0; i < this.grid[0].length; i++){
		var line = "";
		for(var j = 0; j < this.grid.length; j++){
			line += this.grid[i][j] + " "
		}
		debug += line + "\n"
	}
	console.log(debug)
}

Game.prototype.buildGrid = function(){
	var grid = [];
	for(var i = 0; i < this.grid_size; i++){
		var line = [];
		for(var j = 0; j < this.grid_size; j++){
			line.push(0); 
		}
		grid.push(line);
	}
	return grid;
}

Game.prototype.click = function(x, y){
	if(x < 0 || x > BOARD_WIDTH || y < 0 || y > BOARD_HEIGHT || this.gameover || this.currentPlayer instanceof GomokuAI) return;

	var grid_x = Math.floor((x - CELL_SIZE/2) / CELL_SIZE);
	var grid_y = Math.floor((y - CELL_SIZE/2) / CELL_SIZE);
	this.currentPlayer.play(grid_x, grid_y);
}

Game.prototype.play = function(grid_x, grid_y){
	if(this.grid[grid_y][grid_x] == 0){
		this.grid[grid_y][grid_x] = this.currentPlayer.player_number;
		if(this.currentPlayer == this.player1){
			this.currentPlayer = this.player2;
		}else{
			this.currentPlayer = this.player1;
		}

		this.gameover = (this.checkVictory() != undefined);

		this.updateSequences(grid_y, grid_x);
	}
}

Game.prototype.updateSequences = function(i, j){
	var sequence = [(i,j)];

	
	
	for(var i = 0; i < this.sequences; i++){
		var sequence_cmp = this.sequences[i];

	}
}

Game.prototype.checkVictory = function(){
	var cont1 = 0;
	var cont2 = 0;
	
	//line
	for(var i = 0; i < this.grid_size; i++){
		for(var j = 0; j < this.grid_size; j++){
			if(this.grid[i][j] == 1){
				cont1++;
				cont2 = 0;
			}else if(this.grid[i][j] == 2){
				cont1 = 0;
				cont2++;
			} else{
				cont1 = 0;
				cont2 = 0;
			}
			if(cont1 == this.sequence_size){
				return "white";
			} else if(cont2 == this.sequence_size){
				return "black";
			}
		}
		cont1 = 0;
		cont2 = 0;
	}
	
	//column
	for(var i = 0; i < this.grid_size; i++){
		for(var j = 0; j < this.grid_size; j++){
			if(this.grid[j][i] == 1){
				cont1++;
				cont2 = 0;
			}else if(this.grid[j][i] == 2){
				cont1 = 0;
				cont2++;
			} else{
				cont1 = 0;
				cont2 = 0;
			}
			if(cont1 == this.sequence_size){
				return "white";
			} else if(cont2 == this.sequence_size){
				return "black";
			}
		}
		cont1 = 0;
		cont2 = 0;
	}
	
	// "\"
	for(var i = 0; i < this.grid_size; i++){
		for(var j = 0; j < this.grid_size; j++){
			//Down Right
			for(var k = 0; k < this.sequence_size; k++){
				var next = this.getCell(j+k, i+k);
				if(next == -1 || next == 0){
					cont1 = 0;
					cont2 = 0;
				}else if(next == 1){
					cont1++;
					cont2 = 0;
				}else{
					cont2++;
					cont1 = 0;
				}
			}
			if(cont1 == this.sequence_size){
				return "white";
			} else if(cont2 == this.sequence_size){
				return "black";
			}

			cont1 = 0;
			cont2 = 0;

			//Up Left
			for(var k = 0; k < this.sequence_size; k++){
				var next = this.getCell(j-k, i-k);
				if(next == -1 || next == 0){
					cont1 = 0;
					cont2 = 0;
				}else if(next == 1){
					cont1++;
					cont2 = 0;
				}else{
					cont2++;
					cont1 = 0;
				}
			}
			if(cont1 == this.sequence_size){
				return "white";
			} else if(cont2 == this.sequence_size){
				return "black";
			}

			cont1 = 0;
			cont2 = 0;
		}
	}

	// "/"
	for(var i = 0; i < this.grid_size; i++){
		for(var j = 0; j < this.grid_size; j++){
			//Down Left
			for(var k = 0; k < this.sequence_size; k++){
				var next = this.getCell(j-k, i+k);
				if(next == -1 || next == 0){
					cont1 = 0;
					cont2 = 0;
				}else if(next == 1){
					cont1++;
					cont2 = 0;
				}else{
					cont2++;
					cont1 = 0;
				}
			}
			if(cont1 == this.sequence_size){
				return "white";
			} else if(cont2 == this.sequence_size){
				return "black";
			}

			cont1 = 0;
			cont2 = 0;

			//Up Right
			for(var k = 0; k < this.sequence_size; k++){
				var next = this.getCell(j+k, i-k);
				if(next == -1 || next == 0){
					cont1 = 0;
					cont2 = 0;
				}else if(next == 1){
					cont1++;
					cont2 = 0;
				}else{
					cont2++;
					cont1 = 0;
				}
			}
			if(cont1 == this.sequence_size){
				return "white";
			} else if(cont2 == this.sequence_size){
				return "black";
			}

			cont1 = 0;
			cont2 = 0;
		}
	}
}

Game.prototype.getCell = function(x, y){
	if(x < 0 || y < 0 || x > this.grid_size-1 || y > this.grid_size-1) return -1;
	return this.grid[y][x];
}

Game.prototype.update = function(){
	if(!this.gameover && this.currentPlayer instanceof GomokuAI){
		this.currentPlayer.play();
	}
}

Game.prototype.setPlayers = function(player1, player2){
	this.player1 = player1;
	this.player2 = player2;
}


/*
 * CLASS Renderer
 */
function Renderer(game){
	this.game = game;
	this.canvas = document.getElementById("canvas");
	this.ctx = canvas.getContext("2d");
	canvas.width = BOARD_WIDTH + CELL_SIZE + BOARD_WIDTH /4;
	canvas.height = BOARD_HEIGHT + CELL_SIZE;
}

Renderer.prototype.render = function(){
	this.ctx.fillStyle = "#77BD77";
	this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	var grid = this.game.grid;
	var offsetx = CELL_SIZE;
	var offsety = CELL_SIZE;
	
	for(var i = 1; i < GRID_SIZE + 1; i++){
		this.drawLine(i*CELL_SIZE, offsety, i*CELL_SIZE, BOARD_HEIGHT, "black", 1);
	}
	for(var i = 1; i < GRID_SIZE + 1; i++){
		this.drawLine(offsetx, i*CELL_SIZE, BOARD_WIDTH, i*CELL_SIZE, "black", 1);
	}


	for(var i = 0; i < grid.length; i++){
		for(var j = 0; j < grid[i].length; j++){
			if(grid[i][j] == 1){
				this.ctx.fillStyle = "white";
				this.fillOval(j*CELL_SIZE+1 + CELL_SIZE/2, i*CELL_SIZE+1 + CELL_SIZE/2, CELL_SIZE-2);
			}else if(grid[i][j] == 2){
				this.ctx.fillStyle = "black";
				this.fillOval(j*CELL_SIZE+1 + CELL_SIZE/2, i*CELL_SIZE+1 + CELL_SIZE/2, CELL_SIZE-2);
			}
		}
	}

}

Renderer.prototype.fillOval = function(center_x, center_y, diameter){
	this.ctx.save();
	this.ctx.beginPath();
	this.ctx.arc(center_x+diameter/2, center_y+diameter/2, diameter/2, 0, 2*Math.PI);
	this.ctx.fill();
}

Renderer.prototype.drawLine = function(startx, starty, endx, endy, color, line_width){
	this.ctx.strokeStyle = color;
	this.ctx.lineWidth = line_width;
	this.ctx.beginPath();
	this.ctx.moveTo(startx, starty);
	this.ctx.lineTo(endx, endy);
	this.ctx.stroke();
}



// Stuff


var ai1 = new GomokuAI(1, "white");
var ai2 = new GomokuAI(2, "black");
var player1 = new GomokuPlayer(1, "white");
var player2 = new GomokuPlayer(2, "black");
var game = new Game(GRID_SIZE, SEQUENCE_SIZE, player1, ai2);

this.ai1.setGame(game);
this.ai2.setGame(game);
this.player1.setGame(game);
this.player2.setGame(game);

var renderer = new Renderer(game);

document.addEventListener('mousedown', function(e){
	var x = e.pageX - renderer.canvas.offsetLeft;
	var y = e.pageY - renderer.canvas.offsetTop;

	game.click(x, y);
}, false);

setInterval(function(){
	renderer.render();
	game.update();
	if(game.gameover){
		console.log(game.checkVictory());
	}
}, 100);