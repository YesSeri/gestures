function getMaxOccurrence(array) {
  let counter = {}
  array.forEach(el => {
    counter[el] = (counter[el] || 0) + 1;
  });
  return Object.keys(counter).reduce((a, b) => counter[a] > counter[b] ? a : b);
}