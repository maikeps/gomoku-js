var GRID_SIZE = 3;
var SEQUENCE_SIZE = 3;
var CELL_SIZE = 50;
var BOARD_HEIGHT = GRID_SIZE * CELL_SIZE;
var BOARD_WIDTH = GRID_SIZE * CELL_SIZE;
var SCREEN_HEIGHT = BOARD_HEIGHT + CELL_SIZE
var SCREEN_WIDTH = BOARD_WIDTH + CELL_SIZE

function Node(info){
	this.info = info;
	this.weight = 0;
	this.neighbours = {};
}

Node.prototype.addNeighbour = function(node, distance){
	this.neighbours[node.id] = {
		node: node, 
		distance: distance
	};
}

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

function GomokuAI(player_number, color){
	this.player_number = player_number;
	this.color = color;
}

GomokuAI.prototype.play = function(){
	var grid_x = Math.floor(Math.random() * (GRID_SIZE));
	var grid_y = Math.floor(Math.random() * (GRID_SIZE));
	
	while(this.game.grid[grid_y][grid_x] != 0){
		var grid_x = Math.floor(Math.random() * (GRID_SIZE));
		var grid_y = Math.floor(Math.random() * (GRID_SIZE));		
	}

	this.game.play(grid_x, grid_y);
}

GomokuAI.prototype.copyGrid = function(grid){
	var copy = [];
	for(var i = 0; i < grid.length; i++){
		copy.push(grid[i].slice());
	}
	return copy;
}

GomokuAI.prototype.minMax = function(grid_state, depth){
	graph = this.buildPossibilitiesGraph(grid_state);

	var root = graph.nodes[0];
	for(var key in root.neighbours){
		var node = root.neighbours[key].node;
		node.weight = this.utility(node.info);
		console.log("weight", node.weight);
	}

	return graph;
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
	
	var count = 0;
	var countOponent = 0;

	var count_seq = 0;
	for(var i = 0; i < grid_state.length; i++){
		for(var j = 0; j < grid_state[i].length-(SEQUENCE_SIZE-1); j++){
			for(var k = j; k < SEQUENCE_SIZE; k++){
				if(grid_state[i][k] == this.player_number){
					count_seq++;
					console.log(i, k, count_seq);
				}else if(grid_state[i][k] != 0){
					count_seq = 0;
					break;
				}
			}
			// if(grid_state[i][j] == this.player_number){
			// 	count_seq++;
			// }else{
			count += count_seq;
			count_seq = 0;
			// }
		}
	}

	return count-countOponent;
}

GomokuAI.prototype.buildPossibilitiesGraph = function(grid_state){
	var grid_state_copy = this.copyGrid(grid_state);
	
	var graph = new Graph();
	var root = new Node(grid_state_copy);
	graph.addNode(root);

	var grid_aux = grid_state_copy;
	for(var i = 0; i < grid_state.length; i++){
		for(var j = 0; j < grid_state[i].length; j++){
			if(grid_state[i][j] == 0){
				grid_aux[i][j] = this.player_number;
				var node = new Node(grid_aux);
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

function GomokuPlayer(player_number, color){
	this.player_number = player_number;
	this.color = color;
}

GomokuPlayer.prototype.play = function(grid_x, grid_y){
	// if(x < 0 || x > BOARD_WIDTH || y < 0 || y > BOARD_HEIGHT || this.gameover || this.turn == "black") return;

	// var grid_x = Math.floor((x - CELL_SIZE/2) / CELL_SIZE);
	// var grid_y = Math.floor((y - CELL_SIZE/2) / CELL_SIZE);

	this.game.play(grid_x, grid_y);
}

GomokuPlayer.prototype.setGame = function(game){
	this.game = game;
}

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

	// this.play(grid_x, grid_y);
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
	}
}


Game.prototype.play2 = function(grid_x, grid_y){
	if(this.grid[grid_y][grid_x] == 0){
		if(this.turn == "white"){
			this.grid[grid_y][grid_x] = 1;
			this.turn = "black";
		} else{
			this.grid[grid_y][grid_x] = 2;
			this.turn = "white";
		}

		this.gameover = (this.checkVictory() != undefined);
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
	var offset = -(((this.grid_size-2*(this.sequence_size - 1))-1)/2);
	var offsetMax = -1*offset;
	
	for(var k = offset; k <=offsetMax; k++){	
		for(var i = 0; i < this.grid_size; i++){
			for(var j = 0; j < this.grid_size; j++){
				if(i-j == k){
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
			}
		}
		cont1 = 0;
		cont2 = 0;
	}
	
	//"/"

	var sum = (this.sequence_size-1);
	var sumMax = this.grid_size-1 + this.grid_size-1 - sum;
	for(var k = sum; k <=sumMax; k++){	
		for(var i = 0; i < this.grid_size; i++){
			for(var j = 0; j < this.grid_size; j++){
				if(i+j == k){
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
			}
		}
	}
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

function Renderer(game){
	this.game = game;
	this.canvas = document.getElementById("canvas");
	this.ctx = canvas.getContext("2d");
	canvas.width = BOARD_WIDTH + CELL_SIZE + BOARD_WIDTH /4;
	canvas.height = BOARD_HEIGHT + CELL_SIZE;
}

//canvas.offsetTop
//canvas.offsetLeft
//event.pageX
//event.pageY
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
var game = new Game(GRID_SIZE, SEQUENCE_SIZE, player1, player2);

this.ai1.setGame(game);
this.ai2.setGame(game);
this.player1.setGame(game);
this.player2.setGame(game);

// var player = new GomokuPlayer(game, 1, "white");

// game.setPlayers(ai1, ai2);

var renderer = new Renderer(game);

document.addEventListener('mousedown', function(e){
	var x = e.pageX - renderer.canvas.offsetLeft;
	var y = e.pageY - renderer.canvas.offsetTop;

	game.click(x, y);
}, false);

setInterval(function(){
	game.update();
	if(game.gameover){
		console.log(game.checkVictory());
	}
	renderer.render();
}, 100);