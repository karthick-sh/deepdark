var width = 80;
var fps = 16;

var canvas = document.getElementById('canvas');

var scrW = 2000;
var scrH = 2000;

var cols = Math.floor(scrW / width);
var rows = Math.floor(scrH / width);

var grid = new Array(rows+5);
for(var i = 0; i < rows+5; i++){
	grid[i] = new Array(cols+5);
}
for (var i = 0; i < rows+5; i++){
    	for (var j = 0; j < cols+5; j++){
    		grid[i][j] = new Cell(i, j);
    	}
  	}

var rooms = [];
var stack = [];
var enemies = [];
var bullets = [];
var pickups = [];
var pickupsOnFloor = [];

var view = {x: 0, y: 0};

var current;
var stage = 1;
var stageLimit = 2;
var timeleft = 180;
var time = 'Start!';


var player;
var playerDir = 'up';
var playerHealth = 100;
var playerHunger = 100;
var enemy;
var x_vel = 0;
var y_vel = 0;

var score = 0;

var UP_KEY = 38;
var RIGHT_KEY = 39;
var DOWN_KEY = 40;
var LEFT_KEY = 37;
var SPACE_KEY = 32;

//SPRITES
var hero = new Image();
hero.src = 'sprites/hero.png';

var enemyimg = new Image();
enemyimg.src = 'sprites/enemy.png';

var bulletimg = new Image();
bulletimg.src = 'sprites/bullet.png';

var floorimg = new Image();
floorimg.src = 'sprites/floor.png';

var wallimg = new Image();
wallimg.src = 'sprites/wall.png';

var ladderimg = new Image();
ladderimg.src = 'sprites/ladder.png';

var parchmentimg = new Image();
parchmentimg.src = 'sprites/parchment.png';

var apple = new Image();
apple.src = 'sprites/apple.png';
pickups.push(apple);

var heart = new Image();
heart.src = 'sprites/heart.png';
pickups.push(heart);

var killAllimg = new Image();
killAllimg.src = 'sprites/killAll.png';
pickups.push(killAllimg);

var coinimg = new Image();
coinimg.src = 'sprites/coin.png';
pickups.push(coinimg);

//AUDIO
//var bgm = new Audio('sounds/bgm.mp3');
//bgm.play();

var icemusic = new Audio('sounds/ice.mp3');

function Camera(){
	this.x = 0;
	this.y = 0;
	this.w = 13;
	this.h = 13;

	this.update = function(){
		this.x = player.x - 6;
		this.y = player.y - 6;
	}
}

var cam = new Camera();

function Cell(x, y){
	this.x = x;
	this.y = y;

    this.wall = true;
	this.visited = false;
	this.ladder = false;

	this.show = function() {
      	
      	if (canvas.getContext) {
        	var ctx = canvas.getContext('2d');

        	if((this.x-cam.x) <= cam.w && (this.y - cam.y) <= cam.h){
        	if (this.ladder)
        		ctx.drawImage(ladderimg, (this.x-cam.x)*width, (this.y-cam.y)*width, width, width);
        	
        	else if (this.visited)
        		ctx.drawImage(floorimg, (this.x-cam.x)*width, (this.y-cam.y)*width, width, width);
        	else if(this.wall)
        		ctx.drawImage(wallimg, (this.x-cam.x)*width, (this.y-cam.y)*width, width, width);
        	
         	}
      	}
    }

    this.checkNeighbors = function(offset){
    	var neighbors = [];

    	var top, right, bottom, left;

    	if (y - offset >= 0)
    		top    = grid[this.x    ][this.y - offset];
    	if (x + offset < cols)
    		right  = grid[this.x + offset][this.y    ];
   		if (y + offset < rows)
    		bottom = grid[this.x    ][this.y + offset];
    	if (x - offset >= 0)
    		left   = grid[this.x - offset][this.y    ];



    	if(top && !top.visited){
    		neighbors.push(top);
    	}
    	if(right && !right.visited){
    		neighbors.push(right);
    	}
    	if(bottom && !bottom.visited){
    		neighbors.push(bottom);
    	}
    	if(left && !left.visited){
    		neighbors.push(left);
    	}

    	

    	if(neighbors.length > 0){
    		var random = Math.floor(Math.random() * (neighbors.length));
    		if(neighbors[random])
    			return [neighbors[random], neighbors[random].x, neighbors[random].y];
    		else
    			return undefined;
    	}
    	else {
    		return undefined;
    	}
    }

	this.checkNeighbors2 = function(offset){
    	var neighbors = [];

    	var top, right, bottom, left;

    	if (y - offset >= 0)
    		top    = grid[this.x    ][this.y - offset];
    	if (x + offset < cols)
    		right  = grid[this.x + offset][this.y    ];
   		if (y + offset < rows)
    		bottom = grid[this.x    ][this.y + offset];
    	if (x - offset >= 0)
    		left   = grid[this.x - offset][this.y    ];



    	if(top){
    		neighbors.push(top);
    	}
    	if(right){
    		neighbors.push(right);
    	}
    	if(bottom){
    		neighbors.push(bottom);
    	}
    	if(left){
    		neighbors.push(left);
    	}

    	var visit = 0;
    	for(var i = 0; i < neighbors.length; i++){
    		if(neighbors[i].visited)
    			visit++;
    	}

    	if(neighbors.length > 0){
    		while(true){
    			var random = Math.floor(Math.random() * (neighbors.length));
    			if(neighbors[random].wall){
    				return [neighbors[random], visit];
    				break;
    			}
    		}
    		
    	}
    	else {
    		return undefined;
    	}
    }


    this.checkDeadEnd = function(){
    	var cmp = 0;
    	var walls = 0;

    	var top, right, bottom, left;

    	if (y - 1 >= 0)
    		top    = grid[this.x    ][this.y - 1];
    	if (x + 1 < cols)
    		right  = grid[this.x + 1][this.y    ];
   		if (y + 1 < rows)
    		bottom = grid[this.x    ][this.y + 1];
    	if (x - 1 >= 0)
    		left   = grid[this.x - 1][this.y    ];

    	if(top){
    		cmp++;
    		if(top.wall)
    			walls++;
    	}

    	if(right){
    		cmp++;
    		if(right.wall)
    			walls++;
    	}

    	if(bottom){
    		cmp++;
    		if(bottom.wall)
    			walls++;
    	}

    	if(left){
    		cmp++;
    		if(left.wall)
    			walls++;
    	}

    	if(walls == 3)
    		return 1;
    	else
    		return 0;
    }

    this.single = function(){
    	var top, right, bottom, left;
    	var neighbors = [];

    	if (y - 1 >= 0)
    		top    = grid[this.x    ][this.y - 1];
    	if (x + 1 < cols)
    		right  = grid[this.x + 1][this.y    ];
   		if (y + 1 < rows)
    		bottom = grid[this.x    ][this.y + 1];
    	if (x - 1 >= 0)
    		left   = grid[this.x - 1][this.y    ];

    	if(top)
    		neighbors.push(top);
    	if(right)
    		neighbors.push(right);
    	if(bottom)
    		neighbors.push(bottom);
    	if(left)
    		neighbors.push(left);

    	var single = true;
    	for(var i = 0; i < neighbors.length; i++){
    		if(neighbors[i].visited){
    			single = false;
    			break;
    		}
    	}

    	return single;
    }
  
} 

function Room(x, y, w, h){
	this.x = x;
	this.y = y;


	this.x2 = x + w;
	this.y2 = y + w;

	this.w = w;
	this.h = h;

	this.intersects = function(room){
		return(this.x <= room.x2 && this.x2 >= room.x && this.y <= room.y2 && this.y2 >= room.y);
	}

	this.draw = function(){
		
      	if (canvas.getContext) {
        	var ctx = canvas.getContext('2d');   
         	ctx.fillRect(this.x, this.y, this.w, this.h);
      	}
	}

}

function Player(x, y){
	this.x = x;
	this.y = y;
	this.oldx = 0;
	this.oldy = 0;
	this.hp = playerHealth;
	
	this.show = function(dir){
      	if (canvas.getContext) {
        	var ctx = canvas.getContext('2d');

   	

        	
        	if(dir == 'up')
        		ctx.drawImage(hero, 0, 0, 44, 44, (this.x-cam.x) * width, (this.y-cam.y) * width, width, width); 
        	else if(dir == 'down')
        		ctx.drawImage(hero, 88, 0, 44, 44, (this.x-cam.x) * width, (this.y-cam.y) * width, width, width); 
        	else if(dir == 'right')
        		ctx.drawImage(hero, 44, 0, 44, 44, (this.x-cam.x) * width, (this.y-cam.y) * width, width, width); 
        	else if(dir == 'left')
        		ctx.drawImage(hero, 132, 0, 44, 44, (this.x-cam.x) * width, (this.y-cam.y) * width, width, width); 

        	
        	

        	
      	}
	}

	this.move = function(dirx, diry){
		if(canvas.getContext){
			var ctx = canvas.getContext('2d');

			//Check enemies
			var enemyThere = false;
			for(var i = 0; i < enemies.length; i++){
				if(this.x + dirx == enemies[i].x && this.y + diry == enemies[i].y){
					enemyThere = true;
					break;
				}
			}

			if(!grid[this.x + dirx][this.y + diry].wall && !enemyThere){
				this.x += dirx;
				this.y += diry;
				moveEnemies();
			}

			if(enemyThere){
				moveEnemies();
			}
			if(grid[this.x][this.y].ladder){
				ctx.clearRect(0,0,scrW,scrH);
				if(stage < stageLimit){
					stage++;
					initialize();
				}
				else{
					stage++;
					endScreen();
				}
			}
		}
	}


}

function Enemy(x, y){
	
	this.x = x;
	this.y = y;
	this.dx = 0;
	this.dy = 0;
	this.distance = 1;
	this.health = 50;
	this.dir = 'up';
	this.show = function(){
		if (canvas.getContext) {
        	var ctx = canvas.getContext('2d');
        	
        	if((this.x-cam.x) <= cam.w && (this.y-cam.y) <=cam.h){
        	if(this.dir == 'up')
        		ctx.drawImage(enemyimg, 0, 0, 47, 47, (this.x-cam.x) * width, (this.y-cam.y) * width, width, width); 
        	else if(this.dir == 'down')
        		ctx.drawImage(enemyimg, 94, 0, 47, 47, (this.x-cam.x) * width, (this.y-cam.y) * width, width, width); 
        	else if(this.dir == 'right')
        		ctx.drawImage(enemyimg, 47, 0, 47, 47, (this.x-cam.x) * width, (this.y-cam.y) * width, width, width); 
        	else if(this.dir == 'left')
        		ctx.drawImage(enemyimg, 141, 0, 47, 47, (this.x-cam.x) * width, (this.y-cam.y) * width, width, width); 
			}
      	}
	}

	this.move = function(){
		
		this.dx = player.x - this.x;
	  	this.dy = player.y - this.y;
	  	
	  	this.distance = Math.sqrt((this.dx*this.dx) + (this.dy*this.dy));

	  	var valid_neighbors = [];
	  	var checks = 0;
	  	var top, right, bottom, left, top_right, bottom_right, bottom_left, top_left;
	  	
    	if (y - 1 >= 0)
    		top    = grid[this.x    ][this.y - 1];
    	if (x + 1 < cols)
    		right  = grid[this.x + 1][this.y    ];
   		if (y + 1 < rows)
    		bottom = grid[this.x    ][this.y + 1];
    	if (x - 1 >= 0)
    		left   = grid[this.x - 1][this.y    ];

    	top_right = grid[this.x + 1][this.y - 1];
    	bottom_right = grid[this.x + 1][this.y + 1];
    	bottom_left = grid[this.x - 1][this.y + 1];
    	top_left = grid[this.x - 1][this.y - 1];


    	//console.log(top,right,bottom,left);


    	if(top && top.visited){
    		valid_neighbors.push(top);
    	}
    	if(right && right.visited){
    		valid_neighbors.push(right);
    	}
    	if(bottom && bottom.visited){
    		valid_neighbors.push(bottom);
    	}
    	if(left && left.visited){
    		valid_neighbors.push(left);
    	}

    	/*if(top_right && top_right.visited){
    		valid_neighbors.push(top_right);
    	}
    	if(bottom_right && bottom_right.visited){
    		valid_neighbors.push(bottom_right);
    	}
    	if(bottom_left && bottom_left.visited){
    		valid_neighbors.push(bottom_left);
    	}
    	if(top_left && top_left.visited){
    		valid_neighbors.push(top_left);
    	}*/
    	
    	do{
    		var random = Math.floor(Math.random() * valid_neighbors.length);
    		checks++;
    		var new_pos = valid_neighbors[random];


    		this.newdx = player.x - valid_neighbors[random].x;
    		this.newdy = player.y - valid_neighbors[random].y;
    		var new_dist = Math.sqrt((this.newdx*this.newdx) + (this.newdy*this.newdy));
    	}while(new_dist > this.distance && checks < 20);

    	if(valid_neighbors[random].wall){
    		do{
    			var random = Math.floor(Math.random() * valid_neighbors.length);
    			var new_pos = valid_neighbors[random];


    			this.newdx = player.x - valid_neighbors[random].x;
    			this.newdy = player.y - valid_neighbors[random].y;
    		}while(valid_neighbors[random].wall);
    	}
    	

    	//Other enemy collison check
    	var enemyThere = false;
    	for(var i = 0; i < enemies.length; i++){
    		if(valid_neighbors[random].x == enemies[i].x && valid_neighbors[random].y == enemies[i].y){
					enemyThere = true;
					break;
				}
    	}
    	if((valid_neighbors[random].x != player.x || valid_neighbors[random].y != player.y) && !enemyThere){
    			var xdiff = this.x - valid_neighbors[random].x;
    			var ydiff = this.y - valid_neighbors[random].y;

    			if(xdiff == 0 && ydiff == 1)
    				this.dir = 'up';
    			else if(xdiff == -1 && ydiff == 0)
    				this.dir = 'right';
    			else if(xdiff == 0 && ydiff == -1)
    				this.dir = 'down';
    			else if(xdiff == 1 && ydiff == 0)
    				this.dir = 'left';

    			this.x = valid_neighbors[random].x;
    			this.y = valid_neighbors[random].y;
    	}
    	else if(!enemyThere){
    		this.attack();
    	}
	
	}


	this.attack = function(){
			playerHealth -= 5;
	}

}

function Bullet(x, y, dir){
	this.x = x;
	this.y = y;
	this.dir = dir;

	this.xspeed = 1;
	this.yspeed = 1;

	this.show = function(){
		if(canvas.getContext){
			ctx = canvas.getContext('2d');
			
			if(playerDir == 'left' || playerDir == 'right'){
				
        		ctx.drawImage(bulletimg, 50, 0, 20, 50, (this.x-cam.x) * width+width/3, (this.y-cam.y) * width+width/3, width/2, width/2); 
			}
        	
        	else if(playerDir == 'up' || playerDir == 'down')
        		ctx.drawImage(bulletimg, 0, 0, 50, 20, (this.x-cam.x) * width+width/3, (this.y-cam.y) * width+width/3, width/2, width/2); 
			
		}
	}
}

function drawbullet() {

  if (bullets.length){
    for (var i = 0; i < bullets.length; i++) {
     	bullets[i].show();
     }   
   }
}

function bullethit(bx, by){
	//Check enemies
	var enemyThere = false;
	var enemyThing;
	for(var i = 0; i < enemies.length; i++){
		if(bx == enemies[i].x && by == enemies[i].y){
			enemyThere = true;
			enemyThing = enemies[i];
			break;
		}
	}
	if(enemyThere)
		return enemyThing;
	else
		return false;
}
function movebullet() {
	for (var i = 0; i < bullets.length; i++) {
		if(bullets[i].dir == 'up')
			bullets[i].y -= bullets[i].yspeed; 
		else if(bullets[i].dir == 'down')
			bullets[i].y += bullets[i].yspeed; 
		else if(bullets[i].dir == 'left')
			bullets[i].x -= bullets[i].xspeed; 
		else if(bullets[i].dir == 'right')
			bullets[i].x += bullets[i].xspeed; 
 		
   		if(bullets[i].x < 0 || bullets[i].x > scrW || bullets[i].y < 0 || bullets[i].y > scrH || grid[bullets[i].x][bullets[i].y].wall){
   			bullets.splice(i, 1);
   		}
   		else{
   		var enemyCheck = bullethit(bullets[i].x, bullets[i].y);
   		if(enemyCheck){
   			bullets.splice(i, 1);
   			enemyCheck.health -= 10;
   		}
   	}
 }
}


function Pickup(x,y, type){
	this.x = x;
	this.y = y;
	this.type = type;

	this.show = function(){
		if(canvas.getContext){
			ctx = canvas.getContext('2d');

			if((this.x-cam.x) <= cam.w &&(this.y-cam.y) <=cam.h){
				ctx.drawImage(pickups[this.type], (this.x-cam.x) * width, (this.y-cam.y) * width, width, width);
			}
		}
	}



}
function setup(){

	//Make grid

  	for (var i = 0; i < rows+1; i++){
    	for (var j = 0; j < cols+1; j++){
    		grid[i][j].wall = true;
    		grid[i][j].visited = false;
    		grid[i][j].ladder = false;
    	}
  	}

  	//Make Rooms
  	var attempts = 15;
  	var max_room_width = 7;
  	var max_room_height = 7;
  	var numrooms = 0;

  	rooms.splice(0, rooms.length);

  	while (attempts || numrooms < 2){

  		x = parseInt((Math.random() * (scrW - width)) / width) * width;

  		y = parseInt((Math.random() * (scrH - width)) / width) * width;

  		w = Math.floor(Math.random() * max_room_width) * width;
  		if(w < 5 * width)
  			w = 4 * width;

  		h = Math.floor(Math.random() * max_room_height) * width;
  		if(h < 5 * width)
  			h = 4 * width;

  		if(x + w >= scrW)
  			x = scrW - w - width;
  		if(x == 0)
  			x = width;
  		if(y + h >= scrH)
  			y = scrH - h - width;
  		if(y == 0)
  			y = width;

  		room = new Room(x, y, w, h);
  		
  		

  		var failed = false;
  		for (var i = 0; i < rooms.length; i++){
  			if(rooms[i].intersects(room)){
  				failed = true;
  				break;
  			}	
  		}

  		if (!failed){
  			rooms.push(room);
  			
  			numrooms++;
  			x = x / width;
  			y = y / width;
			//console.log("The stuff"+x+' '+y+' '+w+' '+h);
  			for(var i = x; i < x+w/width; i++){
  				for(var j = y; j < y+h/width; j++){
  					
  					grid[i][j].wall = false;
  					grid[i][j].visited = true;
  					
  				}
  			}
  		}

  		attempts--;
  	}

  	//console.log(rooms);
  	//console.log(grid);
  	/*for (var i = 0; i < rooms.length; i++){
  		rooms[i].draw();
  	}*/
}
function playerSetup(){

	//PLAYER STUFF
	do{
		var playRow = Math.floor(Math.random() * rows);
		var playCol = Math.floor(Math.random() * cols);

		var playerPos = grid[playRow][playCol];
	}while(playerPos.wall);

	player = new Player(playRow, playCol);

}

function enemySetup(){
	enemies.splice(0, enemies.length);
	var numenemies = 5;


	while(numenemies){
	do{
		var enemyRow = Math.floor(Math.random() * rows);
		var enemyCol = Math.floor(Math.random() * cols);

		var enemyPos = grid[enemyRow][enemyCol];

		//Check enemies
		var enemyThere = false;
		for(var i = 0; i < enemies.length; i++){
			if(enemyPos.x == enemies[i].x && enemyPos.y == enemies[i].y){
				enemyThere = true;
				break;
			}
		}

	}while(enemyPos.wall || (enemyPos.x == player.x && enemyPos.y == player.y) || enemyThere);
	
	enemy = new Enemy(enemyRow, enemyCol);
	enemies.push(enemy);
	numenemies--;
	}
}


function pickupSetup(){
	var numPickups = 5;
	pickupsOnFloor.splice(0, pickupsOnFloor.length);
	while(numPickups){
		var random = Math.floor(Math.random() * (pickups.length - 2));
		do{
			var pickupRow = Math.floor(Math.random() * rows);
			var pickupCol = Math.floor(Math.random() * cols);

			var pickupPos = grid[pickupRow][pickupCol];

			//Check enemies
			var enemyThere = false;
			for(var i = 0; i < enemies.length; i++){
				if(pickupPos.x == enemies[i].x && pickupPos.y == enemies[i].y){
					enemyThere = true;
					break;
				}
			}

			//Check pickup
			for(var i = 0; i < pickupsOnFloor.length; i++){
				if(pickupPos.x == pickupsOnFloor[i].x && pickupPos.y == pickupsOnFloor[i].y){
					enemyThere = true;
					break;
				}
			}

		}while(pickupPos.wall || (pickupPos.x == player.x && pickupPos.y == player.y) || enemyThere);

		pick = new Pickup(pickupPos.x, pickupPos.y, random);
		pickupsOnFloor.push(pick);

		numPickups--;
	}

	var numCoins = 7;

	while(numCoins){
		do{
			var pickupRow = Math.floor(Math.random() * rows);
			var pickupCol = Math.floor(Math.random() * cols);

			var pickupPos = grid[pickupRow][pickupCol];

			//Check enemies
			var enemyThere = false;
			for(var i = 0; i < enemies.length; i++){
				if(pickupPos.x == enemies[i].x && pickupPos.y == enemies[i].y){
					enemyThere = true;
					break;
				}
			}

			//Check pickup
			for(var i = 0; i < pickupsOnFloor.length; i++){
				if(pickupPos.x == pickupsOnFloor[i].x && pickupPos.y == pickupsOnFloor[i].y){
					enemyThere = true;
					break;
				}
			}

		}while(pickupPos.wall || (pickupPos.x == player.x && pickupPos.y == player.y) || enemyThere);

		coin = new Pickup(pickupPos.x, pickupPos.y, pickups.length-1);
		pickupsOnFloor.push(coin);

		numCoins--;
	}

	do{
			var pickupRow = Math.floor(Math.random() * rows);
			var pickupCol = Math.floor(Math.random() * cols);

			var pickupPos = grid[pickupRow][pickupCol];

			//Check enemies
			var enemyThere = false;
			for(var i = 0; i < enemies.length; i++){
				if(pickupPos.x == enemies[i].x && pickupPos.y == enemies[i].y){
					enemyThere = true;
					break;
				}
			}

			//Check pickup
			for(var i = 0; i < pickupsOnFloor.length; i++){
				if(pickupPos.x == pickupsOnFloor[i].x && pickupPos.y == pickupsOnFloor[i].y){
					enemyThere = true;
					break;
				}
			}

		}while(pickupPos.wall || (pickupPos.x == player.x && pickupPos.y == player.y) || enemyThere);

		killAll = new Pickup(pickupPos.x, pickupPos.y, pickups.length-2);
		pickupsOnFloor.push(killAll);
}

function generateMaze(){
	do{
		current.visited = true;
		current.wall = false;

		var next = current.checkNeighbors(2);
		if (next){
			next[0].visited = true;
			next[0].wall = false;
			stack.push(current);

			grid[(current.x + next[1]) / 2][(current.y + next[2])/2].visited = true;
			grid[(current.x + next[1]) / 2][(current.y + next[2])/2].wall = false;

			current = next[0];
		}
		else if(stack.length > 0){
			current = stack.pop();
		}
	}while(stack.length != 0);
}

function sparsify(){
	var sparseness = 10;
	while(sparseness){
		for(var i = 1; i < rows; i++){
			for(var j = 1; j < cols; j++){
				
				if (grid[i][j].checkDeadEnd()){
					grid[i][j].visited = false;
					grid[i][j].wall = true;

				}
			}

		}
		sparseness--;
	}	
}

function deadEndRemoval(){
	for(var i = 1; i < rows; i++){
		for(var j = 1; j < cols; j++){
			var exit = false;
			if(grid[i][j].checkDeadEnd()){
				if(Math.random() > 0.9)
					exit = generateLoop(grid[i][j]);
			}
			if(exit)
				break;
		}
	}
}

function generateLoop(c){
	var next = c.checkNeighbors2(1)[0];
	if (!next.visited){
		next.visited = true;
		next.wall = false;
		return 0;
	}
	else if(next[1] >= 2)
		return true;
	else
		return false;
}

function cleanUp(){
	for(var i = 0; i < rows; i++){
		for(var j = 0; j < cols; j++){
			if(grid[i][j].single()){
				grid[i][j].visited = false;
				grid[i][j].wall = true;
			}
		}
	}
}


function endScreen(){
	
	
	var endcanvas = document.getElementById('end');
	if(endcanvas.getContext){
		endctx = endcanvas.getContext('2d');

		endctx.fillStyle = 'black';
		endctx.fillRect(0,0, scrW+width, scrH+width);

		endctx.fillStyle = 'white';
		endctx.font = '30px Arial';
		if(stage == stageLimit + 2)
			endctx.fillText("Game Over. Refresh to restart!", canvas.width/2 - 250, canvas.height/2);
		else
			endctx.fillText("You win! Score is: "+score+". Refresh to restart!", canvas.width/2 - 250, canvas.height/2);
	
	}

}

function showTextOverlay(){
	if(stage <= stageLimit){
		
	var endcanvas = document.getElementById('text');
	if(endcanvas.getContext){
		endctx = endcanvas.getContext('2d');

		endctx.clearRect(0, 0, scrW, scrH);

    endctx.drawImage(parchmentimg, 0, 0, 300, 1040)
		endctx.fillStyle = 'black';
		endctx.font = '40px Arial';
		var stageString = "Stage: "+stage+"/"+stageLimit;
		var HPString = "HP: "+playerHealth;
		var HungerString = "Hunger: "+playerHunger;
		var scoreString = "Score: "+score;
		endctx.fillText(stageString, 10, 40);
		endctx.fillText(time, 10,140);
		endctx.fillText(HPString, 10, 240);
		endctx.fillText(HungerString, 10, 340);
		endctx.fillText(scoreString, 10, 440)
	}
	}
}

function playerSearch(x, y){
	var searchSize = 7;
	
	for(var i = x - searchSize; i < x + searchSize; i++){
		for(var j = y - searchSize; j < y + searchSize; j++){
			
			if(player.x == i && player.y == j)
				return true;
		}
	}
	return false;
}

function moveEnemies(){
	for (var i = 0; i < enemies.length; i++){
		if(playerSearch(enemies[i].x, enemies[i].y))
			enemies[i].move();
	}
}
function update(){
	
	if(playerHealth <= 0 || playerHunger <= 0){
		stage = stageLimit + 2;
		endScreen();
	}

	draw();
	drawbullet();
	player.show(playerDir);
	drawEnemy();
	
	cam.update();
	movebullet();

	for(var i = 0; i < pickupsOnFloor.length; i++){
		if(player.x == pickupsOnFloor[i].x && player.y == pickupsOnFloor[i].y){
			if(pickupsOnFloor[i].type == 0)
				playerHunger += 10;
			else if(pickupsOnFloor[i].type == 1)
				playerHealth += 10; 
			else if(pickupsOnFloor[i].type == 3)
				score += 10;
			else if(pickupsOnFloor[i].type == 2)
				enemies.splice(0, enemies.length);
			pickupsOnFloor.splice(i, 1);
		}
	}
	
	//setTimeout(enemy.move(),250);
}

//LISTENERS
window.addEventListener("keydown", function(event){
		if(event.keyCode == RIGHT_KEY){
			if(playerDir == 'right'){
				player.move(1, 0);
				//moveEnemies();
			}
			
				playerDir = 'right';
		}

		else if(event.keyCode == LEFT_KEY){
			if(playerDir == 'left'){
				player.move(-1, 0);
				//moveEnemies();
			}	
			
				playerDir = 'left';
		}

		else if(event.keyCode == UP_KEY){
			if(playerDir == 'up'){
				player.move(0, -1);
				//moveEnemies();
			}
				playerDir = 'up';
		}

		else if(event.keyCode == DOWN_KEY){
			if(playerDir == 'down'){
				player.move(0, 1);
				//moveEnemies();
			}
				playerDir = 'down';
		}

		else if(event.keyCode == SPACE_KEY){
			b = new Bullet(player.x, player.y, playerDir);
			icemusic.play();
			bullets.push(b);
			moveEnemies();
		}

	});



function draw(){
	
	if(canvas.getContext){
		var ctx = canvas.getContext('2d');
		ctx.fillRect(0, 0, scrW, scrH)
	}

	for(var i = 0; i < rows+1; i++){
		for(var j = 0; j < cols+1; j++){
			grid[i][j].show();

		}
	}	
	
	for(var i = 0; i < pickupsOnFloor.length; i++){
		pickupsOnFloor[i].show();
	}
	showTextOverlay();

}

function drawEnemy(){
	
	for(var i = 0; i < enemies.length; i++){
		if(enemies[i].health > 0)
			enemies[i].show();
		else{
			enemies.splice(i, 1);
			score += 10;
		}
	}
}

function initialize(){
	timeleft = 180;
	setup();
	playerSetup();
	enemySetup();
	current = grid[1][1];
	generateMaze();
	for(var i = 1; i < rows; i++){
		for(var j = 1; j < cols; j++){
			if (grid[i][j].wall){
				current = grid[i][j];
			}
		}
		if(current)
			break;
	}
	generateMaze();
	sparsify();
	//deadEndRemoval();
	//cleanUp();
	do{
		var lrow = Math.floor(Math.random() * rows);
		var lcol = Math.floor(Math.random() * cols);

		var lpos = grid[lrow][lcol];
	}while(lpos.wall);

	lpos.ladder = true;

	pickupSetup();
}

initialize();

setInterval(function () {

	if(timeleft % 60 < 10)
		var string = ':0';
	else
		var string = ':';
    time = parseInt(timeleft / 60) + string + timeleft % 60; //formart seconds back into mm:ss  
	timeleft -= 1;

	if(!(timeleft % 30)){
		playerHunger -= 10;
	}

	

	var endcanvas = document.getElementById('end');

	if(endcanvas.getContext && canvas.getContext){
		endctx = endcanvas.getContext('2d');
		ctx = canvas.getContext('2d');
		if(time == '0:00'){
			stage = stageLimit + 2;
			endScreen();
		}
	}

}, 1000)



setInterval(update, 1000/fps);

