export default (obj: any, properties: string[]) => {
  Object.keys(obj).forEach(key => {
    if (
      typeof properties.includes(key) === 'undefined' ||
      properties.includes(key) === null
    ) {
      delete obj[key];
    }
  });
};
