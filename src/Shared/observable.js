import { debug } from "./logger";

export default function createObservable(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  function notify() {
    debug(
      `Notifying ${subscribers.size} subscribers about state update!`,
      value
    );

    subscribers.forEach((subscriber) => {
      subscriber(value);
    });
  }

  return {
    get value() {
      return value;
    },
    set value(newValue) {
      value = newValue;
      notify();
    },
    subscribe(cb) {
      debug("New subscriber:", cb, subscribers);
      subscribers.add(cb);
      return () => {
        console.log("Unsubscribing one subscriber");
        subscribers.delete(cb);
      };
    }
  };
}
