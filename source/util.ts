export const getFirstElementByCondition = <T>(
  list: ReadonlyArray<T>,
  condition: (element: T) => boolean
): T | undefined => {
  for (const element of list) {
    if (condition(element)) {
      return element;
    }
  }
};
