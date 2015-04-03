#APIv2 to APIv3 Reference Notes

## Youtube-TV Elements Chart

#### User (channel) Playlists
playlists = res.feed.entry
			res.feed.items

playlists | res.feed.entry | res.feed.items
--------- | -------------- | --------------

Element | Old Value | New Value
------- | --------- | ---------
title | .title.$t | .snippet.title
plid | .yt$playlistId.$t | .id
thumb | .media$group.media$thumbnail[1].url | .snippet.thumbnails.medium.url

playlists[i]	.title.$t 								(title)
					.snippet.title
				.yt$playlistId.$t 						(plid)
					.id
				.media$group.media$thumbnail[1].url 	(thumb)
					.snippet.thumbnails.medium.url

#### User (channel) Info
user

user | userInfo.entry | userInfo.items[0]
---- | -------------- | -----------------

Element | Old Value | New Value
------- | --------- | ---------
title | .title.$t | .snippet.title
url | .yt$username.$t | .id
thumb | .media$thumbnail.url | .snippet.thumbnails.default.url
summary | .summary.$t | .snippet.description
subscribers | .yt$statistics.subscriberCount | .statistics.subscriberCount
views | .yt$statistics.totalUploadViews | .statistics.viewCount
NEW | - | -
uploads | n/a | .contentDetails.relatedPlaylists.uploads

	userInfo.entry
	userInfo.items[0]
				.title.$t 								(title)
					.snippet.title
				.yt$username.$t 						(url: local+'//youtube.com/user/'+userInfo.entry.yt$username.$t)
					.id 						(url: 'https://youtube.com/channel/'+userInfo.id)
				.media$thumbnail.url 					(thumb)
					.snippet.thumbnails.default.url
				.summary.$t 							(summary)
					.snippet.description
				.yt$statistics.subscriberCount 			(subscribers)
					.statistics.subscriberCount
				.yt$statistics.totalUploadViews 		(views)
					.statistics.viewCount

				~ ADDED
					.contentDetails.relatedPlaylists.uploads

#### `NEW` Playlist Videos
playlistVideos = res.feed.items

playlistVideos | n/a | res.feed.items
-------------- | --- | --------------

Element | Old Value | New Value
------- | --------- | ---------
slug | n/a | .snippet.videoid

playlistVideos[i]	.snippet.videoid 					(slug)

#### Video Info
// data.feed  = playlist or uploaded
videos = data.feed.entry
			data.feed.items

videos | data.feed.entry | data.feed.items
------ | --------------- | ---------------

Element | Old Value | New Value
------- | --------- | ---------
title | .title.$t | .snippet.title
*slug | .media$group.yt$videoid.$t | .snippet.videoId
link | .link[0].href | n/a *use slug
published | .published.$t | .snippet.publishedAt
rating | .yt$rating | n/a *see statistics
stats | .yt$statistics | .statistics
duration | ( .media$group.yt$duration.seconds) | .contentDetails.duration
thumb | .media$group.media$thumbnail[1].url | .snippet.thumbnails.medium.url
NEW | - | -
embed | n/a | .status.embeddable


videos[i]		.title.$t 								(title)
					.snippet.title
				*	.media$group.yt$videoid.$t 				(slug)
				*		.snippet.videoId
				.link[0].href 							(link)
					## CREATE WITH VIDEO ID
				.published.$t 							(published)
					.snippet.publishedAt
				.yt$rating 								(rating)
					## now in statistics
				.yt$statistics 							(stats)
					.statistics
			(	.media$group.yt$duration.seconds) 		(duration)
					.contentDetails.duration
				.media$group.media$thumbnail[1].url 	(thumb)
					.snippet.thumbnails.medium.url
				## NEW
				.status.embeddable						(embed)


base: 	local+'//gdata.youtube.com/'
		'https://www.googleapis.com/youtube/v3/' *https required

#### base 

local+'//gdata.youtube.com/' | 'https://www.googleapis.com/youtube/v3/'
---------------------------- | ----------------------------------------

userInfo: 	
	utils.endpoints.base+'feeds/api/users/'+settings.user+'?v=2&alt=json';

	#Build
	if(settings.channelId){
		settings.user = 'id='+settings.channelId;
	} else if(settings.user){
		settings.user = 'forUsername='+settings.user;
	}
	#endpoint
	utils.endpoints.base+'channels?'+settings.user+'&key='+apiKey+'&part=snippet,contentDetails,statistics';

#### userInfo
**Before:**
	utils.endpoints.base+'feeds/api/users/'+settings.user+'?v=2&alt=json';

**After:**
	utils.endpoints.base+'channels?'+settings.user+'&key='+apiKey+'&part=snippet,contentDetails,statistics';

**Required in Build**
```javascript
if (settings.channelId){
    settings.user = 'id='+settings.channelId;
} else if(settings.user){
    settings.user = 'forUsername='+settings.user;
}
```

userVids: 	
	utils.endpoints.base+'feeds/api/users/'+settings.user+'/uploads/?v=2&alt=json&format=5&max-results=50';

	utils.endpoints.base+'users/'+settings.user+'/uploads/?v=2&alt=json&format=5&max-results=50';

#### userVids
**Before:**
	utils.endpoints.base+'feeds/api/users/'+settings.user+'/uploads/?v=2&alt=json&format=5&max-results=50';

**After:**
	utils.endpoints.base+'users/'+settings.user+'/uploads/?v=2&alt=json&format=5&max-results=50';

userPlaylists: 
	utils.endpoints.base+'feeds/api/users/'+settings.user+'/playlists/?v=2&alt=json&format=5&max-results=50';

	utils.endpoints.base+'playlists?channelId='+settings.channelId+'&key='+apiKey+ '&maxResults=50&part=snippet';

#### userPlaylists
**Before:**
	utils.endpoints.base+'feeds/api/users/'+settings.user+'/playlists/?v=2&alt=json&format=5&max-results=50';

**After:**
	utils.endpoints.base+'playlists?channelId='+settings.channelId+'&key='+apiKey+'&maxResults=50&part=snippet';

playlistVids: 
	utils.endpoints.base+'feeds/api/playlists/'+(settings.playlist)+'?v=2&alt=json&format=5&max-results=50';

	utils.endpoints.base+'playlistItems?playlistId='+settings.playlist+'&key='+apiKey+ '&maxResults=50&part=contentDetails';

#### playlistVids
**Before:**
	utils.endpoints.base+'feeds/api/playlists/'+(settings.playlist)+'?v=2&alt=json&format=5&max-results=50';

**After:**
	utils.endpoints.base+'playlistItems?playlistId='+settings.playlist+'&key='+apiKey+'&maxResults=50&part=contentDetails';


#### `NEW` videoInfo
	utils.endpoints.base+'videos?id='+settings.videos+'&key='+apiKey+ '&maxResults=50&part=snippet,contentDetails,status,statistics';


videoInfo:
	utils.endpoints.base+'videos?id='+settings.videos+'&key='+apiKey+ '&maxResults=50&part=snippet,contentDetails,status,statistics';


### Parse new time format - Reference
```javascript
function parseDuration(duration) {
    var matches = duration.match(/[0-9]+[HMS]/g);

    var seconds = 0;

    matches.forEach(function (part) {
        var unit = part.charAt(part.length-1);
        var amount = parseInt(part.slice(0,-1));

        switch (unit) {
            case 'H':
                seconds += amount*60*60;
                break;
            case 'M':
                seconds += amount*60;
                break;
            case 'S':
                seconds += amount;
                break;
            default:
                // noop
        }
    });

    return seconds;
}
```