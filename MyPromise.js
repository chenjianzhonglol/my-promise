(function (global, factory) {
  "use strict";

  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(global);
  } else {
    factory(global);
  }
})(this, function (global) {
  /**
   * 核心逻辑：then方法中将成功回调和失败回调用异步方法包一下之后分别加入一个队列，在resolve/reject方法被调用
   * 后挨个执行队列中的方法
   */
  const PENDING = "pending"; // 等待/ 进行
  const FULFILLED = "fulfilled"; // 完成
  const REJECTED = "rejected"; // 拒绝

  function MyPromise(fn) {
    const self = this;
    this.fulfilledCbArr = [];
    this.rejectedCbArr = [];
    this.status = PENDING;
    this.value = null;
    this.err = null;
    this.resolve = (v) => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = v;
        while (this.fulfilledCbArr.length) {
          this.fulfilledCbArr.shift()();
        }
      }
    };
    this.reject = (v) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.err = v;
        while (this.rejectedCbArr.length) {
          this.rejectedCbArr.shift()();
        }
      }
    };
    try {
      fn(this.resolve, this.reject);
    } catch (e) {
      this.reject(e);
    }
  }

  // 返回新的promise对象
  MyPromise.prototype.then = function (onFulfilled, onRejected) {
    // 对onFulfilled和onRejected类型判断
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          }; // 没有处理异常的回掉的话就抛出异常 可以让异常传递下去
    const p = new MyPromise((resolve, reject) => {
      const createFulfilledTask = () => {
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value);
            resolvePromise(p, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      };

      const createRejectedTask = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.err);
            resolvePromise(p, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      };

      if (this.status === FULFILLED) {
        createFulfilledTask();
      } else if (this.status === REJECTED) {
        createRejectedTask();
      } else {
        this.fulfilledCbArr.push(createFulfilledTask);
        this.rejectedCbArr.push(createRejectedTask);
      }
    });

    return p;
  };

  MyPromise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected);
  };

  MyPromise.prototype.finally = function (onFinally) {
    /**
     * MyPromise.resolve(onFinally())的作用是，如果onFinally是promise对象或者thenable对象的话，可以按顺序执行
     */
    return this.then(
      (value) => MyPromise.resolve(onFinally()).then(() => value),
      (reason) =>
        MyPromise.resolve(onFinally()).then(() => {
          throw reason;
        })
    );
  };

  MyPromise.resolve = function (value) {
    if (value instanceof MyPromise) {
      return value;
    }
    return new Promise((resolve) => {
      resolve(value);
    });
  };

  MyPromise.reject = function (reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  };

  MyPromise.all = function (arr) {
    return new Promise((resolve, reject) => {
      let count = 0;
      const res = [];
      arr.forEach((p, i) => {
        Promise.resolve(p).then(
          (v) => {
            count++;
            res[i] = v;
            if (count === arr.length) {
              resolve(res);
            }
          },
          (e) => {
            reject(e);
          }
        );
      });
    });
  };

  MyPromise.race = function (arr) {
    return new Promise((resolve, reject) => {
      let flag = false;
      arr.forEach((p, i) => {
        Promise.resolve(p).then(
          (v) => {
            if (!res) {
              res = true;
              resolve(v);
            }
          },
          (e) => {
            reject(e);
          }
        );
      });
    });
  };

  /**
   *
   * @param {*} p then方法返回的promise对象
   * @param {*} x 回调返回的值
   * @param {*} resolve
   * @param {*} reject
   */
  function resolvePromise(p, x, resolve, reject) {
    if (p === x) {
      // 2.3.1. 如果promise和x引用同一个对象，用一个TypeError作为原因来拒绝promise
      reject(new TypeError("p !=== x"));
    }
    if (
      Object.prototype.toString.call(x) === "[object Object]" ||
      typeof x === "function"
    ) {
      // 2.3.3. 否则，如果x是一个对象或函数
      let [then, called] = [null, false];

      try {
        then = x.then;
      } catch (e) {
        // 2.3.3.2. 如果检索属性x.then导致抛出了一个异常e，用e作为原因拒绝promise
        reject(e);
      }

      if (typeof then === "function") {
        try {
          then.call(
            x,
            (y) => {
              // 2.3.3.3.1. 如果resolvePromise用一个值y调用，运行[[Resolve]](promise, y)
              if (called) return;
              called = true;
              resolvePromise(p, y, resolve, reject);
            },
            (r) => {
              // 2.3.3.3.2. 如果rejectPromise用一个原因r调用，用r拒绝promise
              if (called) return;
              called = true;
              reject(r);
            }
          );
        } catch (e) {
          // 2.3.3.4.1. 如果resolvePromise或rejectPromise已经被调用，忽略它
          if (called) return;

          // 2.3.3.4.2. 否则，用e作为原因拒绝promise
          reject(e);
        }
      } else {
        // 2.3.4. 如果x不是一个对象或函数，用x解决promise
        resolve(x);
      }
    } else {
      resolve(x);
    }
  }

  global.MyPromise = MyPromise;

  return MyPromise;
});
