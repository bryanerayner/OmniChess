



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

var alpha = ["_","A","B","C","D","E","F","G","H"];

function numToAlpha(num)
{
	return alpha[num];
}
function alphaToNum(letter)
{
	return _.indexOf(alpha, letter);
}


var Board = Backbone.Collection.extend({
	initialize:function(options){
		this.rankCount = options.rankCount;
		this.fileCount = options.fileCount;

		
	},

	reset:function(){
		Backbone.Collection.prototype.reset.call(this);

		for (var r = 0, rr = this.rankCount; r < rr; r++) {
			for (var f = 0, ff = this.fileCount; f < ff; f++) {
				this.add(new Square({rank:r+1, file:numToAlpha(f+1)}));
			};			
		};
		
	},

	references:function()
	{
		var ret = [];
		for (var r = 0, rr = this.rankCount; r < rr; r++) {
			for (var f = 0, ff = this.fileCount; f < ff; f++) {
				var rank= r+1;
				ret.push(numToAlpha(f+1)+rank);
			};			
		};
		return ret;
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
		var ranks = this.collection.ranks();
		ranks = _.map(ranks, function(rank){
			var files = this.collection.files();
			var newFiles = [];
			_.each(files, function(file){
				newFiles.push({
					rank:rank,
					file:file
				});
			});
			return {
				"fileName":newFiles[rank-1].file,
				"rankName":rank,
				"files":newFiles
			};
		},this);
		return {"ranks":ranks};
	}
});



var Game = Backbone.Model.extend(
{
	initialize:function(options)
	{
		this.sandbox = options.sandbox;

		this.listenTo(this.sandbox, "request:click", this.requestClick);
	},

	requestClick:function(reference)
	{
		alert(reference);
	}
})



var Piece = Backbone.Model.extend({
	defaults:function()
	{
		return{
			location:"NULL",
			type:"NULL",
			rules:[],
			king: false,
			direction:1
		}
	},
	initialize:function(options)
	{
		this.sandbox = options.sandbox;
		this.set("direction", options.direction || 1);
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
			
			destinationRequirement:"Any",//"Empty", "Opponent", "Any", may use lists
			maxMoves:Infinity, //How many moves maximum can the piece have taken?
			legalLocations:["*"] //Where is this legal to move from?
			//+01 indicates an addition of one space from the starting point in the y dimension
		};
		this.iterations = Infinity || options.iterations;//How many iterations?
		this.deltas = [];//Changes in direction
 		this.transform = false || options.transform;//Do you get to transform this piece at the end?

		_.extend(this.condition, _.pick(options, "destinationRequirement","maxMoves","legalLocations"));

		if (options.deltas)
		{
			for (var i = 0, ii = options.deltas.length; i < ii; i ++)
			{
				this.deltas.push(options.deltas[i]);
			}
		}
	},

	//Is this rule able to be played given the start and end locations?
	legal:function(start, end)
	{

	},

	//Execute the rule.
	execute:function(start, end)
	{

	},

	//Return an expanded list of locations
	locations:function()
	{

	}
});


var Pawn = Piece.extend(
{
	initialize:function(options)
	{
		Piece.prototype.initialize.apply(this, arguments);

		var rules = this.get("rules");

		//Move two at the start
		rules.push(new Rule({
			destinationRequirement:"Empty",
			maxMoves:0,
			iterations: 1,
			legalLocations:["*"],
			deltas:[new Position(0, 2)]
		}));
		//Move forward at any time.
		rules.push(new Rule({
			destinationRequirement:"Empty",
			iterations: 1,
			legalLocations:["*"],
			deltas:[new Position(0, 1)]
		}));
		//Captures.
		rules.push(new Rule({
			destinationRequirement:"Opponent",
			iterations: 1,
			legalLocations:["*"],
			deltas:[new Position(1, 1), new Position(-1, 1)]
		}));

		//Transformation at the end.
		rules.push(new Rule({
			destinationRequirement:"Empty",
			iterations: 1,
			transform:true,
			legalLocations:["-*0"],
			deltas:[new Position(0, 1)]
		}));
		rules.push(new Rule({
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

		var rules = this.get("rules");

		//Vertical & Horizontal
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

		var rules = this.get("rules");

		//Vertical & Horizontal
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
	}
});

var Knight = Piece.extend(
{
	initialize:function()
	{
		Piece.prototype.initialize.apply(this, arguments);

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
}	);

var gameBox = new GameBox();


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

$(document).ready(function(){

boardView.render().$el.appendTo("#board1");




});