export interface BlockComponent {
  unload(): void;
}

export interface FrontendComponent extends BlockComponent {
  element: HTMLElement;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BackendComponent extends BlockComponent {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputComponent extends BlockComponent {}

export interface ContainerComponent extends BlockComponent {
  container: HTMLDivElement;
  scale: number;
  appendFrontend(frontend: FrontendComponent): void;
  get w(): number;
  get h(): number;
}
