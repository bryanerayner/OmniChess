



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
	defaults:
	initialize:function(options)
	{
		this.sandbox = options.sandbox;
	}
})


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