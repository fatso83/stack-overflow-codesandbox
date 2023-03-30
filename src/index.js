import "./index.css";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import BooksPresenter from "./Books/BooksPresenter";
import { debug } from "./Shared/logger";

function Error({ children }) {
  return <div className="error-msg">{children}</div>;
}

function App() {
  const [someInternalState, changeInternalState] = React.useState({
    counter: 0,
    id: (Math.random() * 10000) >> 0
  });
  const [vm, copyVmToComponentState] = useState({ books: [] });
  const booksPresenter = React.useMemo(() => new BooksPresenter(), []);
  console.log("App: rerendering", someInternalState);

  // bump to trigger hot-reloading: 2
  React.useEffect(() => {
    debug("useEffect running! This should only happen once");
    async function load() {
      booksPresenter.load((booksVm) => {
        copyVmToComponentState(booksVm);
      });
    }
    load();

    return () => {
      console.log("Calling cleanup");
      booksPresenter.unregister();
    };
  }, [booksPresenter, someInternalState]);

  return (
    <>
      <div className="container">
        <div className="column">
          <h1>Network</h1>
          <blockquote>
            Emulate Slow 3G in DevTools to test sync and network error handling
          </blockquote>

          <p>Local repo state: {vm.syncStatus}</p>
          {vm.showError && <Error>{vm.errorMessage}</Error>}
        </div>

        <div className="column">
          <h1>Books</h1>

          {vm.disableButtons && <p>{vm.disabledUntilMessage}</p>}
          <button disabled={vm.disableButtons} onClick={booksPresenter.add}>
            Add book
          </button>
          <button disabled={vm.disableButtons} onClick={booksPresenter.reset}>
            Reset
          </button>

          <ul>
            {vm.books.map((book, i) => {
              return <li key={i}>{book.visibleTitle}</li>;
            })}
          </ul>
        </div>
      </div>
      <button
        onClick={() => {
          console.log("Clicked state changer");
          changeInternalState({
            ...someInternalState,
            counter: someInternalState.counter + 1
          });
        }}
      >
        Trigger re-render
      </button>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  rootElement
);
