const getEventFileKey = (eventName: string, eventId: string) => {
  const today = new Date();
  return `${eventName}/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}/${eventId}.json`;
};

const getEventFilePrefix = (eventName: string) => {
  const today = new Date();
  return `${eventName}/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
};
