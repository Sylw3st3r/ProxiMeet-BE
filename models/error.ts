export default class HttpError extends Error {
  constructor(
    public message: string,
    public code?: number,
    public generateNewToken?: boolean
  ) {
    super("");
  }
}
