# Rest API Endpoints

## Documents
Getting a specific document (Method: GET)
```
/doc-api/v1/docs/games/sf5
/doc-api/v1/docs/chars/sf5.ryu
/doc-api/v1/docs/moves/sf5.ryu.hadoken
```

Getting lists of documents (Method: GET)

```
// Get all games up to limit 'x' starting from 'y'
/doc-api/v1/docs/games?limit=x&offset=y

// Get all chars in game 'x', up to limit 'y' starting from 'z'
/doc-api/v1/docs/chars?game=x&limit=y&offset=z

// Get all moves in char 'x', up to limit 'y' starting from 'z'
/doc-api/v1/docs/moves?char=x&limit=y&offset=z
```

## Proposals
Creating new proposals (Method: POST)
```
/doc-api/v1/props/games
/doc-api/v1/props/chars
/doc-api/v1/props/moves
```

Approve, reject or cancel proposals (Method: PATCH)
```
/doc-api/v1/props/any/sf5/10/status/rejected
/doc-api/v1/props/any/sf5.ryu/12/status/approved
/doc-api/v1/props/any/sf5.ryu.mp/11/status/cancelled
```

Updating proposals (Method: PUT)
```
/doc-api/v1/props/any/sf5/10
/doc-api/v1/props/any/sf5.ryu/12
/doc-api/v1/props/any/sf5.ryu.mp/11
```

Getting specific proposals (Method: GET)
```
/doc-api/v1/props/any/sf5/10
/doc-api/v1/props/any/sf5.ryu/12
/doc-api/v1/props/any/sf5.ryu.mp/11
```

Getting lists of proposals (Method: GET)
```
/doc-api/v1/props/any?offset=x&limit=y&status=z
/doc-api/v1/props/any?offset=x&limit=y&status=z&target=t
/doc-api/v1/props/any?offset=x&limit=y&status=z&author=a
```

## Searching
Method: GET

Search across all documents
```
/search-api/v1?query=x&limit=y&offset=z
```

Search all documents that are in game 'z' (Not implemented)
```
/search-api/v1?query=x&game=z
```

Search all documents that are in char 'z' (Not implemented)
```
/search-api/v1?query=x&char=z
```

## Uploads
Method: POST

Upload a video file. The resulting file is placed in the [configured](../server/config.json.sample) 'uploads' folder.
```
/upload-api/v1
```