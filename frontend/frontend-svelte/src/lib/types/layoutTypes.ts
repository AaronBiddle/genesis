type SplitDirection = 'horizontal' | 'vertical';

interface WindowBase {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface BranchNode {
  type: 'branch';
  id: string;
  direction: SplitDirection;
  splitPosition: number; // 0-1 percentage
  children: [WindowNode, WindowNode];
}

interface LeafNode extends WindowBase {
  type: 'leaf';
  content: string; // Will hold component type later
}

type WindowNode = BranchNode | LeafNode;

interface WindowLayout {
  root: WindowNode;
  activeWindowId: string | null;
}

export type { SplitDirection, WindowBase, BranchNode, LeafNode, WindowNode, WindowLayout }; 