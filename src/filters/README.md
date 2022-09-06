# Flow

![filter-flow](/images/filter-flow.png)

## MochiFilter function signature

`(i: CommandInteraction) => Promise<void>`

Every slash command will have a `filters` property that is a list of `MochiFilter` async functions, when a user runs a command, the interaction will be passed through that command's list of filter, if all of them resolves then the handle/run function will run, otherwise if any one of them rejects then the flow stop and and error message should be shown if necessary.

Compare to the old format, this has some advantages:

- Unit test each filter function in isolation (clear expectation of input/output)
- Don't need to add new boolean property to command object, just define a new filter function

## Convention

- Keep the function body as minimal as possible -> this will enable easier unit testing
- Function name should follow format `reject{some-condition}` or `allow{some-condition}` for readability
- If necessary, longer function name is preferred than short but cryptic one
- Every function should be able to execute on their own, e.g `[filterA, filter B]` and `[filterB, filterA]` should have the same output no matter the order
