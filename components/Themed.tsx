/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import * as React from "react";
import {
  SafeAreaView,
  Text as DefaultText,
  TextInput as DefaultInput,
  TextInput,
  TouchableOpacity,
  View as DefaultView,
} from "react-native";
import { Context } from "../common/common";

export type TextProps = DefaultText["props"];
export type ViewProps = DefaultView["props"];
export type InputProps = DefaultInput["props"];
export const themes = {
  dark: {
    bgcolor: "#121314",
    color: "#d7d7d8",
  },

  light: {
    bgcolor: "#fafafb",
    color: "#223",
  },

  "sepia-dark": {
    bgcolor: "#1C161A",
    color: "#D7E2D1",
  },

  "sepia-light": {
    bgcolor: "#D5E1D0",
    color: "#171216",
  },

  eggplant: { bgcolor: "#2f2235", color: "#bfc3ba" },
};

function getLineHeight(font: string, fontSize: number) {
  switch (font) {
    case 'merriweather':
    case 'libre-baskerville':
      return fontSize * 1.5;
    default:
      return fontSize * 1.35;
  }
}

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  const [context, setContext] = React.useContext(Context);
  const t = themes[context.theme];
  const color = t.color;
  const lineHeight = getLineHeight(context.font, context.fontSize)
  return (
    <DefaultText
      {...otherProps}
      style={[
        { color: color, fontFamily: context.font, fontSize: context.fontSize, lineHeight },
        props.style,
      ]}
    />
  );
}

export function Err(props: TextProps) {
  const { style, ...otherProps } = props;
  return <Text style={[{ color: "red" }, style]} {...otherProps} />;
}

export function Button(props: TextProps) {
  const [context, setContext] = React.useContext(Context);
  const t = themes[context.theme];
  const color = t.color;

  const { onPress, ...otherProps } = props;
  return (
    <TouchableOpacity
      style={{
        alignItems: "center",
        borderRadius: 5,
        borderStyle: "dashed",
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: color,
      }}
      onPress={onPress}
    >
      <Text {...otherProps} />
    </TouchableOpacity>
  );
}

export function BlobButton({ onPress, text }) {
return <TouchableOpacity onPress={onPress}><Text>{text}</Text></TouchableOpacity>
}

export function SelectableText({ value }: { value: string }) {
  const [context, setContext] = React.useContext(Context);
  const t = themes[context.theme];
  const color = t.color;
  return (
    <TextInput
      multiline
      contextMenuHidden
      scrollEnabled={false}
      editable={false}
      style={[
        { color: color, fontFamily: context.font, fontSize: context.fontSize },
      ]}
      onSelectionChange={(e) => {
        console.log(e)
      }}
      value={value}
    />
  );
}
export function Input(props: InputProps) {
  const { style, ...otherProps } = props;
  const [context, setContext] = React.useContext(Context);
  const t = themes[context.theme];
  const color = t.color;

  return (
    <DefaultInput
      style={[
        {
          height: 40,
          backgroundColor: "gray",
          borderRadius: 10,
          padding: 5,
          color: color,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export function Container({
  center,
  children,
}: {
  center?: boolean;
  children: any;
}) {
  const [context, setContext] = React.useContext(Context);
  const t = themes[context.theme];
  let s = {
    flex: 1,
    backgroundColor: t.bgcolor,
    padding: 5,

  };
  if (center) {
    s = {
      ...s,
      justifyContent: "center",
      alignItems: "center",
    };
  }
  return <SafeAreaView style={s}><DefaultView style={{flex:1, margin: 5}}>{children}</DefaultView></SafeAreaView>;
}

export function DashedView(props) {
  const [context, setContext] = React.useContext(Context);
  const t = themes[context.theme];
  const color = t.color;
  const { style, ...otherProps } = props;

  return (
    <DefaultView
      style={[
        style,
        {
          borderRadius: 5,
          borderStyle: "dashed",
          borderWidth: 1,
          borderColor: color,
        },
      ]}
      {...otherProps}
    />
  );
}
