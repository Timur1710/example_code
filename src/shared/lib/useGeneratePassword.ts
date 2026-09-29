export const useGeneratePassword = () => {
  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  return {
    generatePassword
  };
};