const MyPromise = require("../dist/MyPromise");
console.log(MyPromise);

// 测试是否满足Promise A+规范
MyPromise.deferred = () => {
  const res = {};
  const promise = new MyPromise((resolve, reject) => {
    res.resolve = resolve;
    res.reject = reject;
  });
  res.promise = promise;
  return res;
};

module.exports = MyPromise;
