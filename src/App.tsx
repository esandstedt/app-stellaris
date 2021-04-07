import React, { useState } from "react";
import { Model } from "@esandstedt/stellaris-model";

import { Loader } from "./components/Loader";
import Svg from "./components/Svg";

const WIDTH = (() => {
  if (typeof window !== "undefined") {
    return Math.min(1200, window.innerWidth - 20);
  } else {
    return 1200;
  }
})();

function App() {
  const [model, setModel] = useState<Model>();

  return (
    <>
      {!model && <Loader onLoad={setModel} />}
      {model && <Svg model={model} width={WIDTH} height={WIDTH} />}
    </>
  );
}

export default App;
