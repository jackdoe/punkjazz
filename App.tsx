import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Navigation from "./navigation";
import { Context, downloadedBooks, indexURL, newIndex, remapBooks } from "./common/common";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { BooksByIDType, BookType, ContextType } from "./types";
import { themes } from './components/Themed'
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  let b: BooksByIDType = {}
  const [context, setContext] = useState<ContextType>({
    downloaded: new Array<BookType>(),
    index: newIndex(),
    booksByID: b,
    theme: "light",
    font: "space-mono",
    fontSize: 14,
  });

  const [isLoadingComplete, setLoadingComplete] = React.useState(false);


  React.useEffect(() => {
    (async () => {
      await Font.loadAsync({
        ...Ionicons.font,
        "space-mono": require("./assets/fonts/SpaceMono-Regular.ttf"),
      });

      let theme = await AsyncStorage.getItem("theme")
      let font = await AsyncStorage.getItem("font")
      let fontSize = parseInt(await AsyncStorage.getItem("fontSize") || "14")

      let downloaded: Array<BookType> = []
      let booksByID = {}
      let index = newIndex()

      try {
        let fi = await FileSystem.getInfoAsync(indexURL);
        if (fi && fi.size > 0) {
          let r = await fetch(indexURL)
          let data = await r.text()
          index.deserialize(data);
          booksByID = remapBooks(index)
          downloaded =  await downloadedBooks(booksByID)
        }
      } catch (e) {
        console.log(e);
      } finally {
        setContext({
          ...context,
          downloaded: downloaded,
          index: index,
          booksByID: booksByID,
          theme: theme || "light",
          font: font || "space-mono",
          fontSize: fontSize,
        })
      }
      setLoadingComplete(true);
    })();
  }, []);


  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <Context.Provider value={[context, setContext]}>
          <Navigation />
          <StatusBar hidden={false} translucent={false} backgroundColor={themes[context.theme].bgcolor}/>
        </Context.Provider>
      </SafeAreaProvider>
    );
  }
}
