function* generator() {
  const value = yield Promise.resolve(1);
  return value;
}
function run(generator) {
  const iterator = generator();
  function next(result) {
    if (result.done) {
      return Promise.resolve(result.value);
    }
    return result.value.then((value) => {
      return next(iterator.next(value));
    });
  }
  return next(iterator.next());
}

run(generator).then((value) => {
  console.log(value);
});