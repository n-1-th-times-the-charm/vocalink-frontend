export interface DocumentStyles {
  bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }
  
export interface DocumentSegment {
  text: string;
  styles: DocumentStyles;
}

export interface Segment extends DocumentSegment {
  id: string;
}