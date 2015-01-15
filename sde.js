// ▼ ◄ ▲ ► ▼ ◄ ▲ ► ▼ ◄ ▲ ► ▼ ◄ ▲ ► ▼ ◄ ▲ ▼ ◄ ▲ ► ▼ ◄ ▲ ► ▼ ◄▼ ◄ ▲ ► ▼ ◄ ▲ ► ▼
// ◄ ▲ ► ▼ ▼ ◄ Sorry, I've dropped my bag of Doritos™ brand chips ▲ ► ▼ ◄ ▲ ► 
// ▲ ► ▼ ◄ ▲ ► ▼ ◄ ▲ ▼ ◄ ▲ ► ▼ ◄ ▲ ► ▼ ◄ ▲ ► ▼ ◄ ▲ ► ▼ ► ▼ ◄ ◄ ▲▲ ► ▼ ◄▼ ◄ ◄ ▼ 

/*
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
 
 // BIG shoutouts to the original TPP chat filter script. Good pointers.
 
var sde = (function(){
	"use strict";

	var SDE_VERSION = "2.0.1";

	var wnd = window, tries = 0, sdEmoticons = [], sdeFfzOffset = 900, sdeFfzName = "_sde"

	var console = wnd.console

	console.log("SDE preload: Hello from " + location.href + "!")

	var hasFrankerFaceZ = function(){
		return (typeof wnd.ffz != "undefined")
	}

	if(hasFrankerFaceZ()){
		console.log("SDE: FrankerFaceZ detected!")
	}

	var init = function(){
		// Only proceed loading SDE until all the below exist
		var loaded =
			typeof wnd.Ember != "undefined" &&
			typeof wnd.App != "undefined" &&
			typeof wnd.jQuery != "undefined"

		if(!loaded){
			// Try again only 10 times
			if(tries++ >= 10){
				console.warn("SDE: Twitch Ember not detected in " + location + ". Aborting everything.")
			} else {
				// Try again in 5 secs
				setTimeout(init, 5000)
			}
		} else {
			// Waiting 2 seconds to help get FFZ to load if needed
			setTimeout(go, 2000)
		}
	}

	var getEmoteList = function(callback){
		return $.ajax({
			url: "https://graulund.github.io/secretdungeonemotes/dungeonemotes.json",
			dataType: "jsonp",
			jsonpCallback: "sde_jsonp_static"
		}).done(callback).fail(function(jqXHR, textStatus, errorThrown){
			console.error("SDE: Error occured retrieving emote data! " + errorThrown)
		})
	}

	var go = function(){
		var $ = wnd.jQuery

		console.log("Secret Dungeon Emotes version " + SDE_VERSION + " launched");

		// Do it!

		var App = wnd.App, sdeManager = null, sdeEmoteList = [], sdeChannels = {},
			sdeFfzList = {}, hasBTTV = ("BTTVLOADED" in window && window.BTTVLOADED)

		// Prerequisites (Thanks to FrankerFaceZ!)

		var ext = {
			alive: true,
			log: function(){
				if(arguments.length > 0 && typeof arguments[0] == "string"){
					arguments[0] = "Dungeon Emotes: " + arguments[0]
				}
				console.log.apply(console, arguments)
			},
			get_manager: function(manager) {
				sdeManager = manager;
				/*for(var key in this.emotesets) {
				 if ( this.emotesets.hasOwnProperty(key) )
				 manager.emoticonSets[key] = this.emotesets[key];
				 }*/
				this.log("Setting emoticons in manager", manager)
				manager.emoticonSets[sdeSetId] = sdeEmoteList
			},

			// Channel management
			add_channel: function(id, room) {
				if ( !this.alive ) return;
				this.log("Registered channel: " + id);
				sdeChannels[id] = {id: id, room: room, tmi: null, style: null};
				// Load the emotes for this channel.
				//this.load_emotes(id);
			},

			remove_channel : function(id) {
				var chan = sdeChannels[id];
				if ( !chan ) return;

				this.log("Removing channel: " + id);

				// Unload the associated emotes.
				this.unload_emotes(id);

				// If we have a tmiRoom for this channel, restore its getEmotes function.
				if ( chan.tmi )
					delete chan.tmi.getEmotes;

				// Delete this channel.
				sdeChannels[id] = false;
			},

			alter_channel_tmi : function(id, tmi) {
				var chan = sdeChannels[id], f = this;
				if ( !chan || !this.alive ) return;

				// Store the TMI instance.
				if ( chan.tmi) return;
				chan.tmi = tmi;

				var tp = tmi.__proto__.getEmotes.bind(tmi);
				tmi.getEmotes = function(name) {
					return _.union([sdeSetId], f.global_sets, tp(name)||[]);
				}
			},

			_modify_room: function(room) {
				var self = this;
				room.reopen({
					init: function() {
						this._super();
						self.add_channel(this.id, this);
					},

					willDestroy: function() {
						this._super();
						self.remove_channel(this.id);
					}
				});
			},

			modify_room: function() {
				var room = App.__container__.resolve("model:room");
				this._modify_room(room);

				var inst = room.instances;
				for(var n in inst) {
					if ( ! inst.hasOwnProperty(n) ) continue;
					var i = inst[n];
					this.add_channel(i.id, i);

					if (i.tmiRoom)
						this.alter_channel_tmi(i.id, i.tmiRoom);
					else if (i.viewers)
						this._modify_viewers(i.viewers);

					this._modify_room(i);
				}
			},
			_modify_viewers: function(vwrs) {
				var f = this;
				vwrs.reopen({
					tmiRoom: Ember.computed(function(key, val) {
						if ( arguments.length > 1 ) {
							this.tmiRoom = val;
							if ( f.alive )
								f.alter_channel_tmi(this.id, val);
						}
						return undefined;
					})
				});
			},
			modify_viewers: function() {
				this._modify_viewers(App.__container__.resolve("model:room").Viewers);
			},
			_modify_emotes: function(ec) {
				var self = this;
				ec.reopen({
					_emoticons: ec.emoticons || [],

					init: function() {
						this._super();
						self.get_manager(this)
					},

					emoticons: Ember.computed(function(key, val) {
						if ( arguments.length > 1 ) {
							this._emoticons = val;
							self.log("Twitch standard emoticons loaded.");
						}
						return _.union(this._emoticons, sdeEmoteList)
					})
				});
			},
			modify_emotes: function() {
				this._modify_emotes(App.__container__.resolve("controller:emoticons"));

				var ec = App.__container__.lookup("controller:emoticons");
				if ( ! ec ) return;

				this._modify_emotes(ec);
				this.get_manager(ec);
			}
		}

		var convertEmoticonList = function(){
			var list = []
			for(var i = 0; i < sdEmoticons.length; i++){
				var sdem = sdEmoticons[i]
				var regex = new RegExp("\\b" + sdem.name + "\\b", "g")
				var img = {
					width: sdem.width,
					height: sdem.height,
					url: sdem.url
				}
				list.push({
					name: sdem.name,
					regex: regex,
					isEmoticon: true,
					cls: "sde-emo-" + (i+1),
					image: img,
					images: [img]
				})
			}
			sdeEmoteList = list
		}

		var convertEmoticonListToFFZ = function(){
			var list = {}
			for(var i = 0; i < sdEmoticons.length; i++){
				var sdem = sdEmoticons[i]
				var regex = new RegExp("\\b" + sdem.name + "\\b", "g")
				var id = sdeFfzOffset + i
				list[id] = {
					extra_css: "",
					width: sdem.width,
					height: sdem.height,
					name: sdem.name,
					regex: regex,
					id: id,
					url: sdem.url,
					klass: "sde-emo-" + (i+1),
					margins: "",
					hidden: false
				}
			}
			sdeFfzList = list
		}

		var updateEmoticonCSS = function(){
			var styleId = "sde-styles", styleEl = $("style#" + styleId), cssText = ""
			if(styleEl.length <= 0){
				styleEl = $('<style id="' + styleId + '">')
				styleEl.attr("type", "text/css")
				$("head").eq(0).append(styleEl)
			}
			for(var i = 0; i < sdEmoticons.length; i++){
				var sdem = sdEmoticons[i], vertOffset = Math.max(0, sdem.height - 23)
				cssText += ".sde-emo-" + (i+1) +
					" { background-image: url(" + sdem.url +
					"); width: " + sdem.width
					+ "px; height: " + sdem.height + "px;" +
					(vertOffset > 0 ? " margin: -" + vertOffset +
						"px 0" : "") + " }\n"
			}
			styleEl.text(cssText)
		}

		var load = function(){

			if(hasFrankerFaceZ()){

				convertEmoticonListToFFZ()

				var ffz = wnd.ffz
				ffz.emote_sets[sdeFfzName] = {
					emotes: sdeFfzList,
					extra_css: null,
					global: true,
					id: sdeFfzName,
					users: []
				}
				ffz.global_sets.push(sdeFfzName)

				ext.log("Added set " + sdeFfzName + " to FrankerFaceZ")
			} else {
				ext.log("No FFZ, we're going solo")
				ext.modify_room()
				ext.modify_viewers()
				ext.modify_emotes()
			}
		}

		convertEmoticonList()
		updateEmoticonCSS()

		ext.log("Proceeding to load!")
		load()
	}

	// Load emoticons, then init

	var request = function(){
		var loaded = typeof wnd.jQuery != "undefined"

		if(!loaded){
			// Try again only 10 times
			if(tries++ >= 10){
				console.warn("SDE: jQuery not detected in " + location + ". Aborting everything.")
			} else {
				// Try again in 2 secs
				setTimeout(request, 2000)
			}
		} else {
			getEmoteList(function(data){
				if(typeof data == "object" && data instanceof Array){
					console.log("Dungeon Emotes: Downloaded emoticon list!")
					sdEmoticons = data
					tries = 0
					init()
				} else {
					console.warn("Could not initialise SDE; ill data object received")
				}
			})
		}
	}

	request()

	return {
		getEmoteList: getEmoteList,
		emoteList: function(){ return sdEmoticons },
		tries: function(){ return tries },
		setId: function(){ return sdeSetId }
	}

})();
