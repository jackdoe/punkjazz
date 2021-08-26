import { createIconSetFromFontello } from "@expo/vector-icons";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";

import {
  Button,
  Container,
  DashedView,
  Input,
  Text,
} from "../components/Themed";
import { Context, downloadedBooks, navigate } from "../common/common";
import { BookType, BottomTabParamList } from "../types";
import { StackScreenProps } from "@react-navigation/stack";
const { AND, OR, TERM, CONSTANT, DISMAX } = require("paxx");

function DownloadButton({ id }: { id: string }) {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>("");
  const [done, setDone] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [context, setContext] = React.useContext(Context);

  return (
    <Button
      onPress={() => {
        (async () => {
          if (downloading) {
            return;
          } else if (done) {
            navigate("Book", { id });
            return
          }
          setErr(null);
          setProgress("downloading..");
          setDone(false);
          setDownloading(true);
          const callback = (
            downloadProgress: FileSystem.DownloadProgressData
          ) => {
            const current =
              (downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite) *
              100;
            setProgress(current.toFixed(2) + "%");
          };
          let path = FileSystem.documentDirectory + "books" + "/b-" + id;

          try {
            await FileSystem.makeDirectoryAsync(path, { intermediates: true });
          } catch (e) {
            console.warn(e);
          }
          let downloadResumable = FileSystem.createDownloadResumable(
            "https://www.gutenberg.org/files/" + id + "/" + id + ".txt",
            path + "/" + id + ".txt",
            {},
            callback
          );
          try {
            let r = await downloadResumable.downloadAsync();
            if (r?.status != 200) {
              downloadResumable = FileSystem.createDownloadResumable(
                "https://www.gutenberg.org/files/" + id + "/" + id + "-0.txt",
                path + "/" + id + ".txt",
                {},
                callback
              );
              r = await downloadResumable.downloadAsync();
              if (r?.status != 200) {
                throw new Error("status: " + r?.status);
              }
            }
            let downloaded = await downloadedBooks(context.booksByID);
            setContext({
              ...context,
              downloaded: downloaded,
            });
          } catch (e) {
            setErr(e.message);
          } finally {
            setDownloading(false);
            setDone(true);
          }
        })();
      }}
    >
      {downloading ? progress : done ? (err ? err : "read") : "download"}
    </Button>
  );
}
export function Pair({ left, right }: { left: string; right: string }) {
  return (
    <View
      style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start" }}
    >
      <Text style={{ flex: 1 }}>{left}</Text>
      <Text style={{ flex: 3 }}>{right}</Text>
    </View>
  );
}

export function BookRow({
  book,
  onPressBook,
  onPressTag,
  children,
}: {
  book: BookType;
  onPressBook: (b: BookType) => void;
  onPressTag?: (text: string) => void;
  children: any;
}) {
  let b = book;
  let subjects = b.subjects.split("; ").filter((e) => e);
  let bookshelves = b.bookshelves.split("; ").filter((e) => e);
  let authors = b.authors.split("; ").filter((e) => e);
  let title = b.title.replace("\n", " ");
  return (
    <DashedView
      style={{
        padding: 10,
        marginBottom: 20,
      }}
      key={b.id}
    >
      <TouchableOpacity
        onPress={() => {
          onPressBook(b);
        }}
      >
        <View>
          <Image
            style={{ width: 168, height: 238, borderRadius: 5 }}
            source={{
              uri:
                "https://www.gutenberg.org/cache/epub/" +
                b.id +
                "/pg" +
                b.id +
                ".cover.medium.jpg",
            }}
          />
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          ></View>
        </View>
      </TouchableOpacity>
      {children}
      <Pair left="id" right={"#" + b.id} />
      <TouchableOpacity onPress={() => onPressTag(b.title)}>
        <Pair left="title" right={title} />
      </TouchableOpacity>
      <Pair left="issued" right={b.issued} />
      <Pair left="language" right={b.language} />
      {authors.map((e, i) => {
        let inner = <Pair key={"a_" + i} left="author" right={e} />;
        return onPressTag ? (
          <TouchableOpacity key={"a_" + i} onPress={() => onPressTag(e)}>
            {inner}
          </TouchableOpacity>
        ) : (
          inner
        );
      })}

      {subjects.map((e, i) => {
        let inner = <Pair key={"s_" + i} left="subject" right={e} />;
        return onPressTag ? (
          <TouchableOpacity key={"s_" + i} onPress={() => onPressTag(e)}>
            {inner}
          </TouchableOpacity>
        ) : (
          inner
        );
      })}
      {bookshelves.map((e, i) => {
        let inner = <Pair key={"s_" + i} left="shelve" right={e} />;
        return onPressTag ? (
          <TouchableOpacity key={"s_" + i} onPress={() => onPressTag(e)}>
            {inner}
          </TouchableOpacity>
        ) : (
          inner
        );
      })}
    </DashedView>
  );
}

export default function SearchScreen({
  navigation,
}: StackScreenProps<BottomTabParamList>) {
  const [queryText, setQueryText] = useState<string>("");
  const [context, setContext] = React.useContext(Context);
  let ix = context.index;

  if (ix.shallow().forward.length == 0) {
    return (
      <Container center={true}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Update");
          }}
        >
          <Text>
            Local index is empty, go to Settings to download the gutenberg
            catalog.
          </Text>
        </TouchableOpacity>
      </Container>
    );
  }
  let matches = [];
  if (queryText.length == 0) {
    matches = ix.shallow().forward;
  } else {
    matches = ix.topN(
      new DISMAX(
        0,
        new CONSTANT(5, new AND(...ix.terms("title", queryText))),
        new CONSTANT(3, new AND(...ix.terms("subjects", queryText))),
        new CONSTANT(3, new AND(...ix.terms("bookshelves", queryText))),
        new CONSTANT(4, new AND(...ix.terms("authors", queryText))),
        new CONSTANT(4, new AND(...ix.terms("everything", queryText)))
      )
    );
  }
  return (
    <Container>
      <Input
        placeholderTextColor="silver"
        placeholder="search for title, author, subject.."
        autoFocus={true}
        style={{
          borderStyle: "dashed",
          borderWidth: 1,
          padding: 5,
          flex: 0.1,
          fontFamily: "space-mono",
          borderRadius: 5,
        }}
        value={queryText}
        onChangeText={(v) => {
          setQueryText(v);
        }}
      ></Input>
      <FlatList
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={matches}
        style={{ flex: 1 }}
        ListHeaderComponent={
          <Text style={{ paddingTop: 5, paddingBottom: 5 }}>
            {matches.length} books matching
          </Text>
        }
        keyExtractor={(book) => book.id}
        renderItem={({ item }: { item: BookType }) => {
          let b = item;
          return (
            <BookRow
              key={b.id}
              book={b}
              onPressTag={(text) => {
                setQueryText(text);
              }}
              onPressBook={(b) => {
                Linking.openURL("https://www.gutenberg.org/ebooks/" + b.id);
              }}
            >
              <DownloadButton id={b.id} />
            </BookRow>
          );
        }}
      />
    </Container>
  );
}
