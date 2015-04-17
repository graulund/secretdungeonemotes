// ==UserScript==
// @name        Secret Dungeon Emotes
// @namespace   graulund.github.io
// @description Secret Dungeon Emotes: A set of cool (in-joke) emoticons that you can use anywhere on Twitch.

// @include	*.twitch.tv/*
// @exclude api.twitch.tv/*

// @version 2.1
// @updateURL http://raw.githubusercontent.com/walle303/secretdungeonemotes/gh-pages/dungeonemotes.user.js
// @grant       none
// @run-at      document-end
// ==/UserScript==

function sdeLoad()
{
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.src = "//raw.githubusercontent.com/walle303/secretdungeonemotes/gh-pages/sde.js";
	document.getElementsByTagName("head")[0].appendChild(script);
}

sdeLoad();
