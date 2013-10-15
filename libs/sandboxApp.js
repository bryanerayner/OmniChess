//     Sandbox.js 1.0.0

//     (c) 2010-2013 Bryan Rayner, DocumentCloud Inc.


(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Sandbox` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var Backbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Sandbox classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var SandboxApp;
  if (typeof exports !== 'undefined') {
    SandboxApp = exports;
  } else {
    SandboxApp = root.SandboxApp = {};
  }




  var Sandbox = SandboxApp.Sandbox = function()
  {
    this.configure();
    this.initialize();
  };

  _.extend(Sandbox.prototype, Backbone.Events, {
    configure:function()
    {
      this.attributes = {};
    },

    initialize:function()
    {

    },

    get:function(attribute)
    {
      return this.attributes[attribute];
    },

    store:function(attribute, value)
    {
      this.attributes[attribute] = value;
    },

    $:function(moduleId, selector)
    {
        return $(selector);
    },

    request:function(name, value)
    {
      this.trigger("request:"+name, value);
    }

  });


var NestedView = SandboxApp.NestedView = Backbone.View.extend({
  initialize:function(options)
  {
    this.parentView = options.parentView;
    this.module = options.module;
    this.sandbox = options.sandbox;
    this.template = null;
    this.subViews = {};
  },

  addSubView:function(name, view)
  {
    this.subViews[name] = view;
    view.parentView = this;
  },

  addSubViews:function(names, views)
  {
    if (names.length != views.length)
    {
      return;
    }
    if (!_.isArray(names) || !_.isArray(views))
    {
      for (var i = names.length - 1; i >= 0; i--) {
        this.addSubView(names[i],views[i]);
      };
    }
  },

  prepare:function()
  {
    if (this.model && this.model.attributes)
    {
      return this.model.attributes;
    }else if (this.renderData)
    {
      return _.result(this, "renderData");
    }else
    {
      return {};
    }
  },

  render:function(source)
  {
    if (source != "parent" && this.parentView)
    {
      this.parentView.render();
    }
    var template = this.sandbox.get(this.template)
    if (_.isFunction(template))
    {
      this.$el.html(template(this.prepare()));
      
      var me = this;
      for (var view in this.subViews)
      {
        this.$(".Subview_"+view).each(function(){
          me.subViews[view].render("parent").$el.appendTo($(this));
        });
      }
    }
    return this;
  }
})


  Sandbox.extend = Backbone.Model.extend;
}).call(this);