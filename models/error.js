class HttpError extends Error {
  constructor(messages, code) {
    super("");
    this.errorDescription = messages;
    this.code = code;
  }
}

module.exports = HttpError;
