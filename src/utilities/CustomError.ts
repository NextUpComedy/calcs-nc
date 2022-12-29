class CustomError extends Error {
  message: string;

  devMessage: string;

  constructor(message: string, devMessage: string) {
    super(message);
    this.message = message;
    this.devMessage = devMessage;
  }
}

export default CustomError;
