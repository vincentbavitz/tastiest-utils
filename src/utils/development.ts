// Only log in development mode
export const dlog = (message: any, ...optionalParams: any) => {
  return process.env.NODE_ENV !== 'production'
    ? console.log(message, ...optionalParams)
    : null;
};
