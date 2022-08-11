/*
 * InmemoryStorage is a class to use where you want to store data for caching purpose
 * however since this is only in memory (data loss after restart), you must implement
 * the `up` method to properly populate the data when the server starts
 * the implementation logic is to you (asynchronous fetch, reading from a file, etc...)
 */
export abstract class InmemoryStorage {
  protected abstract up(): Promise<void>
}
