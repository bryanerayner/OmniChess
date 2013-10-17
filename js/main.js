



var Square = Backbone.Model.extend({
	defaults:function(){
		return{
			rank:"",
			file:"",
			reference:"",
			piece:null
		};
	},

	initialize:function(options){
		this.module = options.module;
		this.sandbox = options.sandbox;

		this.on("change:rank change:file", this.updateReference,this);
		this.updateReference();
	},	
	updateReference:function()
	{
		this.set("reference", this.get("file")+this.get("rank"));
	},

	moveValid:function(incomingPiece)
	{

	}
});


var Square_View = SandboxApp.NestedView.extend({

	initialize:function(options)
	{
		SandboxApp.NestedView.prototype.initialize.apply(this, arguments);

		this.template = "template_square";

		this.listenTo(this.model, "change", this.render);

	},

	events:
	{
		"click": "squareClick"
	},

	squareClick:function()
	{
		this.sandbox.request("click", this.model.get("reference"));
	}

})

var regx_Alpha = /[\w]/;
var alpha = ["_","A","B","C","D","E","F","G","H"];

function numToAlpha(num)
{
	return alpha[num];
}
function alphaToNum(letter)
{
	return _.indexOf(alpha, letter);
}

function vectorToCoord(x, y)
{
	var _x = x;
	var _y = y;
	if (_.isObject(x))
	{
		_x = x.x;
		_y = x.y;
	}
	_x = numToAlpha(_x);
	return _x+_y;
}


function coordToVector(coord)
{
	var ret = {x:0,y:0};
	var x = 0;
	var y = 0;
	if (_.isString(coord))
	{
		if (regx_Alpha.test(coord.charAt(0)))
		{
			x = alphaToNum(coord.charAt(0));
		}
		y = coord.charAt(1);
	}
	ret.x = x;
	ret.y = y;
	return ret;
}


var Board = Backbone.Collection.extend({
	initialize:function(options){
		this.rankCount = options.rankCount;
		this.fileCount = options.fileCount;
	},

	//Return the piece that is at this location
	lookUp:function(reference, options)
	{
		return this.game.lookUp(reference, options);
		
	},

	reset:function(){
		Backbone.Collection.prototype.reset.call(this);

		for (var f = 0, ff = this.fileCount; f < ff; f++) {
			for (var r = 0, rr = this.rankCount; r < rr; r++) {
				this.add(new Square({file:numToAlpha(f+1), rank:r+1}));
			};			
		};
		
	},

	references:function(options)
	{
		if (!options || !options.array)
		{
			var ret = [];
			for (var f = 0, ff = this.fileCount; f < ff; f++) {
				for (var r = 0, rr = this.rankCount; r < rr; r++) {
					var rank= r+1;
					ret.push(numToAlpha(f+1)+rank);
				};			
			};
			return ret;
		}else if (options.array == true)
		{
			var ret = [];
			for (var f = 0, ff = this.fileCount; f < ff; f++) {
				var retty = [];
				for (var r = 0, rr = this.rankCount; r < rr; r++) {
					var rank= r+1;
					retty.push(numToAlpha(f+1)+rank);
				};
				ret.push(retty);
			};
			return ret;
		}
	},
	ranks:function()
	{
		var ret = [];
		for (var r = 0, rr = this.rankCount; r < rr; r++) {
			ret.push(r+1);
		};
		return ret;
	},
	files:function()
	{
		var ret = [];
		for (var f = 0, ff = this.fileCount; f < ff; f++) {
			ret.push(numToAlpha(f+1));
		};
		return ret;
	}
});


var Board_View = SandboxApp.NestedView.extend({

	initialize:function(options)
	{
		SandboxApp.NestedView.prototype.initialize(options);
		this.boardID = options.boardID;

		this.template = "template_board";

		this.listenTo(this.collection, "add reset", this.render);
		var me = this;
		this.collection.each(function(model){
			me.addSubView(model.get("reference"), new Square_View(_.extend({model:model}, this.options)));
		},this);

	},

	renderData:function()
	{
		var files = this.collection.files();
		files = _.map(files, function(file){
			var ranks = this.collection.ranks().reverse();
			var newRanks = [];
			_.each(ranks, function(rank){
				newRanks.push({
					rank:rank,
					file:file
				});
			});
			return {
				"rankName":newRanks[alphaToNum(file)-1].rank,
				"fileName":file,
				"ranks":newRanks
			};
		},this);
		return {"files":files};
	}
});



var Game = Backbone.Collection.extend(
{
	initialize:function(options)
	{
		this.sandbox = options.sandbox;
		this.board = null;
		this.listenTo(this.sandbox, "setupGame", this.setupGame);
		this.listenTo(this, "setStart", this.setStart);
		this.listenTo(this, "setEnd", this.setEnd);
		this.listenTo(this.sandbox, "request:click", this.requestClick);
	},

	setupGame:function()
	{
		this.sandbox.trigger("removePieces");

		
		var t = this;

		function addPiece(piece)
		{
			t.add(piece);
		}
		var side = "white";
		var dir = -1;
		var pawnLocations = ["A7","B7","C7","D7","E7","F7","G7","H7"];
		var bishopLocations = ["C8","F8"];
		var knightLocations = ["B8","G8"];
		var rookLocations = ["A8","H8"];
		var queenLocations = ["E8"];
		var kingLocations = ["D8"];

		function setupSide()
		{
			_.each(pawnLocations, function(location){
				addPiece(new Pawn({
					sandbox: t.sandbox,
					collection: t,
					location:location,
					team:side,
					direction:dir
				}));
			});
			_.each(bishopLocations, function(location){
				addPiece(new Bishop({
					sandbox: t.sandbox,
					collection: t,
					location:location,
					team:side,
					direction:dir
				}));
			});
			_.each(knightLocations, function(location){
				addPiece(new Knight({
					sandbox: t.sandbox,
					collection: t,
					location:location,
					team:side,
					direction:dir
				}));
			});
			_.each(rookLocations, function(location){
				addPiece(new Rook({
					sandbox: t.sandbox,
					collection: t,
					location:location,
					team:side,
					direction:dir
				}));
			});
			_.each(queenLocations, function(location){
				addPiece(new Queen({
					sandbox: t.sandbox,
					collection: t,
					location:location,
					team:side,
					direction:dir
				}));
			});
			_.each(kingLocations, function(location){
				addPiece(new King({
					sandbox: t.sandbox,
					collection: t,
					location:location,
					team:side,
					direction:dir
				}));
			});
		}


		setupSide();
		side = "black";
		dir = 1;
		pawnLocations = ["A2","B2","C2","D2","E2","F2","G2","H2"];
		bishopLocations = ["C1","F1"];
		knightLocations = ["B1","G1"];
		rookLocations = ["A1","H1"];
		queenLocations = ["E1"];
		kingLocations = ["D1"];

		setupSide();	

		this.sandbox.set("currentTurn", "white");
		this.trigger("setupGame");
	},

	setStart:function(location)
	{
		this.sandbox.set("startLocation", location);

	},

	setEnd:function(location)
	{

	},

	getPieces:function()
	{
		return this.filter(function(model){
			return (_.isString(model.get("pieceName")));
		});
	},

	//Return the piece that is at this location
	lookUp:function(reference, options)
	{
		var refPiece = _.find(this.getPieces(), function(piece){
			return piece.get("location") == reference;
		});

		if (_.isObject(refPiece))
		{		
			if (options.string)
			{
				return refPiece.toString();
			}
			return refPiece;
		}
		else
		{
			return "NULL";
		}

	},

	giveBoard:function(newBoard)
	{
		this.board = newBoard;
	},

	requestClick:function(reference)
	{
		
	}
});

var Game_View = SandboxApp.NestedView.extend({
	initialize:function(options)
	{
		SandboxApp.NestedView.prototype.initialize.apply(this, arguments);
		this.boardView = options.boardView;

		
		this.listenTo(this.collection, "setupGame", this.render);
	},

	render:function(){
		SandboxApp.NestedView.prototype.render.apply(this, arguments);

		var pieces = this.collection.getPieces();

		_.each(pieces, function(piece){
			var pieceView = new Piece_View(
			{
				model:piece,
				sandbox:this.sandbox,
				parentView:this.boardView
			});
			pieceView.render("parent");
			pieceView.locationUpdate();
		}, this);

		return this;
	}


});



var Piece = Backbone.Model.extend({
	defaults:function()
	{
		return{
			location:"NULL",
			team:"NULL",
			rules:[],
			numMoves:0,
			pieceName: "NULL",
			direction:1
		}
	},
	initialize:function(options)
	{
		this.sandbox = options.sandbox;

		this.set("direction", options.direction || 1);

		this.listenTo(this.sandbox, "removePieces", this.destroy);
	},

	ownsTurn:function()
	{
		if (this.sandbox.get("currentTurn") == this.get("team"))
		{
			return true;
		}
		return false;
	}
});

var Piece_View = SandboxApp.NestedView.extend({

	events:
	{
		"click": "click_ev",
		"mouseenter":"mouseenter_ev",
		"mouseleave":"mouseleave_ev"
	},
	initialize:function(options)
	{
		SandboxApp.NestedView.prototype.initialize.apply(this, arguments);
		this.template = "template_piece";

		this.listenTo(this.model, "change:location", this.locationUpdate);
		this.listenTo(this.model, "destroy", this.remove);
	},

	locationUpdate:function()
	{
		var location = this.model.get("location");
		var $square = this.parentView.$(".Subview_"+location).find(".square");
		this.$el.appendTo($square);
	},

	click_ev:function()
	{
		if (this.model.ownsTurn())
		{
			this.model.collection.trigger("setStart", this.model.get("location"));
		}
		this.$el.find(".piece").addClass("animate");
	},

	mouseenter_ev:function()
	{
		this.$el.find(".piece").addClass("previewed");
	},
	mouseleave_ev:function()
	{
		this.$el.find(".piece").removeClass("previewed");
	}
});

var Position = function(X, Y)
{
	this.x = X;
	this.y = Y;
}

var Rule = function(options)
{
	this.configure(options);
}

_.extend(Rule.prototype, {
	configure:function(options)
	{
		this.condition = {
			
			destinationRequirement:"Any",//"Empty", "Opponent", "Friend", "Any", "#{PieceName}" may use lists
			maxMoves:Infinity, //How many moves maximum can the piece have taken?
			legalLocations:["*"] //Where is this legal to move from?
			//+01 indicates an addition of one space from the starting point in the y dimension
		};
		this.iterations = Infinity || options.iterations;//How many iterations?
		this.deltas = [];//Changes in direction
 		this.transform = false || options.transform;//Do you get to transform this piece at the end?
 		this.direction = options.direction || 1;


		_.extend(this.condition, _.pick(options, "destinationRequirement","maxMoves","legalLocations"));



		this.condition.destinationRequirement = this.condition.destinationRequirement.split(/[,\s]+/);
		if (options.deltas)
		{
			for (var i = 0, ii = options.deltas.length; i < ii; i ++)
			{
				this.deltas.push(options.deltas[i]);
			}
		}


	},

	//Is this rule able to be played given the start and end locations?
	legal:function(start, end, piece, board)
	{
		var possibleLocations = this.locations(start, board);
		if (_.contains(possibleLocations, "start") && piece.get("moveCount") <= this.maxMoves)
		{
			var startVec = coordToVector(start);
			var endVec = coordToVector(end);
			var coords = board.references({array:true});
			var iter =(this.iterations < coords.length) ? this.iterations : coords.length ;
		
			function reverse(vec)
			{
				 vec.x = coords.length - 1;
				 vec.y = coords[0].length - 1;
				 return vec;
			}

			function onBoard(vec)
			{
				return (vec.x < coords.length && vec.y < coords[0].length) ? true :false;

			}

			if (this.direction < 0)
			{
				startVec = reverse(startVec);
				endVec = reverse(endVec);
			}

			//Does a square meet the requirements of this?
			function checkValid(location)
			{
				var endContents = board.lookUp(vectorToCoord(location.x, location.y));
				var conditions = [];
				conditions.push("Any");
				if (endContents == "NULL") 
				{
					conditions.push("Empty");
				}

				if (endContents.get("team") == piece.get("team"))
				{
					conditions.push("Friend");
				}else
				{
					conditions.push("Opponent");
				}

				conditions.push(endContents.get("pieceName"));

				for (var i = 0, ii = conditions.length; i < ii; i++)
				{
					if (_.contains(this.conditions.destinationRequirement, conditions[i]))
					{
						return true;
					}
				}
				return false;
			}
			//Is it possible to get to the end?
			var canReach = true;
			var validMove = false;
			for (var t = 0, tt = this.deltas.length; (t < tt && canReach && !validMove); t++)
			{
				var testStart = _.clone(startVec);
				for (var i = 0, ii = iter; i < ii; i++)
				{
					testStart.x += this.deltas[t].x;
					testStart.y += this.deltas[t].y;
					if (checkValid(testStart))
					{
						if (testStart.x == endVec.x && testStart.y == endVec.y)
						{
							validMove = true;
						}
					}
					else
					{
						canReach = false;
						break;
					}
				}
			}

			if (validMove)
			{
				return true;
			}

		}
		return false;
	},

	//Return an expanded list of locations
	locations:function(baseCoordinates, board)
	{
		return this.makePositions(this.legalLocations, this.direction, baseCoordinates, board);
	},

	makePositions:function(coordinates, direction, baseCoordinates, board)
	{
		if (!_.isString(coordinates) || !_.isString(baseCoordinates))
		{
			return "NULL";
		}
		var gameBoard = board;
		var coords = gameBoard.references({array:true});
		if (direction < 0)
		{
			_.each(coords, function(coord){
				coord.reverse();
			});
			coords.reverse();
		}

		function splitCoords(coords)
		{
			var firstHalf = "";
			var secondHalf = "";

			function eat(str, output)
			{
				switch(str.charAt(0))
				{
					case "+":
					case "-":
						output = str.substring(0, 2);
						return str.substring(2);
					break;
					default:
						output = str.charAt(0);
						return str.substring(1);
					break;
				}
			}

			eat(coords, firstHalf);
			eat(coords, secondHalf);
			var ret = {
				x:firstHalf,
				y:secondHalf
			}

			return ret;
		}

		function interpretCoord(coord, alphaNumeric, listFunc)
		{
			var alpha = !!alphaNumeric;

			var list = listFunc();
			if (alpha)
			{
				list = _.map(list, function(item){
					return alphaToNum(item);
				});
			}
			switch (coord)
			{
				case "*":
					return list;
				break;
				default:
					var ret = [];
					ret.push(parseInt(coord));
					return ret;
				break;
			}
		}
		if (coordinates.charAt(0) == "*")
		{
			return _.flatten(coords);
		}

		var Coords = splitCoords(coordinates);
		var fileCoord = interpretCoord(Coods.x, true, function(){return gameBoard.files();});
		var rankCoord = interpretCoord(Coods.y, false, function(){return gameBoard.ranks();});



		var ret = [];
		switch (coordinates.charAt(0))
		{
			case "~":
				var baseCoords = splitCoords(baseCoordinates);
				var baseFile = baseCoords.x-1;
				var baseRank = baseCoords.y-1;
			break;
			
			case "+":
				baseFile = 0;
				baseRank = 0;
			break;
			
			case "-":
				baseFile = coords.length - 1;
				baseRank = coords[0].length - 1;
			break;

			default:
				baseFile = 0;
				baseRank = 0;
			break;
		}
		_.each(fileCoord, function(file){
			_.each(rankCoord, function(rank){
				var f = parseInt(file);
				var r = parseInt(rank);
				ret.push(coords[baseFile+f][baseRank+r]);
			});
		});

		return ret;
	}

});


var MetaRule = function(options)
{
	this.configure(options);
}

var MetaRuleCondition = function(options)
{
	this.locations = options.locations || [];
	this.destinationRequirements = options.requirements || [];
	this.maxMoves = options.maxMoves || [];
	if (!options.grouped)
	{
		_.each((options.groups || []), function(pair){
			this.locations.push(pair.location || "*");
			this.destinationRequirements.push(pair.requirement || "Any");
			this.maxMoves.push(pair.maxMoves || Infinity)
		}, this);
	}
}

var MetaRuleMove = function(options)
{
	this.start = options.start || "NULL";
	this.end = options.end || "NULL";
}


//MetaRules are made for very specific circumstances that involve "breaking" other rules.
_.extend(MetaRule.prototype, _.extend({}, Rule.prototype, {
	configure:function(options)
	{
		this.conditions = options.conditions || [];
		this.direction = options.direction || 1;
		this.moves = options.moves || [];
	}
}));

var Pawn = Piece.extend(
{
	initialize:function(options)
	{
		Piece.prototype.initialize.apply(this, arguments);

		this.set("pieceName", "Pawn");

		var rules = this.get("rules");
		var direction = this.get("direction");
		//Move two at the start
		rules.push(new Rule({
			direction:direction,
			destinationRequirement:"Empty",
			maxMoves:0,
			iterations: 1,
			legalLocations:["*"],
			deltas:[new Position(0, 2)]
		}));
		//Move forward at any time.
		rules.push(new Rule({
			direction:direction,
			destinationRequirement:"Empty",
			iterations: 1,
			legalLocations:["*"],
			deltas:[new Position(0, 1)]
		}));
		//Captures.
		rules.push(new Rule({
			direction:direction,
			destinationRequirement:"Opponent",
			iterations: 1,
			legalLocations:["*"],
			deltas:[new Position(1, 1), new Position(-1, 1)]
		}));

		//Transformation at the end.
		rules.push(new Rule({
			direction:direction,
			destinationRequirement:"Empty",
			iterations: 1,
			transform:true,
			legalLocations:["-*0"],
			deltas:[new Position(0, 1)]
		}));
		rules.push(new Rule({
			direction:direction,
			destinationRequirement:"Opponent",
			iterations: 1,
			transform:true,
			legalLocations:["-*0"],
			deltas:[new Position(1, 1), new Position(-1, 1)]
		}));
	}
});

var Bishop = Piece.extend(
{
	initialize:function()
	{
		Piece.prototype.initialize.apply(this, arguments);
		this.set("pieceName", "Bishop");
		
		var rules = this.get("rules");

		//Diagonals
		rules.push(new Rule({
			destinationRequirement:"Empty, Opponent",
			deltas:[new Position(1, 1), 
					new Position(-1, 1), 
					new Position(-1, -1), 
					new Position(1, -1)]
		}));
	}
});

var Rook = Piece.extend(
{
	initialize:function()
	{
		Piece.prototype.initialize.apply(this, arguments);
		this.set("pieceName", "Rook");

		var rules = this.get("rules");

		//Vertical & Horizontal
		rules.push(new Rule({
			destinationRequirement:"Empty, Opponent",
			deltas:[new Position(0, 1), 
					new Position(0, -1), 
					new Position(-1, 0), 
					new Position(1, 0)]
		}));
	}
});

var Queen = Piece.extend(
{
	initialize:function()
	{
		Piece.prototype.initialize.apply(this, arguments);
		this.set("pieceName", "Queen");

		var rules = this.get("rules");

		//All Directions
		rules.push(new Rule({
			destinationRequirement:"Empty, Opponent",
			deltas:[new Position(0, 1), 
					new Position(0, -1), 
					new Position(-1, 0), 
					new Position(1, 0),
					new Position(1, 1), 
					new Position(-1, 1), 
					new Position(-1, -1), 
					new Position(1, -1)]
		}));
	}
});

var King = Piece.extend(
{
	initialize:function()
	{
		Piece.prototype.initialize.apply(this, arguments);
		this.set("pieceName", "King");

		var rules = this.get("rules");

		//All Directions
		rules.push(new Rule({
			destinationRequirement:"Empty, Opponent",
			iterations:1,
			deltas:[new Position(0, 1), 
					new Position(0, -1), 
					new Position(-1, 0), 
					new Position(1, 0),
					new Position(1, 1), 
					new Position(-1, 1), 
					new Position(-1, -1), 
					new Position(1, -1)]
		}));
		rules.push(new Rule({
			destinationRequirement:"Empty, Opponent",
			iterations:1,
			deltas:[new Position(0, 1), 
					new Position(0, -1), 
					new Position(-1, 0), 
					new Position(1, 0),
					new Position(1, 1), 
					new Position(-1, 1), 
					new Position(-1, -1), 
					new Position(1, -1)]
		}));
		var direction = this.get("direction");

		//Castling
		/*rules.push(new MetaRule({
			grouped:true,
			direction : this.direction,
			groups:
			[{
				location:"~00",
				requirement:"Friend, King",
				maxMoves:0
			},
			{
				location:"~01",
				requirement:"Empty"
			},
			{
				location:"~02",
				requirement:"Empty"
			},
			{
				location:"~03",
				requirement:"Friend, Rook",
				maxMoves:0
			}],
			moves:[
			new MetaRuleCondition({
				start:"~00",
				end:"~03"}),
			new MetaRuleCondition({
				start:"~03",
				end:"~00"})
			]
		}));
		rules.push(new MetaRule({
			grouped:true,
			direction : this.direction,
			groups:
			[{
				location:"~00",
				requirement:"Friend, King",
				maxMoves:0
			},
			{
				location:"~0-1",
				requirement:"Empty"
			},
			{
				location:"~0-2",
				requirement:"Empty"
			},
			{
				location:"~0-3",
				requirement:"Friend, Rook",
				maxMoves:0
			}],
			moves:[
			new MetaRuleCondition({
				start:"~00",
				end:"~0-3"}),
			new MetaRuleCondition({
				start:"~0-3",
				end:"~00"})
			]
		}));
		rules.push(new MetaRule({
			grouped:true,
			direction : this.direction,
			groups:
			[{
				location:"~00",
				requirement:"Friend, King",
				maxMoves:0
			},
			{
				location:"~0-1",
				requirement:"Empty"
			},
			{
				location:"~0-2",
				requirement:"Empty"
			},
			{
				location:"~0-3",
				requirement:"Empty"
			},
			{
				location:"~0-4",
				requirement:"Friend, Rook",
				maxMoves:0
			}],
			moves:[
			new MetaRuleCondition({
				start:"~00",
				end:"~0-4"}),
			new MetaRuleCondition({
				start:"~0-4",
				end:"~00"})
			]
		}));*/
	}
});

var Knight = Piece.extend(
{
	initialize:function()
	{
		Piece.prototype.initialize.apply(this, arguments);
		this.set("pieceName", "Knight");

		var rules = this.get("rules");

		//Vertical & Horizontal
		rules.push(new Rule({
			destinationRequirement:"Empty, Opponent",
			iterations:1,
			deltas:[new Position(1, 2), 
					new Position(-1, 2), 
					new Position(1, -2), 
					new Position(-1, -2), 
					new Position(2, 1), 
					new Position(-2, 1),
					new Position(2, -1), 
					new Position(-2, -1)]
		}));
	}
});








var GameBox = SandboxApp.Sandbox.extend(
{
	initialize:function()
	{
		this.prepTemplates();
	},
	prepTemplates:function()
	{
		var templates = ["template_board", "template_square", "template_piece"];
		_.each(templates,function(template){
			this.store(template, Handlebars.compile($("#"+template).html()));
		},this);		
	}
});

var GameBox_View = SandboxApp.NestedView.extend(
{
	initialize:function(options)
	{
		SandboxApp.NestedView.prototype.initialize.apply(this,arguments);
		var t = this;

		$("#startBtn").on("click", function(){
			t.sandbox.trigger("setupGame");
		});

	}
});


var gameBox = new GameBox();

var gameBoxView;

var board = new Board({
	sandbox:gameBox,
	rankCount:8,
	fileCount:8
});

var boardView = new Board_View({
	sandbox:gameBox,
	collection:board
});


var game = new Game({
	sandbox:gameBox
});
game.giveBoard(board);

var gameView = new Game_View({
	sandbox:gameBox,
	collection:game,
	boardView:boardView
})



$(document).ready(function(){

gameBoxView = new GameBox_View({
	sandbox:gameBox
});

boardView.render().$el.appendTo("#board1");



gameView.render();


});