import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import * as FileSystem from "expo-file-system";

import { Container, SelectableText, Text, themes } from "../components/Themed";
import { ScrollView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Context } from "../common/common";

const spaceChar = " ";
const tabChar = "\t";
const newLineN = "\n";
const newLineR = "\r";

/**
 * Gutenberg files have line breaks at 76 characters, which makes lines very
 * ragged on mobile.
 * 
 * Let's remove those. First we split actual paragraphs - sequences of 3 line breaks. Then we
 * remove all other line breaks, and glue it back together. Seems to work.
 * 
 */
function normalizeText(t: string) {
  return t?.split(/[\r\n]{3,}/).map(l => l.replace(/^[\r\n]/, '').replace(/[\r\n]+/g, ' ')).join('\n\n')
}

function lastLines(buf: Array<string>, n: number) {
  let out: Array<string> = [];
  for (let i = buf.length - 1; i >= 0; i--) {
    let c = buf[i];
    out.push(c);

    if (c == newLineN || c == newLineR) {
      if (n-- <= 0) {
        break;
      }
    }
  }
  return out.reverse();
}

function addPreviousLinesToEnd(
  n: number,
  out: Array<Array<string>>,
  current: Array<string>
) {
  if (out.length > 0) {
    let last = lastLines(out[out.length - 1], n);
    current = last.concat(current);
  }
  return current;
}

function addChar(c: string, current: Array<string>) {
  if (c == tabChar) {
    // Text is RichText and apparently it is not so rich to display tabs properly
    // so just replace tabs with 8 spaces, old school
    for (let k = 0; k < 8; k++) {
      current.push(spaceChar);
    }
  } else {
    current.push(c);
  }
}

function splitBook(bytes: string, nBytesSplit: number) {
  let out: Array<Array<string>> = [];

  let left = nBytesSplit;
  let current: Array<string> = [];

  for (let i = 0; i < bytes.length; i++) {
    let c = bytes[i];
    if (left > 0) {
      addChar(c, current);
      left--;
    } else {
      // split to closest new line
      let j = i;
      for (; j < bytes.length; j++) {
        let nextC = bytes[j];
        addChar(nextC, current);

        if (nextC == newLineN || nextC == newLineR) {
          break;
        }
      }
      i = j;

      // make sure each page has few lines from the previous page
      current = addPreviousLinesToEnd(5, out, current);

      out.push(current);
      current = [];
      left = nBytesSplit;
    }
  }
  if (current.length > 0) {
    current = addPreviousLinesToEnd(5, out, current);

    out.push(current);
  }

  let text = [];
  for (let l of out) {
    text.push(l.join(""));
  }
  return text;
}

export default function BookScreen({
  route: {
    params: { id },
  },
}) {
  const [book, setBook] = useState<Array<string>>([]);
  const [context, setContext] = React.useContext(Context);
  const t = themes[context.theme];

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [nextSymbol, setNextSymbol] = useState<string>(">");
  const [animationStarted, setAnimationStarted] = useState<boolean>(false);

  const savedPageKey = "book-current-page-" + id;
  useEffect(() => {
    (async () => {
      try {
        let data = await FileSystem.readAsStringAsync(
          FileSystem.documentDirectory + "books/b-" + id + "/" + id + ".txt"
        );
        let splitted = splitBook(data, 5000);
        setBook(splitted);
        try {
          let savedCurrentPage = await AsyncStorage.getItem(savedPageKey);
          setCurrentPage(parseInt(savedCurrentPage || "0"));
        } catch (e) {
          console.warn(e);
        }
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);
  if (currentPage > book.length) {
    return <Text>...</Text>;
  }

  const scrollRef = React.useRef(null);
  return (
    <Container>
      <ScrollView
         style={styles.bookView} 
        scrollEventThrottle={100}
        onScroll={(e) => {
          let paddingToBottom = 10;
          paddingToBottom += e.nativeEvent.layoutMeasurement.height;
          if (
            e.nativeEvent.contentOffset.y >=
            e.nativeEvent.contentSize.height - paddingToBottom
          ) {
            if (!animationStarted && currentPage < book.length) {
              setAnimationStarted(true)
              setTimeout(() => {
                setNextSymbol(">>");
                setTimeout(() => {
                  setNextSymbol(">>>");
                  setTimeout(() => {
                    setNextSymbol(">");
                    setTimeout(() => {
                      setAnimationStarted(false)
                    }, 1000);
                  }, 200);
                }, 200);
              }, 200);
            }
          } else {

          }
        }}
        ref={scrollRef}
      >
        <Text>{normalizeText(book[currentPage])}</Text>
      </ScrollView>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onLongPress={() => {
            setCurrentPage(0);
            AsyncStorage.setItem(savedPageKey, "0");
            scrollRef.current?.scrollTo({ offset: 0, animated: false });
          }}
          onPress={() => {
            if (currentPage > 0) {
              AsyncStorage.setItem(savedPageKey, "" + (currentPage - 1));
              setCurrentPage(currentPage - 1);
              scrollRef.current?.scrollTo({ offset: 0, animated: false });
            }
          }}
          style={[styles.bottomElement, { borderColor: t.color }]}
        >
          <Text>&lt;</Text>
        </TouchableOpacity>
        <View style={{ width: 10 }} />
        <TouchableOpacity
          style={[styles.bottomElement, { borderColor: t.color }]}
        >
          <Text>{currentPage}</Text>
        </TouchableOpacity>
        <View style={{ width: 10 }} />
        <TouchableOpacity
          onPress={() => {
            if (currentPage < book.length) {
              AsyncStorage.setItem(savedPageKey, "" + (currentPage + 1));
              setCurrentPage(currentPage + 1);
              scrollRef.current?.scrollTo({ offset: 0, animated: false });
            }
          }}
          style={[styles.bottomElement, { borderColor: t.color }]}
        >
          <Text>{nextSymbol}</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  bookView: {
    flex: 1,
    padding: 4
  },
  bottomElement: {
    flex: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContainer: {
    flexDirection: "row",
    flex: 0.1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4
  },
});
