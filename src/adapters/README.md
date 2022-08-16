## Before you create a new adapter

Make sure to have your newly-created class extend the `Fetcher` class, it has a `jsonFetch` method that will handle the API request call in a general way (so that you don't have to rewrite that code in each method of each adapter)
The logic is as follow:

- Fetch as usual (assuming that everything is json)
- If it's 200 response -> return the json resposne body
- If it's not 200 ->
  - If `autoWrap500Error` is true (it should be) and the error is 500 -> return json with a generic error msg
  - If error is other than 500 -> return json with the error message from backend

For example if you are creating a new adapter called `Config` to manage a server's config, all you need to do is this (given that these api doesn't need any special handling logic)

```typescript
class Config extends Fetcher {
  public async getConfig(guildId: string) {
    return this.jsonFetch(`${API_BASE_URL}/api/v9/${guildId}/config`);
  }

  // create, edit, delete is the same
}
```

### Logging

- Format of the message is `[API ok/failed - {status}]: ${url} with params ${body}`

### `jsonFetch`'s extra options

The `jsonFetch` method takes in the same arguments as the native `fetch` method, with the second argument accepting some more extra params

| Name               | Default value | Note                                                  |
| ------------------ | ------------- | ----------------------------------------------------- |
| `autoWrap500Error` | `true`        | Whether to show a generic message if the error is 500 |
