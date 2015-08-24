var GRID_SIZE = 15;
var SEQUENCE_SIZE = 5;
var CELL_SIZE = 50;
var SCREEN_HEIGHT = GRID_SIZE * CELL_SIZE;
var SCREEN_WIDTH = GRID_SIZE * CELL_SIZE;

function GomokuAI(game){
	this.game = game;
}

GomokuAI.prototype.play = function(){
	var grid_x = Math.floor(Math.random() * GRID_SIZE);
	var grid_y = Math.floor(Math.random() * GRID_SIZE);
	
	while(this.game.grid[grid_y][grid_x] != 0){
		var grid_x = Math.floor(Math.random() * GRID_SIZE);
		var grid_y = Math.floor(Math.random() * GRID_SIZE);		
	}

	this.game.play(grid_x, grid_y);
}

GomokuAI.prototype.heuristic = function(){

}

GomokuAI.prototype.utility = function(){

}

function Game(grid_size, sequence_size){
	this.grid_size = grid_size;
	this.grid = this.buildGrid();
	this.turn = "white";
	this.sequence_size = sequence_size;
	this.ai = new GomokuAI(this);

	this.gameover = false;
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
	if(x < 0 || x > SCREEN_WIDTH || y < 0 || y > SCREEN_HEIGHT || this.gameover || this.turn == "black") return;

	var grid_x = Math.floor(x / CELL_SIZE);
	var grid_y = Math.floor(y / CELL_SIZE);

	this.play(grid_x, grid_y);
}

Game.prototype.play = function(grid_x, grid_y){
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
	if(this.turn == "black"){
		this.ai.play();
	}
}

function Renderer(game){
	this.game = game;
	this.canvas = document.getElementById("canvas");
	this.ctx = canvas.getContext("2d");
	canvas.width = SCREEN_WIDTH;
	canvas.height = SCREEN_HEIGHT;
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
		this.drawLine(i*CELL_SIZE, offsety, i*CELL_SIZE, SCREEN_HEIGHT-offsety, "black", 1);
	}
	for(var i = 1; i < GRID_SIZE + 1; i++){
		this.drawLine(offsetx, i*CELL_SIZE, SCREEN_WIDTH-offsety, i*CELL_SIZE, "black", 1);
	}


	for(var i = 0; i < grid.length; i++){
		for(var j = 0; j < grid[i].length; j++){
			if(grid[i][j] == 1){
				this.ctx.fillStyle = "white";
				this.fillOval(j*CELL_SIZE+1, i*CELL_SIZE+1, CELL_SIZE-2);
			}else if(grid[i][j] == 2){
				this.ctx.fillStyle = "black";
				this.fillOval(j*CELL_SIZE+1, i*CELL_SIZE+1, CELL_SIZE-2);
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

var game = new Game(GRID_SIZE, SEQUENCE_SIZE);
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