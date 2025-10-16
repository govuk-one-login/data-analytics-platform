export const getBodyAsBuffer = (body: string): Uint8Array => {
  return new Uint8Array(Buffer.from(body));
};
