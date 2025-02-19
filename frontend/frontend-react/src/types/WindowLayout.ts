import { TabbedWindowProps } from "../components/TabbedWindow";

export interface TabProps {
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  onDocumentChange: (id: string) => void;
  onDocumentContentChange: (id: string, content: string) => void;
  onDocumentClose: (id: string) => void;
  markdownEnabled: boolean;
}

export type WindowLayout = null | {
  type: 'leaf';
  id: string;
  tabProps: TabProps;
} | {
  type: 'split';
  direction: 'horizontal' | 'vertical';
  first: WindowLayout;
  second: WindowLayout;
};

export interface UseWindowLayoutsResult {
  windowLayout: WindowLayout;
  setWindowLayout: (layout: WindowLayout | ((prev: WindowLayout) => WindowLayout)) => void;
  handleSplitContainer: (targetLayout: NonNullable<WindowLayout>, direction: 'horizontal' | 'vertical', windowId: string) => void;
  handleCloseContainer: (targetLayout: NonNullable<WindowLayout>) => void;
}