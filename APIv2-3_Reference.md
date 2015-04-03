#APIv2 to APIv3 Reference Notes

Notes to reference for the conversion for a better understanding on what has changed for myself and others.

## Youtube-TV Elements Chart

Currently used elements in `ytv.js` and their new APIv3 counterparts.

#### User (channel) Playlists

playlists = | res.feed.entry
----------- | --------------
 | **res.feed.items**

`playlists[i]`

Element | Old Value | New Value
------- | --------- | ---------
title | .title.$t | .snippet.title
plid | .yt$playlistId.$t | .id
thumb | .media$group.media$thumbnail[1].url | .snippet.thumbnails.medium.url

#### User (channel) Info
user

user = | userInfo.entry
------ | -------------- 
 | **userInfo.items[0]**

Element | Old Value | New Value
------- | --------- | ---------
title | .title.$t | .snippet.title
url | .yt$username.$t | .id
thumb | .media$thumbnail.url | .snippet.thumbnails.default.url
summary | .summary.$t | .snippet.description
subscribers | .yt$statistics.subscriberCount | .statistics.subscriberCount
views | .yt$statistics.totalUploadViews | .statistics.viewCount
`NEW` | - | -
uploads | n/a | .contentDetails.relatedPlaylists.uploads

To support newer accounts by using channel ID instead of user ID.
> Old: `url: local+'//youtube.com/user/'+userInfo.entry.yt$username.$t`
> New: `url: 'https://youtube.com/channel/'+userInfo.id`

#### `NEW` Playlist Videos

playlistVideos = | n/a
---------------- | ---
 | res.feed.items

`plistlistVideos[i]`

Element | Old Value | New Value
------- | --------- | ---------
slug | n/a | .snippet.videoid

#### Video Info
// data.feed  = playlist or uploaded
videos = data.feed.entry
			data.feed.items

videos = | data.feed.entry
-------- | --------------- 
 | data.feed.items

`videos[i]`

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
`NEW` | - | -
embed | n/a | .status.embeddable

base: 	local+'//gdata.youtube.com/'
		'https://www.googleapis.com/youtube/v3/' *https required

#### base 

base = | `local+'//gdata.youtube.com/'` 
------ | ----------------------------
 | **`'https://www.googleapis.com/youtube/v3/'`**

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

#### userVids
**Before:**  
	utils.endpoints.base+'feeds/api/users/'+settings.user+'/uploads/?v=2&alt=json&format=5&max-results=50';

**After:**  
	utils.endpoints.base+'users/'+settings.user+'/uploads/?v=2&alt=json&format=5&max-results=50';

#### userPlaylists
**Before:**  
	utils.endpoints.base+'feeds/api/users/'+settings.user+'/playlists/?v=2&alt=json&format=5&max-results=50';

**After:**  
	utils.endpoints.base+'playlists?channelId='+settings.channelId+'&key='+apiKey+'&maxResults=50&part=snippet';

#### playlistVids
**Before:**  
	utils.endpoints.base+'feeds/api/playlists/'+(settings.playlist)+'?v=2&alt=json&format=5&max-results=50';

**After:**  
	utils.endpoints.base+'playlistItems?playlistId='+settings.playlist+'&key='+apiKey+'&maxResults=50&part=contentDetails';

#### `NEW` videoInfo  
	utils.endpoints.base+'videos?id='+settings.videos+'&key='+apiKey+ '&maxResults=50&part=snippet,contentDetails,status,statistics';

### Parsing the new time format - Reference
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