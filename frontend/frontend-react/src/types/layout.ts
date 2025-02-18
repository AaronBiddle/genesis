import { TabbedWindowProps } from "../components/TabbedWindow";

export type WindowLayout =
  | {
      type: "leaf";
      tabProps: TabbedWindowProps;
    }
  | {
      type: "split";
      direction: "horizontal" | "vertical";
      first: WindowLayout;
      second: WindowLayout;
    };