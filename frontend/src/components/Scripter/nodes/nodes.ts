// frontend/src/components/Scripter/nodes.ts

export interface CommandNode {
  id: number;
  name: string;
  // Add other relevant properties for a command node later if needed
}

export const dummyCommands: CommandNode[] = [
  { id: 1, name: 'Dummy Command Alpha' },
  { id: 2, name: 'Dummy Command Beta' },
  { id: 3, name: 'Dummy Command Gamma' },
]; 