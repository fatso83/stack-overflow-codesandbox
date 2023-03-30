import createHttpGateway, { HttpError } from "../Shared/HttpGateway";
import createObservable from "../Shared/observable";
import { debug } from "../Shared/logger";

const toPmModel = (b) => ({ title: b.name });

function isThrottled(throttledUntil) {
  return throttledUntil > Date.now();
}

class BookRepository {
  httpGateway = createHttpGateway();
  programmersModel = createObservable({
    books: [],
    networkError: null,
    inSync: false,
    isLocal: false,
    isThrottled: false,
    throttledUntil: 0
  });

  handleError(error) {
    const update = {};
    debug("ERROR: ", error);
    if (error instanceof HttpError) {
      if (error.httpCode === 429) {
        const oneMinute = 60 * 1000;
        update.throttledUntil = Date.now() + oneMinute;
        setTimeout(() => this._updatePM({ isThrottled: false }), oneMinute);
      }
    }

    update.networkError = error;
    this._updatePM(update);
    return;
  }

  async getBooks() {
    this._updatePM({ networkError: null });
    let resultPayload;
    try {
      resultPayload = await this.httpGateway.get(`/books`);
    } catch (err) {
      return this.handleError(err);
    }
    const booksDto = resultPayload.result;

    this._updatePM({
      books: booksDto.map(toPmModel),
      inSync: true
    });
    debug("books post GET", this.books);
  }

  async load(listener) {
    const unsubscribeCb = await this.programmersModel.subscribe(listener);
    this.getBooks();
    return unsubscribeCb;
  }

  async addBook(bookPm) {
    debug("addBook called", bookPm);

    this._updatePM({ networkError: null });
    const dto = {
      name: bookPm.title,
      ownerId: `foo-${Math.random()}`,
      author: bookPm.author
    };

    console.log("pre push", this.books);
    const pmModel = toPmModel(dto);
    pmModel.isLocal = true;

    const preState = this.programmersModel.value;
    this._updatePM({
      inSync: false,
      books: [...this.programmersModel.value.books, pmModel] // optimistic update
    });
    console.log("post push", this.books);

    try {
      if (Math.random() < 0.3) throw Error("Random network error :-/");
      await this.httpGateway.post(`/books`, dto);
    } catch (err) {
      this._updatePM({ ...preState, inSync: true });
      this.handleError(err);
    }
    debug("books post POST", {
      after: this.programmersModel.value.books,
      before: preState.books
    });

    this.getBooks(); // refresh, do not wait
    return "OK";
  }

  async reset() {
    this._updatePM({
      books: [],
      inSync: false
    });

    await this.httpGateway.get(`/reset`);
    this.getBooks();
  }

  _updatePM = (obj) => {
    console.assert(typeof obj === "object");

    this.programmersModel.value = {
      ...this.programmersModel.value,
      ...obj
    };
  };

  _updateThrottleTime = (time) => {
    this._updatePM({ throttledUntil: time, isThrottled: isThrottled(time) });
  };
}

export default new BookRepository();
