var arr = [];
slice = arr.slice;


var V3 = function(x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.calcLength();
}

_.extend(V3.prototype, {

	calcLength:function(){
		this.length = Math.sqrt(this.dot(this));
		return this;
	},

	normalize:function()
	{

		this.calcLength();
		if (this.length != 0) {
			var params = ["x", "y", "z"];
			_.each(params, function(param){
				this[param] = this[param]/this.length;
			},this);
			this.calcLength();
		}
		return this;
	},

	add:function(V)
	{
		return new V3(this.x + V.x, this.y + V.y, this.z + V.z);
	},
	subtract:function(V)
	{
		return new V3(this.x - V.x, this.y - V.y, this.z - V.z);	
	},
	mult:function(unit)
	{
		if (_.isFinite(unit))
		{
			return new V3(this.x * unit, this.y * unit, this.z * unit);
		}
	},
	divide:function(unit)
	{
		if (_.isFinite(unit))
		{
			return new V3(this.x / unit, this.y / unit, this.z / unit);
		}
	},
	dot:function(V)
	{
		return (this.x * V.x)+(this.y * V.y)+(this.z * V.z);
	},
	angleBetween:function(V)
	{
		var vec = new V3(V.x,V.y,V.z).normalize();
		var self = new V3(this.x,this.y,this.z).normalize();
		var len = ((vec.length * self.length));
		if (len == 0) {return 0;}
		var acosCalc = vec.dot(self) / len;
		acosCalc = Math.min(acosCalc, 1);
		acosCalc = Math.max(acosCalc, -1);
		
		return Math.acos(acosCalc); 
	},

	sum:function()
	{
		var args = arguments;
		var V = args[0];
		if (_.isArray(V)){V = V[0];}
		
		if (args.length > 1)
		{
			var Sum = V.add(this);
			return Sum.sum.apply(Sum,slice.call(args, 1));
		}
		else
		{
			return this.add(V);
		}
	},
	average:function()
	{
		var args = arguments;
		var sum = this.sum.apply(this, args);
		var len = arguments.length;
		if (_.isArray(args[0])){len = args[0].length;}
		return sum.divide(len);
	},
	//Return a 2d Radial of this function.
	toRadial:function()
	{
		var me2d = new V3(this.x, this.y, 0);
		return {
			length: me2d.length,
			angle: me2d.angleBetween(new V3(1,0,0))
		};
	},

	fromRadial:function(angle, length)
	{
		return new V3(Math.cos(angle) * length, Math.sin(angle) * length, 0);
	},

	//Limit this vector to be within a certain length
	limit:function(ammount)
	{
		if (this.length > ammount)
		{
			this.normalize();
			this.x = this.x *ammount;
			this.y = this.y *ammount;
			this.z = this.z *ammount;
		}
		return this;
	}
});


var Boid = function(div, position, color)
{
	this.configure.apply(this, arguments);
	this.initialize();
}

_.extend(Boid.prototype, {
	configure:function(div, position, color)
	{

		this.id = _.uniqueId("b");
		this.div = div.appendChild(document.createElement("div"));
		this.world = div;

		this.worldDimensions = new V3(
			parseInt(div.clientWidth),
			parseInt(div.clientHeight),
			0
			);

		this.div.classList.add("boid");
		this.div.classList.add("spin");

		if (color)
		{
			this.div.style.borderLeftColor = color;
		}

		position = (position || {x:0, y:0, z:0});
		position = _.defaults(position, {x:0, y:0, z:0});
		this.position = new V3(position.x, position.y, position.z);
		this.previousPosition = _.clone(this.position);
		this.velocity = new V3(0,0,0); 
		this.acceleration = new V3(0,0,0);
		this.direction = 0;
		this.speed = 0;
		this.rotation = new V3(0,0,0);
		
		//Behavioural variables
		this.sight = 100 + (30*Math.random());
		this.sightAngle = degToRad(80 + (40*Math.random()));
		this.avoidance = 30 + (25*Math.random());
		this.avoidanceAngle = degToRad(10 + (10*Math.random()));
		this.maxAccel = .8 + (.2 * Math.random());
		this.maxVel = 6 ;
		this.friends = [];//List of boids in range.


		this.rotationCSS = "";
	},

	initialize:function()
	{
		
		this.update();
		this.draw();
		this.velocity.x = 0;
		this.velocity.y = 0;
		this.acceleration.x = Math.random();
	},

	//Physics & Logic functions

	update:function()
	{
		var me = this;
		this.previousPosition = _.clone(this.position);
		this.position = this.position.add(this.velocity);
		this.velocity = this.velocity.add(this.acceleration).mult(0.9);
		this.acceleration.limit(this.maxAccel);
		this.velocity.limit(this.maxVel);


		//Turn back in to the world.
		var pos = this.position;
		if (pos.x < 0)
		{
			this.position.x = this.worldDimensions.x;
			this.friends = null;
			this.friends = [];
		}
		if (pos.x > this.worldDimensions.x)
		{
			this.position.x = 0;
			this.friends = null;
			this.friends = [];
		}
		if (pos.y <= 0)
		{
			this.position.y = this.worldDimensions.y;
			this.friends = null;
			this.friends = [];
		}
		if (pos.y >= this.worldDimensions.y)
		{
			this.position.y = 0;
			this.friends = null;
			this.friends = [];
		}
	},

	inRange:function(boid)
	{
		var delta = boid.position.subtract(this.position);

		var distance = (delta.length < this.sight);


		var angle = (Math.abs(delta.angleBetween(this.acceleration)) < this.sightAngle); 


		return (distance && angle) ? true : false;
	},

	flock:function(){
		var oldAccel = this.acceleration.mult(1);
		this.friends = _.filter(this.friends, function(friend){return this.inRange(friend);}, this);
		if (this.friends.length <= 0) return;

		var positions = _.pluck(this.friends, "position");
		//If we're going to hit someone, let's get out of the way.
		var hitPoint = null;
		var willHit = !_.every(positions, function(position){
			var delta = position.subtract(this.position);
			if (delta.length > this.avoidance)
			{
				return true;
			}else
			{
				if (hitPoint)
				{
					hitPoint.average(position);
				}else
				{
					hitPoint = _.clone(position);
				}
			}
		}, this);
		if (willHit)
		{
			var delta = hitPoint.subtract(this.position);
			var rad = delta.toRadial();

			var meRad = this.velocity.toRadial();
			var newAngle = meRad.angle;
			if (meRad.angle < rad.angle )
			{
				newAngle -= this.avoidanceAngle;
			}

			this.acceleration = this.acceleration.fromRadial(newAngle, meRad.length);
        
		}
		//If not going to hit anybody, then we'll seek to go to the center. 
		else
		{
			var oldAngle = this.acceleration.toRadial();

			var goPos = this.position.average(positions);

			var delta = goPos.subtract(this.position);

			if (delta.length > this.avoidance)
			{
				this.acceleration = delta;
			}else
			{
				var directions = _.pluck(this.friends, "acceleration");

				var goAngle = this.acceleration.average(directions);

				this.acceleration = goAngle;
			}
			var newAngle = this.acceleration.toRadial();
			if (newAngle.angle < oldAngle.angle - (this.sightAngle/2))
			{
				this.acceleration = this.acceleration.fromRadial(oldAngle.angle - (this.sightAngle/2), newAngle.length);
			} 
			if (newAngle.angle > oldAngle.angle + (this.sightAngle/2))
			{
				this.acceleration = this.acceleration.fromRadial(oldAngle.angle + (this.sightAngle/2), newAngle.length);
			} 
			this.acceleration.limit(this.maxAccel);

		} 
		this.acceleration = oldAccel.average(this.acceleration.divide(10));
	},

	//Look at a boid and see if he should be our friend.
	lookAt:function(boid)
	{
		//If this boid is already our friend, return.
		if (_.contains(_.pluck(this.friends, "id"), boid.id)) {return;}

		if (this.inRange(boid)){
			this.friends.push(boid);
		}
	},

	//Graphics Functions

	draw:function () {
		var me = this;


		var translate = "translate("+me.position.x+"px,"+me.position.y+"px)";
		me.calculateRotation();
		var rotate = "rotateZ("+me.rotationCSS+")";

		me.clearTransform();
		me.addTransform(translate);
		me.addTransform(rotate);
		me.applyTransform();
	},

	calculateRotation:function()
	{

		var straight = new V3(1,0,0);
		var angle = this.velocity.angleBetween(straight) * (180/Math.PI);
		var quadrant = 0;
			if (this.velocity.y >= 0 && this.velocity.x >= 0)
			{
				quadrant = 1;
			}else if (this.velocity.y >= 0 && this.velocity.x < 0)
			{
				quadrant = 2;
			}else if (this.velocity.y < 0 && this.velocity.x < 0)
			{
				quadrant = 3;
			}else if (this.velocity.y < 0 && this.velocity.x >= 0)
			{
				quadrant = 4;
			}
		switch(quadrant)
		{
			case 1:
			break;
			case 2:
			//angle -= 90;
			break;
			case 3:
			case 4:
			angle = angle *-1; 
			break;
		}

		this.rotationCSS = "";
		this.rotationCSS = angle.toFixed() + "deg";
	},

	addTransform:function(transform)
	{
		this._transformText += " " + transform;
	},
	clearTransform:function()
	{
		this._transformText = "";
	},
	applyTransform:function()
	{
		this.stylePrefix("Transform", this._transformText);
	},
	stylePrefix:function(key, value)
	{
		stylePrefix(this.div.style, key, value);
	}
});


var BoidGroup = function(overlay)
{
	this.configure(overlay);
	this.initialize();
};

_.extend(BoidGroup.prototype, {
	configure:function(overlay)
	{
		this.world = overlay;
			this.worldDimensions = new V3(
		parseInt(this.world.clientWidth),
		parseInt(this.world.clientHeight),
		0
		);
		var me = this;
		//Make random boid on click
		/*
		this.world.parentNode.onclick = function(){
			me.add(new V3(Math.random()*me.worldDimensions.x,
				Math.random()*me.worldDimensions.y,
				0));
		}
		*/
		this.boids = [];

		this.updatePointer = -1;
		this.drawPointer = -1;
	},

	initialize:function()
	{
		this.update();
		this.draw();
	},

	update:function()
	{
		var me = this;

		_.each(this.boids, function(boid)
		{
			_.each(this.boids, function(oBoid)
			{
				if (oBoid.id != boid.id)
				{
					boid.lookAt(oBoid);
				}
			});
			boid.flock();
		}, this);

		_.each(this.boids, function(boid)
		{
			boid.update();
		});
		
		this.updatePointer = requestAnimationFrame(function(){
			me.update();
		});
	},


	draw:function () {
		var me = this;

		_.each(this.boids, function(boid)
		{
			boid.draw();
		});

		this.drawPointer = requestAnimationFrame(
			function(){
			me.draw();
		});
	},

	/*Add a new boid at a given location (V)*/
	add:function(V, color)
	{
		this.boids.push(new Boid(this.world, V, color));
		cancelAnimationFrame(this.updatePointer);
		cancelAnimationFrame(this.drawPointer);
		this.update();
		this.draw();
	}
})