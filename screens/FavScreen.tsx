import * as React from "react";
import { useContext, useEffect } from "react";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import * as FileSystem from "expo-file-system";

import { Button, Container, Text } from "../components/Themed";
import { Context, downloadedBooks, navigate } from "../common/common";
import { BookRow } from "./SearchScreen";

export default function FavScreen({ navigation }) {
  const [context, setContext] = useContext(Context);
  let books = context.downloaded;
  if (books.length == 0) {
    return (
      <Container center={true}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Search");
          }}
        >
          <Text>Use the Search tab to download books.</Text>
        </TouchableOpacity>
      </Container>
    );
  }
  return (
    <Container>
      <FlatList
        data={books}
        style={{ flex: 1 }}
        keyExtractor={(book) => book.id}
        renderItem={(item) => {
          let b = item.item;
          return (
            <BookRow
              key={b.id}
              book={b}
              onPressBook={(b) => {
                navigate("Book", { id: b.id });
              }}
            >
              <Button
                onPress={() => {
                  navigate("Book", { id: b.id });
                }}
              >
                read
              </Button>
              <Button
                onPress={() => {
                  Alert.alert(
                    "Are you sure?",
                    "Do you want to delete: " + b.title + "?",
                    [
                      {
                        text: "Cancel",
                        onPress: () => {},
                        style: "cancel",
                      },
                      {
                        text: "OK",
                        onPress: async () => {
                          await FileSystem.deleteAsync(
                            FileSystem.documentDirectory +
                              "books/b-" +
                              b.id +
                              "/" +
                              b.id +
                              ".txt"
                          );
                          await FileSystem.deleteAsync(
                            FileSystem.documentDirectory + "books/b-" + b.id
                          );

                          let downloaded = await downloadedBooks(
                            context.booksByID
                          );
                          setContext({ ...context, downloaded });
                        },
                      },
                    ],
                    {
                      cancelable: true,
                      onDismiss: () => {},
                    }
                  );
                }}
              >
                delete
              </Button>
            </BookRow>
          );
        }}
      />
    </Container>
  );
}
