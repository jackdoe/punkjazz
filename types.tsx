export type RootStackParamList = {
  Root: undefined;
  Book: { id: string };
};

export type BottomTabParamList = {
  Fav: undefined;
  Search: { initialQuery: string };
  Update: undefined;
};

export type FavParamList = {
  FavScreen: undefined;
};

export type BookType = {
  title: string;
  id: string;
  authors: string;
  language: string;
  subjects: string;
  bookshelves: string;
  issued: string;
};

export type BooksByIDType = { [key: string]: BookType };
export type ContextType = {
  booksByID: BooksByIDType;
  index: any;
  downloaded: Array<BookType>;
  theme: string;
  font: string;
  fontSize: number;
};
