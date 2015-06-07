/*
 * YouTube TV
 *
 * Copyright 2013, Jacob Kelley - http://jakiestfu.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  
 * Version: 3.0.4
 */
/*jslint browser: true, undef:true, unused:true, laxbreak:true, loopfunc:true*/
/*global define, module, ender */

(function(win, doc) {
	'use strict';
	var apiKey = 'YOUR_API_KEY_HERE';
	var YTV = YTV || function(id, opts){

		var noop = function(){},
			settings = {
				element: null,
				user: null,
				channelId: null,
				fullscreen: false,
				accent: '#fff',
				controls: true,
				annotations: false,
				autoplay: false,
				chainVideos: true,
				browsePlaylists: false,
				playerTheme: 'dark',
				listTheme: 'dark',
				responsive: false,
				playId:'',
				sortList: false,
				reverseList: false,
				shuffleList: false,
				wmode: 'opaque',
				events: {
					videoReady: noop,
					stateChange: noop
				}
			},
			
			cache = {
				data: {},
				remove: function (url) {
					delete cache.data[url];
				},
				exist: function (url) {
					return cache.data.hasOwnProperty(url) && cache.data[url] !== null;
				},
				get: function (url) {
					return cache.data[url];
				},
				set: function (url, data) {
					cache.remove(url);
					cache.data[url] = data;
				}
			},
			utils = {
				events: {
					addEvent: function addEvent(element, eventName, func) {
						if (element.addEventListener) {
							return element.addEventListener(eventName, func, false);
						} else if (element.attachEvent) {
							return element.attachEvent("on" + eventName, func);
						}
					},
					removeEvent: function addEvent(element, eventName, func) {
						if (element.addEventListener) {
							return element.removeEventListener(eventName, func, false);
						} else if (element.attachEvent) {
							return element.detachEvent("on" + eventName, func);
						}
					},
					prevent: function(e) {
						if (e.preventDefault) {
							e.preventDefault();
						} else {
							e.returnValue = false;
						}
					}
				},
				addCSS: function(css){
					var head = doc.getElementsByTagName('head')[0],
						style = doc.createElement('style');
						style.type = 'text/css';
					if (style.styleSheet){
						style.styleSheet.cssText = css;
					} else {
						style.appendChild(doc.createTextNode(css));
					}
					head.appendChild(style);
				},
				addCommas: function(str){
					var x = str.split('.'),
						x1 = x[0],
						x2 = x.length > 1 ? '.' + x[1] : '',
						rgx = /(\d+)(\d{3})/;
					while (rgx.test(x1)) {
						x1 = x1.replace(rgx, '$1' + ',' + '$2');
					}
					return x1 + x2;
				},
				parentUntil: function(el, attr) {
					while (el.parentNode) {
						if (el.getAttribute && el.getAttribute(attr)){
							return el;
						}
						el = el.parentNode;
					}
					return null;
				},
				ajax: {
					get: function(url, fn){
						if (cache.exist(url)) {
							fn.call(this, JSON.parse(cache.get(url)));
						} else {
							var handle;
							if (win.XDomainRequest) { // Proper CORS for IE8,9
								handle = new XDomainRequest();
								handle.onload = function(){
									cache.set(url, handle.responseText);
									fn.call(this, JSON.parse(handle.responseText));
									if (Object.prototype.hasOwnProperty.call(JSON.parse(handle.responseText), 'error')){
										cache.remove(url);
										var e = JSON.parse(handle.responseText);
										console.log('Youtube-TV Error: Youtube API Response: '+e.error.errors[0].reason+'\n'+ 'Details: '+e.error.errors[0].message);
									}
								};
							} else if (win.XMLHttpRequest){ // Modern Browsers
								handle = new XMLHttpRequest(); 
							}
							handle.onreadystatechange = function(){
								if (handle.readyState === 4 && handle.status === 200){
									cache.set(url, handle.responseText);
									fn.call(this, JSON.parse(handle.responseText));
								} else if (handle.readyState === 4){
									var e = JSON.parse(handle.responseText);
									console.log('Youtube-TV Error: Youtube API Response: '+e.error.errors[0].reason+'\n'+ 'Details: '+e.error.errors[0].message);
								}
							};
							handle.open("GET",url,true);
							handle.send();
						}
					}
				},
				endpoints: {
					base: 'https://www.googleapis.com/youtube/v3/',
					userInfo: function(){
						return utils.endpoints.base+'channels?'+settings.cid+'&key='+apiKey+'&part=snippet,contentDetails,statistics';
					},
					playlistInfo: function(pid){
						return utils.endpoints.base+'playlists?id='+pid+'&key='+apiKey+'&maxResults=50&part=snippet';
					},
					userPlaylists: function(){
						return utils.endpoints.base+'playlists?channelId='+settings.channelId+'&key='+apiKey+'&maxResults=50&part=snippet';
					},
					playlistVids: function(){
						return utils.endpoints.base+'playlistItems?playlistId='+settings.pid+'&key='+apiKey+'&maxResults=50&part=contentDetails';
					},
					videoInfo: function(){
						return utils.endpoints.base+'videos?id='+settings.videoString+'&key='+apiKey+'&maxResults=50&part=snippet,contentDetails,status,statistics';
					}
				},
				deepExtend: function(destination, source) {
					var property;
					for (property in source) {
						if (source[property] && source[property].constructor && source[property].constructor === Object) {
							destination[property] = destination[property] || {};
							utils.deepExtend(destination[property], source[property]);
						} else {
							destination[property] = source[property];
						}
					}
					return destination;
				}
			},
			prepare = {
				youtube: function(){
					if(typeof YT=='undefined'){
						var tag = doc.createElement('script');
						tag.src = "https://www.youtube.com/iframe_api";
						var firstScriptTag = doc.getElementsByTagName('script')[0];
						firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
					}
				},
				build: function(){
					if (settings.channelId){
						settings.cid = 'id='+settings.channelId;
					} else if(settings.user){
						settings.cid = 'forUsername='+settings.user;
					}
					settings.element.className = "ytv-canvas";
					if(settings.fullscreen){
						settings.element.className += " ytv-full";
					}
					utils.addCSS( '#'+id+' .ytv-list .ytv-active a{border-left-color: '+(settings.accent)+';}' );
					// Responsive CSS
					if(settings.responsive){
						utils.addCSS('#'+id+' .ytv-video{'
							+'position: relative; padding-bottom: 39.4%; /* 16:9 of 70%*/'
							+'height: 0; width: 70%;'
							+'} #'+id+' .ytv-video iframe{'
							+'position: absolute; top: 0; left: 0;'
							+'} #'+id+' .ytv-list{'
							+'width: 30%;'
							+'} #'+id+' .ytv-playlist-open .ytv-arrow{'
							+'top: 0px;}'
							+'@media only screen and (max-width:992px) {'
							+'#'+id+' .ytv-list{'
							+'position: relative; display: block;'
							+'width: 0; padding-bottom: 40%;'
							+'left: auto; right: auto;'
							+'top: auto; width: 100%;'
							+'} #'+id+' .ytv-video{'
							+'position: relative; padding-bottom: 56.25%; /* 16:9 */'
							+'height: 0; position: relative;'
							+'display: block; left: auto;'
							+'right: auto; top: auto; width: 100%;'
							+'}}'
							);
					}
					// Temp Scroll Bar fix
					if (settings.listTheme == 'dark'){
						utils.addCSS( ' #'+id+'.ytv-canvas ::-webkit-scrollbar{border-left: 1px solid #000;}'
							+ ' #'+id+'.ytv-canvas ::-webkit-scrollbar-thumb{background: rgba(255,255,255,0.2);}');
					}
					// Optional Light List Theme
					if(settings.listTheme == 'light'){
						utils.addCSS( ' #'+id+'.ytv-canvas{background: #ccc;}'
							+ ' #'+id+'.ytv-canvas ::-webkit-scrollbar{border-left: 1px solid rgba(28,28,28,0.1);}'
							+ ' #'+id+'.ytv-canvas ::-webkit-scrollbar-thumb{background: rgba(28,28,28,0.3);}'
							+ ' #'+id+' .ytv-list .ytv-active a{background: rgba(0,0,0,0.2);}'
							+ ' #'+id+' .ytv-list a{color: #282828; border-top: 1px solid rgba(0,0,0,0.1); border-bottom: 1px solid rgba(204,204,204,0.5);}'
							+ ' #'+id+' .ytv-list a:hover, #'+id+' .ytv-list-header .ytv-playlists a:hover{ background: rgba(0,0,0,0.2);}'
							+ ' #'+id+' .ytv-list a:active, #'+id+' .ytv-list-header .ytv-playlists a:active{ background: rgba(0,0,0,0.2);}'
							+ ' #'+id+' .ytv-list .ytv-thumb-stroke{outline: 1px solid rgba(0,0,0,0.1);}'
							+ ' #'+id+' .ytv-list .ytv-thumb{outline: 1px solid rgba(255,255,255,0.5);}'
							+ ' #'+id+' .ytv-list-header{-webkit-box-shadow: 0 1px 2px rgba(255, 255, 255, 0.2); -moz-box-shadow: 0 1px 2px rgba(255, 255, 255, 0.2); box-shadow: 0 1px 2px rgba(255, 255, 255, 0.2);}'
							+ ' #'+id+' .ytv-list-header a{background: rgba(0,0,0,0.2);}'
							+ ' #'+id+' .ytv-playlists{background: #ccc;}'
							);
					}
				},
				userUploads: function(userInfo){
					if (userInfo && userInfo.items.length > 0){
						settings.pid = userInfo.items[0].contentDetails.relatedPlaylists.uploads;
						utils.ajax.get( utils.endpoints.playlistVids(), prepare.compileVideos );
					} else console.log ('Youtube-TV Error: API returned no matches for: '+(settings.channelId ? settings.channelId : settings.user)+'\nPlease ensure it was entered correctly and in the appropriate field shown below. \nuser: \'username\' or channelId: \'UCxxxx...\'');
				},
				selectedPlaylist: function(playlistInfo){
					if (playlistInfo && playlistInfo.items.length > 0) {
						if (!settings.channelId && !settings.user){
							settings.cid = ('id='+(settings.channelId = playlistInfo.items[0].snippet.channelId));
						}
						settings.currentPlaylist = playlistInfo.items[0].snippet.title;
						settings.pid = playlistInfo.items[0].id;
						utils.ajax.get( utils.endpoints.playlistVids(), prepare.compileVideos );
					} else console.log ('Youtube-TV Error: API returned no matches for playlist(s): '+settings.playlist);
				},
				compileVideos: function(res){
					if (res && res.items.length > 0){
						var playlists = res.items,
						i;
						settings.videoString = '';
						for(i=0; i<playlists.length; i++){
							settings.videoString += playlists[i].contentDetails.videoId;
							if (i<playlists.length-1){ settings.videoString += ',';}
						}
						utils.ajax.get( utils.endpoints.videoInfo(), prepare.compileList );
					} else console.log ('Youtube-TV Error: Empty playlist');
				},
				playlists: function(res){
					if(res && res.items.length > 0){
						var list = '<div class="ytv-playlists"><ul>',
							playlists = res.items,
							i;
						for(i=0; i<playlists.length; i++){
							var data = {
								title: playlists[i].snippet.title,
								plid: playlists[i].id,
								thumb: playlists[i].snippet.thumbnails.medium.url
							};
							list += '<a href="#" data-ytv-playlist="'+(data.plid)+'">';
								list += '<div class="ytv-thumb"><div class="ytv-thumb-stroke"></div><img src="'+(data.thumb)+'"></div>';
								list += '<span>'+(data.title)+'</span>';
							list += '</a>';
						}
						list += '</ul></div>';
						
						var lh = settings.element.getElementsByClassName('ytv-list-header')[0],
							headerLink = lh.children[0];
						headerLink.href="#";
						headerLink.target="";
						headerLink.setAttribute('data-ytv-playlist-toggle', 'true');
						settings.element.getElementsByClassName('ytv-list-header')[0].innerHTML += list;
						lh.className += ' ytv-has-playlists';
					} else console.log ('Youtube-TV Error: Returned no playlists');
				},
				compileList: function(data){
					if(data && data.items.length > 0){
						utils.ajax.get( utils.endpoints.userInfo(), function(userInfo){
							var list = '',
								user = {
									title: userInfo.items[0].snippet.title,
									url: '//youtube.com/channel/'+userInfo.items[0].id,
									thumb: userInfo.items[0].snippet.thumbnails['default'].url,
									summary: userInfo.items[0].snippet.description,
									subscribers: userInfo.items[0].statistics.subscriberCount,
									views: userInfo.items[0].statistics.viewCount
								},
								videos = data.items,
								first = true,
								i;
							settings.channelId = userInfo.items[0].id; 
							if(settings.currentPlaylist) user.title += ' &middot; '+(settings.currentPlaylist);
							if (settings.sortList) videos.sort(function(a,b){if(a.snippet.publishedAt > b.snippet.publishedAt) return -1;if(a.snippet.publishedAt < b.snippet.publishedAt) return 1;return 0;});
							if (settings.reverseList) videos.reverse();
							if (settings.shuffleList) {
								videos = function (){for(var j, x, i = videos.length; i; j = Math.floor(Math.random() * i), x = videos[--i], videos[i] = videos[j], videos[j] = x);return videos;}();
							}

							list += '<div class="ytv-list-header">';
								list += '<a href="'+(user.url)+'" target="_blank">';
									list += '<img src="'+(user.thumb)+'">';
									list += '<span><i class="ytv-arrow down"></i>'+(user.title)+'</span>';
								list += '</a>';
							list += '</div>';
							
							list += '<div class="ytv-list-inner"><ul>';
							for(i=0; i<videos.length; i++){
								if(videos[i].status.embeddable){
									var video = {
										title: videos[i].snippet.title,
										slug: videos[i].id,
										link: 'https://www.youtube.com/watch?v='+videos[i].id,
										published: videos[i].snippet.publishedAt,
										stats: videos[i].statistics,
										duration: (videos[i].contentDetails.duration),
										thumb: videos[i].snippet.thumbnails.medium.url
									};
									
									var durationString = video.duration.match(/[0-9]+[HMS]/g);
									var h = 0, m = 0, s = 0, time = '';
									durationString.forEach(function (duration) {
										var unit = duration.charAt(duration.length-1);
										var amount = parseInt(duration.slice(0,-1));
										switch (unit) {
											case 'H': h = (amount > 9 ? '' + amount : '0' + amount); break;
											case 'M': m = (amount > 9 ? '' + amount : '0' + amount); break;
											case 'S': s = (amount > 9 ? '' + amount : '0' + amount); break;
										}
									});
									if (h){ time += h+':';}
									if (m){ time += m+':';} else { time += '00:';}
									if (s){ time += s;} else { time += '00';}
									
									var isFirst = '';
									if(settings.playId==video.slug){
										isFirst = ' class="ytv-active"';
										first = video.slug;
									} else if(first===true){
										first = video.slug;
									}

									list += '<li'+isFirst+'><a href="#" data-ytv="'+(video.slug)+'" class="ytv-clear">';
									list += '<div class="ytv-thumb"><div class="ytv-thumb-stroke"></div><span>'+(time)+'</span><img src="'+(video.thumb)+'"></div>';
									list += '<div class="ytv-content"><b>'+(video.title)+'</b>';
									if (video.stats)
									{
										list+='</b><span class="ytv-views">'+utils.addCommas(video.stats.viewCount)+' Views</span>';
									}
									list += '</div></a></li>';
								}
							}
							list += '</ul></div>';
							settings.element.innerHTML = '<div class="ytv-relative"><div class="ytv-video"><div id="ytv-video-player"></div></div><div class="ytv-list">'+list+'</div></div>';
							if(settings.element.getElementsByClassName('ytv-active').length===0){
								settings.element.getElementsByTagName('li')[0].className = "ytv-active";
							}
							var active = settings.element.getElementsByClassName('ytv-active')[0];
							active.parentNode.parentNode.scrollTop = active.offsetTop;
							action.logic.loadVideo(first, settings.autoplay);
							
							if (settings.playlist){
								utils.ajax.get( utils.endpoints.playlistInfo(settings.playlist), prepare.playlists );
							} else if(settings.browsePlaylists){
								utils.ajax.get( utils.endpoints.userPlaylists(), prepare.playlists );
							}
							
						});
					} else console.log ('Youtube-TV Error: Empty video list');
				}
			},
			action = {
				
				logic: {
					
					playerStateChange: function(d){
						console.log(d);
					},
					
					loadVideo: function(slug, autoplay){
						var house = settings.element.getElementsByClassName('ytv-video')[0];
						var counter = settings.element.getElementsByClassName('ytv-video-playerContainer').length;
						house.innerHTML = '<div id="ytv-video-player'+id+counter+'" class="ytv-video-playerContainer"></div>';
						
						cache.player = new YT.Player('ytv-video-player'+id+counter, {
							videoId: slug,
							events: {
								onReady: settings.events.videoReady,
								onStateChange: function(e){
									if( (e.target.getPlayerState()===0) && settings.chainVideos ){
										var ns = settings.element.getElementsByClassName('ytv-active')[0].nextSibling,
											link = ns.children[0];
										link.click();
									}
									settings.events.stateChange.call(this, e);
								}
							},
							playerVars: {
								enablejsapi: 1,
								origin: doc.domain,
								controls: settings.controls ? 1 : 0,
								rel: 0,
								showinfo: 0,
								iv_load_policy: settings.annotations ? '' : 3, 
								autoplay: autoplay ? 1 : 0,
								theme: settings.playerTheme,
								wmode: settings.wmode
							}
						});
					}
				},
				
				endpoints: {
					videoClick: function(e){
						var target = utils.parentUntil(e.target ? e.target : e.srcElement, 'data-ytv');
						if(target){
							if(target.getAttribute('data-ytv')){
								// Load Video
								utils.events.prevent(e);
								var activeEls = settings.element.getElementsByClassName('ytv-active'),
									i;
								for(i=0; i<activeEls.length; i++){
									activeEls[i].className="";
								}
								target.parentNode.className="ytv-active";
								action.logic.loadVideo(target.getAttribute('data-ytv'), true);
							}
						}
					},
					playlistToggle: function(e){
						var target = utils.parentUntil(e.target ? e.target : e.srcElement, 'data-ytv-playlist-toggle');
						if(target && target.getAttribute('data-ytv-playlist-toggle')){
							// Toggle Playlist
							utils.events.prevent(e);
							var lh = settings.element.getElementsByClassName('ytv-list-header')[0];
							if(lh.className.indexOf('ytv-playlist-open')===-1){
								lh.className += ' ytv-playlist-open';
							} else {
								lh.className = lh.className.replace(' ytv-playlist-open', '');
							}
						}
					},
					playlistClick: function(e){
						var target = utils.parentUntil(e.target ? e.target : e.srcElement, 'data-ytv-playlist');
						
						if(target && target.getAttribute('data-ytv-playlist')){
							
							// Load Playlist
							utils.events.prevent(e);
							
							settings.pid = target.getAttribute('data-ytv-playlist');
							target.children[1].innerHTML = 'Loading...';
							
							utils.ajax.get( utils.endpoints.playlistInfo(settings.pid), function(res){
								var lh = settings.element.getElementsByClassName('ytv-list-header')[0];
								lh.className = lh.className.replace(' ytv-playlist-open', '');
								prepare.selectedPlaylist(res);
							});
						}
					}
				},
				bindEvents: function(){
					utils.events.addEvent( settings.element, 'click', action.endpoints.videoClick );
					utils.events.addEvent( settings.element, 'click', action.endpoints.playlistToggle );
					utils.events.addEvent( settings.element, 'click', action.endpoints.playlistClick );
				}
			},
			
			initialize = function(id, opts){
				utils.deepExtend(settings, opts);
				settings.element = (typeof id==='string') ? doc.getElementById(id) : id;
				if(settings.element && (settings.user || settings.channelId || settings.playlist)){
					prepare.youtube();
					prepare.build();
					action.bindEvents();
					if (settings.playlist) {
						utils.ajax.get( utils.endpoints.playlistInfo(settings.playlist), prepare.selectedPlaylist );
					} else {
						utils.ajax.get( utils.endpoints.userInfo(), prepare.userUploads );
					}
				} else console.log ('Youtube-TV Error: Missing either user, channelId, or playlist');
			};

			/* Public */

			this.destroy = function(){
				utils.events.removeEvent( settings.element, 'click', action.endpoints.videoClick );
				utils.events.removeEvent( settings.element, 'click', action.endpoints.playlistToggle );
				utils.events.removeEvent( settings.element, 'click', action.endpoints.playlistClick );
				settings.element.className = '';
				settings.element.innerHTML = '';
			};
			this.fullscreen = {
				state: function(){
					return (settings.element.className).indexOf('ytv-full') !== -1;
				},
				enter: function(){
					if( (settings.element.className).indexOf('ytv-full') === -1 ){
						settings.element.className += 'ytv-full';
					}
				},
				exit: function(){
					if( (settings.element.className).indexOf('ytv-full') !== -1 ){
						settings.element.className = (settings.element.className).replace('ytv-full', '');
					}
				}
			};
			
		initialize(id, opts);
	};

	if ((typeof module !== 'undefined') && module.exports) {
		module.exports = YTV;
	}
	if (typeof ender === 'undefined') {
		this.YTV = YTV;
	}
	if ((typeof define === "function") && define.amd) {
		define("YTV", [], function() {
			return YTV;
		});
	}
	if ((typeof jQuery !== 'undefined')) {
		jQuery.fn.extend({
			ytv: function(options) {
				return this.each(function() {
					new YTV(this.id, options);
				});
			}
		});
	}
}).call(this, window, document);
