var GRID_SIZE = 15;
var SEQUENCE_SIZE = 5;
var CELL_SIZE = 50;
var BOARD_HEIGHT = GRID_SIZE * CELL_SIZE;
var BOARD_WIDTH = GRID_SIZE * CELL_SIZE;
var SCREEN_HEIGHT = BOARD_HEIGHT + CELL_SIZE;
var SCREEN_WIDTH = BOARD_WIDTH + CELL_SIZE;
var INFINITY = 4294967295;
var AI_DEPTH = 4;


/*
 * CLASS NODE
 */

function Node(info){
	this.info = info;
	this.weight = 0;
	this.neighbours = {};
	this.sorted_neighbours = [];
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

Node.prototype.sort_neighbours = function(){
	var sorted = [];
	for(var key in this.neighbours){
		var node = this.neighbours[key].node;
		sorted.push([node, node.weight]);
	}
	sorted.sort(function(a, b){
		return a[1] - b[1];
	});

	this.sorted_neighbours = sorted;
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

	this.possibilities = {};
}

GomokuAI.prototype.play = function(){
	var alpha = -INFINITY;
	var beta = INFINITY;
	var choice = this.pruningMiniMax(game.grid, AI_DEPTH, AI_DEPTH, true, alpha, beta);
	
	var x = choice[1];
	var y = choice[2];

	this.game.play(x, y);
}

GomokuAI.prototype.copyGrid = function(grid){
	var copy = [];
	for(var i = 0; i < grid.length; i++){
		copy.push(grid[i].slice());
	}
	return copy;
}

GomokuAI.prototype.pruningMiniMax = function(grid_state, initial_depth, depth, max, alpha, beta){

	if(depth == 0 || this.game.checkVictory(grid_state) != undefined){
		var value = 0;

		if(this.possibilities[grid_state] !== undefined){
			value = this.possibilities[grid_state];
		}else{
			value = this.utility(grid_state, this.game.rounds_played + initial_depth);
			this.possibilities[grid_state] = value;
		}

		return [value];
	}
		
	var graph = this.buildPossibilitiesGraph(grid_state, max, this.game.rounds_played + initial_depth-depth);
	var current_state = graph.nodes[0];
	var x = Math.floor(GRID_SIZE/2);
	var y = Math.floor(GRID_SIZE/2);

	current_state.sort_neighbours()
;
	if(max){

		for(var i = 0; i < current_state.sorted_neighbours.length; i++){
			var node = current_state.sorted_neighbours[i][0];
			var value = this.pruningMiniMax(node.info, initial_depth, depth-1, false, alpha, beta)[0];
			if(value > alpha){
				alpha = value;
			 	x = node.x;
			 	y = node.y;
			}
			if(alpha >= beta){
				return [alpha, node.x, node.y];
			}
		}
		return [alpha, x, y];

	}else{
		for(var i = 0; i < current_state.sorted_neighbours.length; i++){
			var node = current_state.sorted_neighbours[i][0];
			var value = this.pruningMiniMax(node.info, initial_depth, depth-1, true, alpha, beta)[0];

			if(value < beta){
				beta = value;
			 	x = node.x;
			 	y = node.y;
			}
			if(alpha <= beta){
				return [beta, node.x, node.y];
			}
		}
		return [beta, x, y];
	}
}

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

GomokuAI.prototype.utility = function(grid_state, rounds_played){
	var playerSeq = this.findSequences(grid_state, this.player_number);
	var playerValue = this.evaluateSequences(playerSeq, rounds_played);

	var oponentSeq = this.findSequences(grid_state, (this.player_number % 2) + 1);
	var oponentValue = this.evaluateSequences(oponentSeq, rounds_played);

	return playerValue - oponentValue;
}

GomokuAI.prototype.findSequences = function(grid_state, player_number, oponent_number){
	var sequences = [];	

	var visited_grid = function(){
		var visited = [];
		
		for(var i = 0; i < GRID_SIZE; i++){
			var line = [];
			for(var j = 0; j < GRID_SIZE; j++){
				line.push(0);
			}
			visited.push(line);
		}
		return visited;
	}

	// getCell(x, y)
	// J = X
	// I = Y

	//  -
	for(var i = 0; i < GRID_SIZE; i++){
		for(var j = 0; j < GRID_SIZE; j++){
			if(grid_state[i][j] == player_number){
				var sequence = [[i, j]];
				for(var k = 1; k <= SEQUENCE_SIZE; k++){
					var next = this.game.getCell(grid_state, j+k, i);
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


	var visited_col = visited_grid();
	var visited_diag1 = visited_grid();
	var visited_diag2 = visited_grid();
	for(var i = 0; i < GRID_SIZE; i++){
		for(var j = 0; j < GRID_SIZE; j++){
			// |
			if(grid_state[i][j] == player_number && visited_col[i][j] == 0){
				var sequence = [[i, j]];
				visited_col[i][j] = 1;
				for(var k = 1; k <= SEQUENCE_SIZE; k++){
					var next = this.game.getCell(grid_state, j, i+k);
					if(next != player_number){
						break;
					}
					sequence.push([i+k, j]);
					visited_col[i+k][j] = 1;
				}
				
				sequences.push(sequence);
			}

			// /
			if(grid_state[i][j] == player_number && visited_diag1[i][j] == 0){
				var sequence = [[i, j]];
				visited_diag1[i][j] = 1;
				for(var k = 1; k <= SEQUENCE_SIZE; k++){
					var next = this.game.getCell(grid_state, j-k, i+k);
					if(next != player_number){
						break;
					}
					sequence.push([i+k, j-k]);
					visited_diag1[i+k][j-k] = 1;
				}
				
				sequences.push(sequence);
			}

			// \
			if(grid_state[i][j] == player_number && visited_diag2[i][j] == 0){
				var sequence = [[i, j]];
				visited_diag2[i][j] = 1;
				for(var k = 1; k <= SEQUENCE_SIZE; k++){
					var next = this.game.getCell(grid_state, j+k, i+k);
					if(next != player_number){
						break;
					}
					sequence.push([i+k, j+k]);
					visited_diag2[i+k][j+k] = 1;
				}
				
				sequences.push(sequence);
			}
		}
	}
	
	return sequences;
}

//TODO otimizar
GomokuAI.prototype.evaluateSequences = function(sequences, rounds_played){
	var sum = 0;
	for(var i = 0; i < sequences.length; i++){
		var sequence = sequences[i];
		var value = 0;
		
		if(sequence.length != 1){
			value = Math.pow(3, sequence.length*2) / (rounds_played+1);
		} else{
			value += 0.1;
		}

		sum += value;
	}
	return sum;
}

GomokuAI.prototype.buildPossibilitiesGraph = function(grid_state, max, rounds_played){	
	var graph = new Graph();
	var root = new Node(this.copyGrid(grid_state));
	graph.addNode(root);

	var visited_grid = this.game.buildGrid();		
	
	var grid_aux = this.copyGrid(grid_state);
	for(var i = 0; i < GRID_SIZE; i++){
		for(var j = 0; j < GRID_SIZE; j++){
			if(grid_state[i][j] != 0){
				var distance = 1;
				for(var k = -distance; k <= distance; k++){
					for(var l = -distance; l <= distance; l++){
						if(i+k >= 0 && i+k < GRID_SIZE && j+l >= 0 && j+l < GRID_SIZE){
							if(grid_state[i+k][j+l] == 0 && visited_grid[i+k][j+l] == 0){
								if(max){
									grid_aux[i+k][j+l] = this.player_number;
								}else{
									grid_aux[i+k][j+l] = (this.player_number % 2) + 1;
								}
								var node = new Node(grid_aux);
								node.setPos(j+l, i+k);
								node.setWeight(this.utility(node.info, rounds_played));
								graph.addNode(node);
								graph.connect(root, node);

								visited_grid[i+k][j+l] = 1;
								
								grid_aux = this.copyGrid(grid_state);
							}
						}
					}	
				}
			}
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
	this.player1 = player1;
	this.player2 = player2;

	this.currentPlayer = player1;

	this.rounds_played = 0;
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
		this.rounds_played += 1;
		this.gameover = (this.checkVictory(this.grid) != undefined);
	}
}

Game.prototype.checkVictory = function(grid){
	for(var i = 0; i < GRID_SIZE; i++){
		for(var j = 0; j < GRID_SIZE; j++){
			if(grid[i][j] == 1){
				for(var k = 1; k < SEQUENCE_SIZE && grid[i][j+k] == 1; k++){
					if(k == SEQUENCE_SIZE-1){
						return "white";
					}
				}
				for(var k = 1; k < SEQUENCE_SIZE && grid[i+k][j] == 1; k++){
					if(k == SEQUENCE_SIZE-1){
						return "white";
					}
				}
				for(var k = 1; k < SEQUENCE_SIZE && grid[i+k][j-k] == 1; k++){
					if(k == SEQUENCE_SIZE-1){
						return "white";
					}
				}
				for(var k = 1; k < SEQUENCE_SIZE && grid[i+k][j+k] == 1; k++){
					if(k == SEQUENCE_SIZE-1){
						return "white";
					}
				}
			}else if(grid[i][j] == 2){

				for(var k = 1; k < SEQUENCE_SIZE && grid[i][j+k] == 2; k++){
					if(k == SEQUENCE_SIZE-1){
						return "black";
					}
				}
				for(var k = 1; k < SEQUENCE_SIZE && grid[i+k][j] == 2; k++){
					if(k == SEQUENCE_SIZE-1){
						return "black";
					}
				}
				for(var k = 1; k < SEQUENCE_SIZE && grid[i+k][j-k] == 2; k++){
					if(k == SEQUENCE_SIZE-1){
						return "black";
					}
				}
				for(var k = 1; k < SEQUENCE_SIZE && grid[i+k][j+k] == 2; k++){
					if(k == SEQUENCE_SIZE-1){
						return "black";
					}
				}

			}
		}
	}
}

Game.prototype.getCell = function(grid, x, y){
	if(x < 0 || y < 0 || x > GRID_SIZE-1 || y > GRID_SIZE-1) return -1;
	return grid[y][x];
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
	game.update();
	renderer.render();
	if(game.gameover){
		console.log(game.checkVictory(game.grid));
		return;
	}
}, 1);