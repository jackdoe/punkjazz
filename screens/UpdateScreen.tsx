import * as React from "react";
import * as FileSystem from "expo-file-system";
import {
  Platform,
  SegmentedControlIOSComponent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, Err, Container, Button, themes } from "../components/Themed";
import { useState, useEffect } from "react";
import {
  indexURL,
  remoteCatalogURL,
  newIndex,
  remapBooks,
  Context,
} from "../common/common";
import { FileInfo } from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "react-native-gesture-handler";

// Source: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
const CSVToArray = function CSVToArray(
  strData: string,
  strDelimiter: string = ",",
  cb: (text: string[]) => void
) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = strDelimiter || ",";
  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    // Delimiters.
    "(\\" +
      strDelimiter +
      "|\\r?\\n|\\r|^)" +
      // Quoted fields.
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      // Standard fields.
      '([^"\\' +
      strDelimiter +
      "\\r\\n]*))",
    "gi"
  );
  // Create an array to hold our data. Give the array
  // a default empty first row.
  var current: Array<string> = [];
  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;
  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while ((arrMatches = objPattern.exec(strData))) {
    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[1];
    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (strMatchedDelimiter.length && strMatchedDelimiter != strDelimiter) {
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      cb(current);
      current = [];
    }
    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[2].replace(new RegExp('""', "g"), '"');
    } else {
      // We found a non-quoted value.
      var strMatchedValue = arrMatches[3];
    }
    // Now that we have our value string, let's add
    // it to the data array.
    current.push(strMatchedValue);
  }
};

export function DownloadButton({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState<string>("... downloading");
  const [started, setStarted] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [context, setContext] = React.useContext(Context);

  const download = () => {
    setStarted(true);

    setProgress("downloading -");
    let spinner = ["-", "/","|","\\"];
    let increment = 0;
    let timer = setInterval(() => {
      let symbol = spinner[increment++ % spinner.length];
      setProgress("downloading " + symbol);
    }, 1000);
    
    return fetch(remoteCatalogURL)
      .then((resp) => resp.text())
      .then((data) => {
        clearInterval(timer);
        let current = newIndex();
        setProgress("building the index");
        let docs = [];
        CSVToArray(data, ",", (row) => {
          if (row[0] == "Text#") return;
          // Text#,Type,Issued,Title,Language,Authors,Subjects,LoCC,Bookshelves
          let [
            id,
            type,
            issued,
            title,
            language,
            authors,
            subjects,
            locc,
            bookshelves,
          ] = row;
          if (type != "Text") return;
          let doc = {
            id,
            type,
            issued,
            title,
            language,
            authors,
            subjects,
            locc,
            bookshelves,
            everything: authors + " " + title,
          };
          docs.push(doc);
        });
        current.doIndex(docs, [
          "language",
          "bookshelves",
          "authors",
          "subjects",
          "title",
          "everything",
        ]);
        let serialized = current.serialize();
        setProgress("writing index to disk...");
        setContext({
          ...context,
          index: current,
          booksByID: remapBooks(current),
        });
        return FileSystem.writeAsStringAsync(indexURL, serialized);
      })
      .then(() => {
        setProgress(".. done");
        onDone();
      })
      .catch((err) => {
        console.log(err);
        setErr(err.message);
      })
      .finally(() => {
        setStarted(false);
      });
  };
  if (err != null) {
    return (
      <Err
        onPress={() => {
          setErr(null);
        }}
      >
        {err}
      </Err>
    );
  }
  if (started) {
    return <Text>{progress}</Text>;
  }

  return (
    <Button
      onPress={() => {
        return download();
      }}
    >
      <Text>download</Text>
    </Button>
  );
}

export default function UpdateScreen() {
  const [fileInfo, setFileInfo] = useState<FileInfo | undefined>(undefined);
  const [context, setContext] = React.useContext(Context);

  const getFileInfo = () => {
    FileSystem.getInfoAsync(indexURL)
      .then((fi) => {
        if (fi.size) setFileInfo(fi);
      })
      .catch((e) => {
        // silence if non existing
      });
  };
  useEffect(getFileInfo, []);
  let options = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const possible = Object.keys(themes);
  possible.sort();

  const fonts: Array<string> = ["merriweather","libre-baskerville","space-mono","3270"];
  if (Platform.OS == "ios") {
    fonts.push("Helvetica");
    fonts.push("Helvetica Neue");
    fonts.push("Helvetica-Light");
    fonts.push("HelveticaNeue-Light");
    fonts.push("HelveticaNeue-Medium");
    fonts.push("HelveticaNeue-Thin");
  } else {
    fonts.push("normal");
    fonts.push("notoserif");
    fonts.push("sans-serif");
    fonts.push("sans-serif-light");
    fonts.push("sans-serif-thin");
    fonts.push("sans-serif-condensed");
    fonts.push("sans-serif-medium");
    fonts.push("serif");
    fonts.push("Roboto");
    fonts.push("monospace");
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <Container center={true}>
        <Text>Settings/Update</Text>
        <View style={{ height: 20 }}></View>
        <Text>
          {fileInfo
            ? `index.json : ${fileInfo.size} bytes,  ${new Date(
                fileInfo.modificationTime * 1000
              ).toLocaleDateString(undefined, options)}`
            : "... no index yet, click download."}
        </Text>
        <DownloadButton onDone={getFileInfo}></DownloadButton>
        <Text style={{ padding: 20 }}>Theme</Text>

        {possible.map((e) => (
          <Button
            key={e}
            onPress={async () => {
              setContext({ ...context, theme: e });
              await AsyncStorage.setItem("theme", e);
            }}
          >
            {context.theme == e ? `>${e}<` : e}
          </Button>
        ))}
        <Text style={{ padding: 20 }}>Font</Text>

        {fonts.map((e) => (
          <Button
            key={"f_" + e}
            style={{ fontFamily: e }}
            onPress={async () => {
              setContext({ ...context, font: e });
              await AsyncStorage.setItem("font", e);
            }}
          >
            {context.font == e ? `>${e}<` : e}
          </Button>
        ))}
        <Text style={{ padding: 20 }}>Font Size</Text>
        {[12, 14, 16, 18, 20].map((e) => (
          <Button
            key={e}
            style={{ fontSize: e }}
            onPress={async () => {
              setContext({ ...context, fontSize: e });
              await AsyncStorage.setItem("fontSize", "" + e);
            }}
          >
            {context.fontSize == e ? `>${e}<` : e}
          </Button>
        ))}
      </Container>
    </ScrollView>
  );
}
