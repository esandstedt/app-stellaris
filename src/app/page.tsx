"use client";

import { ModelLoader } from "@/components/ModelLoader";
import { Model } from "@/model/Model";
import { Map } from "@/components/Map";
import React, { useState } from "react";

export default function Home() {
  const [model, setModel] = useState<Model | null>(null);

  if (model === null) {
    return (
      <div className="container mx-auto flex flex-col">
        <div className="text-2xl font-bold text-center mt-8 mb-4">
          Stellaris Map Generator
        </div>
        <div className="flex justify-center">
          <ModelLoader onLoad={(model) => setModel(model)} />
        </div>
      </div>
    );
  } else {
    return (
      <Map
        model={model}
        width={window.innerWidth}
        height={window.innerHeight}
      />
    );
  }
}
