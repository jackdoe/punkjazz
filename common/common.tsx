import * as FileSystem from "expo-file-system";
export const remoteCatalogURL =
  "https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv";
export const indexURL = FileSystem.documentDirectory + "index.json";
import { Index, analyzers } from "paxx";
import React from "react";
import { BooksByIDType, BookType, ContextType } from "../types";

export const newIndex = () => {
  return new Index({
    language: analyzers.keyword,
    bookshelves: analyzers.basic,
    authors: analyzers.basic,
    subjects: analyzers.basic,
    title: analyzers.basic,
    everything: analyzers.basic,
  });
};

export const navigationRef = React.createRef();

export function navigate(name: string, params: any) {
  navigationRef.current?.navigate(name, params);
}

export function remapBooks(x: any) {
  let byID: BooksByIDType = {};
  for (let b of x.shallow().forward) {
    byID[b.id] = b;
  }
  return byID;
}

export const Context = React.createContext({
  downloaded: [],
  index: newIndex(),
  booksByID: {},
  theme: "light",
  font: "space-mono",
  fontSize: 14,
});

export const downloadedBooks = async (booksByID: BooksByIDType) => {
  let downloaded: Array<BookType> = [];

  try {
    let dir = await FileSystem.readDirectoryAsync(
      FileSystem.documentDirectory + "books"
    );
    for (let d of dir) {
      if (d.startsWith("b-")) {
        let book = booksByID[d.split("-")[1]];
        if (book) {
          downloaded.push(book);
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
  downloaded.sort((a, b) => {
    if (a.id < b.id) {
      return -1;
    }
    if (a.id > b.id) {
      return 1;
    }
    return 0;
  });
  return downloaded;
};
