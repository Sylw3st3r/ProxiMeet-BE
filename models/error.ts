export default class HttpError extends Error {
  constructor(
    public messages: string,
    public code?: number,
    public generateNewToken?: boolean
  ) {
    super("");
  }
}
