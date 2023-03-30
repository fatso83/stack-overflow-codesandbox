import repository from "./BookRepository";

const getNewBookTitle = (() => {
  const bookTitles = [
    "A tale of three cities",
    "The dirty road",
    "A motley crew",
    "Strange Days",
    "Stranger Days",
    "Una mosta strangero dayo"
  ];
  const len = bookTitles.length;
  let titleIndex = (Math.random() * len + 1) >> 0;
  return () => bookTitles[titleIndex++ % len];
})();

function createErrorMsg(pmBooksState) {
  if (!pmBooksState.networkError) return "";
  if (pmBooksState.isThrottled) {
    return "Seems like we have been a bit too busy sending HTTP requests 🙈";
  }
  return pmBooksState.networkError?.message || "Unknown network error";
}

export default class BooksPresenter {
  #unsubscribeCallback = null;

  unregister() {
    this.unsubscribeCallback();
  }

  async load(vmSubscriber) {
    const pmModelSubscriber = (pmBooksState) => {
      const viewModel = {
        books: pmBooksState.books
          .map((bookPm) => ({
            visibleTitle: bookPm.title + (bookPm.isLocal ? " (local)" : ""),
            shouldHighlight: bookPm.isLocal
          }))
          .reverse(),
        errorMessage: createErrorMsg(pmBooksState),
        showError: !!pmBooksState.networkError,
        syncStatus: pmBooksState.inSync ? "In sync" : "Pending update",
        disableButtons: pmBooksState.isThrottled,
        disabledUntilMessage: `Interaction disabled until ${new Date(
          pmBooksState.throttledUntil
        ).toTimeString()}`
      };

      // publish update to subscriber
      vmSubscriber(viewModel);
    };
    this.unsubscribeCallback = await repository.load(pmModelSubscriber);
  }

  add() {
    repository.addBook({
      author: "Carlos Santana",
      title: getNewBookTitle()
    });
  }

  reset() {
    repository.reset();
  }
}
