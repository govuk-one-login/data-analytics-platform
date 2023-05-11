module.exports = async () => {
  return {
    verbose: true,
    transform: {
      "^.+\\.tsx?$": "esbuild-jest"
    }
  };
};
