class HttpError extends Error {
  constructor(messages, code) {
    super("");
    this.errorMessages = messages;
    this.code = code;
  }
}

module.exports = HttpError;
