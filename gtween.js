/*!
 * gtween.js
 * Copyright (c) 2010 Josh Tynjala
 * Licensed under the MIT license.
 *
 * Based on GTween for ActionScript 3
 * http://gskinner.com/libraries/gtween/
 * Copyright (c) 2009 Grant Skinner
 * Released under the MIT license.
 */
var GTween = (function()
{
	var savedInterval;
	var savedTweens = [];
	var lastUpdateTime;
	
	function registerTween(tween)
	{
		savedTweens.push(tween);
		if(savedTweens.length == 1)
		{
			lastUpdateTime = new Date().getTime() / 1000;
			savedInterval = setInterval(updateTweens, 1000 / GTween.fps);
		}
	}
	
	function unregisterTween(tween)
	{
		savedTweens.splice(savedTweens.indexOf(tween), 1);
		if(savedTweens.length == 0)
		{
			clearInterval(savedInterval);
			savedInterval = null;
		}
	}
	
	function updateTweens()
	{
		var now = new Date().getTime() / 1000;
		var offset = now - lastUpdateTime;
		var savedTweensCopy = savedTweens.concat();
		var tweenCount = savedTweensCopy.length;
		for(var i = 0; i < tweenCount; i++)
		{
			var tween = savedTweensCopy[i];
			tween.setPosition(tween.position + offset);
		}
		lastUpdateTime = now;
	}
	
	var GTween = function(target, duration, values, props)
	{
		//private variables
		var inited = false;
		var interval;
		var isPlaying = false;
		var lastUpdateTime = 0;
		var ratio;
		var calculatedPosition;
		var positionOld;
		var ratioOld;
		var calculatedPositionOld;
		var values;
		var initValues;
		var rangeValues;

		//public variables
		this.autoPlay = true;
		this.delay = 0;
		this.duration = 1;
		this.fps = 60;
		this.ease = function(a)
		{
			return a;
		};
		this.nextTween = null;
		this.onInit = null;
		this.onChange = null;
		this.onComplete = null;
		this.position = 0;
		this.repeatCount = 1;
		this.reflect = false;
		this.suppressEvents = false;
		this.target = null;
		
		var that = this;
		function copy(o1, o2, smart)
		{
			for(var n in o1)
			{
				if(!o1.hasOwnProperty(n))
				{
					continue;
				}
				if(smart && o1[n] == null)
				{
					delete(o2[n]);
				}
				else
				{
					o2[n] = o1[n];
				}
			}
			return o2;
		}
		
		function resetValues(newValues)
		{
			values = {};
			setValues(newValues);
		}
		
		function getValues()
		{
			return copy(values, {});
		}
		
		function setValues(newValues)
		{
			copy(newValues, values, true);
			invalidate();
		}
		
		function invalidate()
		{
			inited = false;
			if(that.position > 0 || isNaN(that.position))
			{
				that.position = 0;
			}
			if(that.autoPlay)
			{
				that.play();
			}
		}
		
		function init()
		{
			inited = true;
			initValues = {};
			rangeValues = {};
			for(var n in values)
			{
				if(!values.hasOwnProperty(n))
				{
					continue;
				}
				rangeValues[n] = values[n] - (initValues[n] = that.target[n]);
			}
			if(!that.suppressEvents)
			{
				if(that.onInit != null)
				{
					that.onInit(this);
				}
			}
		}
		
		this.play = function()
		{
			if(isPlaying)
			{
				return;
			}
			isPlaying = true;
			if(isNaN(this.position) || (this.repeatCount != 0 && this.position >= this.repeatCount * this.duration))
			{
				// reached the end, reset.
				inited = false;
				calculatedPosition = calculatedPositionOld = ratio = ratioOld = positionOld = 0;
				this.position = -this.delay;
			}
			registerTween(this);
		};
		this.pause = function()
		{
			if(!isPlaying)
			{
				return;
			}
			isPlaying = false;
			unregisterTween(this);
		};
		this.beginning = function()
		{
			this.setPosition(0);
			this.pause();
		};
		this.end = function()
		{
			if(this.repeatCount > 0)
			{
				this.setPosition(this.repeatCount * this.duration);
			}
			else
			{
				this.setPosition(this.duration);
			}
		};
		this.setPosition = function(value)
		{
			positionOld = this.position;
			ratioOld = ratio;
			calculatedPositionOld = calculatedPosition;
			
			var maxPosition = this.repeatCount * this.duration;
			
			var end = (value >= maxPosition && this.repeatCount > 0);
			if(end)
			{
				if(calculatedPositionOld == maxPosition)
				{
					return;
				}
				this.position = maxPosition;
				calculatedPosition = (this.reflect && !(this.repeatCount & 1)) ? 0 : this.duration;
			}
			else
			{
				this.position = value;
				if(this.position < 0)
				{
					calculatedPosition = 0;
				}
				else
				{
					calculatedPosition = this.position % this.duration;
				}
				if(this.reflect && (this.position / this.duration & 1))
				{
					calculatedPosition = this.duration - calculatedPosition;
				}
			}
				
			if(this.duration == 0 && this.position >= 0)
			{
				ratio = 1;
			}
			else
			{
				ratio = this.ease(calculatedPosition / this.duration, 0, 1, 1);
			}
			if(this.target && (this.position >= 0 || positionOld >= 0) && calculatedPosition != calculatedPositionOld)
			{
				if(!inited)
				{
					init();
				}
				for(var n in values)
				{
					if(!values.hasOwnProperty(n))
					{
						continue;
					}
					var initVal = initValues[n];
					var rangeVal = rangeValues[n];
					var val = initVal + rangeVal * ratio;
					this.target[n] = val;
				}
			}
			
			if(!this.suppressEvents)
			{
				if(this.onChange != null)
				{
					this.onChange(this);
				}
			}
			
			if(end)
			{
				this.pause();
				if(this.nextTween)
				{
					this.nextTween.play();
				}
				if(!this.suppressEvents)
				{
					if(this.onComplete != null)
					{
						this.onComplete(this);
					}
				}
			}
		}
		
		this.target = target;
		this.duration = (!duration && duration !== 0) ? 1 : duration;
		copy(props, this);
		if(this.delay != 0)
		{
			this.position = -this.delay;
		}
		resetValues(values);
		if(this.duration == 0 && this.delay == 0 && this.autoPlay)
		{
			this.setPosition(0);
		}
	};
	GTween.fps = 60;
	return GTween;
})();